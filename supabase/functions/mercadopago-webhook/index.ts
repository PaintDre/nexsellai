import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  starter: { monthly: 14990, annual: 149900 },
  pro: { monthly: 34990, annual: 349900 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();

    // MP sends different notification types
    if (body.type !== "payment" && body.action !== "payment.created" && body.action !== "payment.updated") {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return new Response("No payment ID", { status: 200, headers: corsHeaders });
    }

    // === IDEMPOTENCY CHECK ===
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("id, status")
      .eq("mp_payment_id", String(paymentId))
      .eq("status", "approved")
      .maybeSingle();

    if (existingPayment) {
      console.log(`Payment ${paymentId} already processed, skipping`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Fetch payment details from MP
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });
    const payment = await mpRes.json();

    if (payment.status !== "approved") {
      console.log(`Payment ${paymentId} status: ${payment.status}`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Parse external_reference: "userId:planId:period"
    const ref = payment.external_reference;
    if (!ref) {
      console.error("No external_reference in payment");
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const [userId, planId, period] = ref.split(":");

    if (!userId || !planId) {
      console.error("Invalid external_reference:", ref);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // === AMOUNT VALIDATION ===
    const expectedPrices = PLAN_PRICES[planId];
    if (!expectedPrices) {
      console.error("Unknown plan in external_reference:", planId);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const expectedAmount = period === "annual" ? expectedPrices.annual : expectedPrices.monthly;
    if (payment.transaction_amount !== expectedAmount) {
      console.error(`Amount mismatch: expected ${expectedAmount}, got ${payment.transaction_amount} for plan ${planId}/${period}`);
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // === EXTERNAL_REFERENCE PROTECTION ===
    if (payment.preference_id) {
      const { data: pendingRecord } = await supabase
        .from("payments")
        .select("user_id")
        .eq("mp_preference_id", payment.preference_id)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingRecord && pendingRecord.user_id !== userId) {
        console.error(`User mismatch: preference belongs to ${pendingRecord.user_id}, but external_reference says ${userId}`);
        return new Response("OK", { status: 200, headers: corsHeaders });
      }
    }

    // === CALCULATE PLAN EXPIRATION ===
    const now = new Date();
    const expiresAt = new Date(now);
    if (period === "annual") {
      expiresAt.setDate(expiresAt.getDate() + 365);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // Update user plan + expiration
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ plan: planId, plan_expires_at: expiresAt.toISOString() })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Record/update payment with currency and provider
    const paymentCurrency = payment.currency_id || "CLP";
    const { data: upsertedPayment } = await supabase.from("payments").upsert({
      user_id: userId,
      plan: planId,
      amount: payment.transaction_amount || 0,
      period: period || "monthly",
      currency: paymentCurrency,
      provider: "mercadopago",
      mp_payment_id: String(paymentId),
      status: "approved",
    }, { onConflict: "mp_payment_id" }).select("id").single();

    // Also try updating by preference id
    if (payment.preference_id) {
      await supabase
        .from("payments")
        .update({ mp_payment_id: String(paymentId), status: "approved", currency: paymentCurrency })
        .eq("mp_preference_id", payment.preference_id)
        .eq("status", "pending");
    }

    // === CREATE SUBSCRIPTION RECORD ===
    const paymentRecordId = upsertedPayment?.id || null;
    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_id: planId,
      status: "active",
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_id: paymentRecordId,
    });

    // === SEND PAYMENT CONFIRMATION EMAIL ===
    try {
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
      if (authUser?.email) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", userId)
          .single();

        await fetch(`${supabaseUrl}/functions/v1/send-payment-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            email: authUser.email,
            name: userProfile?.full_name || "",
            planName: planId === "pro" ? "Pro" : "Starter",
            amount: payment.transaction_amount,
            period: period || "monthly",
            paymentId: String(paymentId),
            expiresAt: expiresAt.toISOString(),
          }),
        });
      }
    } catch (emailErr) {
      console.error("Error sending payment email (non-blocking):", emailErr);
    }

    console.log(`Payment approved: user=${userId}, plan=${planId}, currency=${paymentCurrency}, expires=${expiresAt.toISOString()}`);
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
