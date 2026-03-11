import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// CLP prices — the actual amount charged via MP (Chilean account)
const CLP_PRICES: Record<string, { monthly: number; annual: number; name: string }> = {
  starter: { monthly: 14990, annual: 149900, name: "Starter" },
  pro: { monthly: 34990, annual: 349900, name: "Pro" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const mpToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { planId, billingPeriod, countryCode } = await req.json();

    if (!CLP_PRICES[planId]) {
      return new Response(JSON.stringify({ error: "Plan inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const period = billingPeriod === "annual" ? "annual" : "monthly";
    const plan = CLP_PRICES[planId];
    const price = plan[period]; // Always CLP
    const title = `Nexsell ${plan.name} — ${period === "annual" ? "Anual" : "Mensual"}`;

    const origin = req.headers.get("origin") || "https://nexsellai.lovable.app";
    const webhookUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook`;

    // Build preference — enable international cards
    const preferenceBody: Record<string, unknown> = {
      items: [{
        title,
        quantity: 1,
        unit_price: price,
        currency_id: "CLP",
      }],
      back_urls: {
        success: `${origin}/pricing?status=success`,
        failure: `${origin}/pricing?status=failure`,
        pending: `${origin}/pricing?status=pending`,
      },
      auto_return: "approved",
      external_reference: `${userId}:${planId}:${period}`,
      notification_url: webhookUrl,
      // Enable all payment methods including international cards
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
      },
      // Binary mode: approved or rejected (no pending for cards)
      binary_mode: true,
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpToken}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      console.error("MP error:", mpData);
      return new Response(JSON.stringify({ error: "Error al crear checkout" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record pending payment with currency and provider info
    const adminSupabase = createClient(supabaseUrl, serviceKey);
    await adminSupabase.from("payments").insert({
      user_id: userId,
      plan: planId,
      amount: price,
      period,
      currency: "CLP",
      provider: "mercadopago",
      mp_preference_id: mpData.id,
      status: "pending",
    });

    return new Response(JSON.stringify({ url: mpData.init_point }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
