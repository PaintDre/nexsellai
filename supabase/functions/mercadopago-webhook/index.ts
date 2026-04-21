import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  starter: { monthly: 14990, annual: 149900 },
  pro: { monthly: 34990, annual: 349900 },
};

// Constant-time comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

type SignatureCheck =
  | { ok: true }
  | { ok: false; reason: string };

// Verifies HMAC-SHA256 signature of the Mercado Pago webhook
// Docs: https://www.mercadopago.cl/developers/es/docs/your-integrations/notifications/webhooks
async function verifyMpSignature(
  req: Request,
  dataId: string,
  secret: string,
): Promise<SignatureCheck> {
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    return { ok: false, reason: "Missing x-signature or x-request-id header" };
  }

  // x-signature format: "ts=1234567890,v1=abcdef..."
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k?.trim(), v?.trim()];
    }),
  );

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) {
    return { ok: false, reason: "Malformed x-signature header" };
  }

  // Replay protection: reject timestamps older than 5 minutes (or > 5 min in the future)
  const tsNumber = Number(ts);
  if (!Number.isFinite(tsNumber)) {
    return { ok: false, reason: "Invalid ts value" };
  }
  // MP timestamps are in milliseconds
  const nowMs = Date.now();
  const ageMs = Math.abs(nowMs - tsNumber);
  const FIVE_MIN_MS = 5 * 60 * 1000;
  if (ageMs > FIVE_MIN_MS) {
    return { ok: false, reason: `Timestamp outside 5-minute window (age=${ageMs}ms)` };
  }

  // Official MP template: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(manifest),
  );
  const computed = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (!timingSafeEqual(computed, v1)) {
    return { ok: false, reason: "Signature mismatch" };
  }
  return { ok: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;
    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET"); // opcional
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

    // === SIGNATURE VERIFICATION (opcional, solo si MP_WEBHOOK_SECRET está configurado) ===
    if (webhookSecret) {
      const valid = await verifyMpSignature(req, String(paymentId), webhookSecret);
      if (!valid) {
        console.error(`Invalid MP signature for payment ${paymentId}`);
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }
    } else {
      console.warn("MP_WEBHOOK_SECRET not set — skipping signature verification");
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
