import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Update user plan
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ plan: planId })
      .eq("user_id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // Record/update payment
    await supabase.from("payments").upsert({
      user_id: userId,
      plan: planId,
      amount: payment.transaction_amount || 0,
      period: period || "monthly",
      mp_payment_id: String(paymentId),
      status: "approved",
    }, { onConflict: "mp_payment_id" }).then(() => {});

    // Also try updating by preference id
    if (payment.preference_id) {
      await supabase
        .from("payments")
        .update({ mp_payment_id: String(paymentId), status: "approved" })
        .eq("mp_preference_id", payment.preference_id)
        .eq("status", "pending");
    }

    console.log(`Payment approved: user=${userId}, plan=${planId}`);
    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
