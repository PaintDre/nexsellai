import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chargeCredits, refundCredits, insufficientCreditsResponse } from "../_shared/credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HF_API_KEY = Deno.env.get("HIGGSFIELD_API_KEY") ?? "";
const HF_API_SECRET = Deno.env.get("HIGGSFIELD_API_SECRET") ?? "";
const HF_AUTH = `Key ${HF_API_KEY}:${HF_API_SECRET}`;

const STYLE_PROMPTS: Record<string, string> = {
  showcase:
    "Cinematic product showcase: smooth slow camera orbit around the product, soft studio lighting, gentle light reflections, premium commercial feel, shallow depth of field, subtle dust particles floating in beams of light.",
  unboxing:
    "Hands gently presenting the product to camera, soft natural lighting, slight upward tilt revealing details, premium luxury feel, smooth handheld motion.",
  lifestyle:
    "The product placed in a real lifestyle setting, soft wind moving nearby elements, warm golden hour light, subtle background blur, cinematic shallow depth of field, slow dolly-in camera move.",
  dynamic:
    "Energetic motion: fast zoom-in on the product with light bursts, dramatic spotlights sweeping across, glowing energy particles, modern advertising aesthetic, slight camera shake.",
};

interface Body {
  product_id?: string;
  image_url: string;
  style?: keyof typeof STYLE_PROMPTS;
  duration?: number;
  aspect_ratio?: string;
  extra_prompt?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!HF_API_KEY || !HF_API_SECRET) {
      return new Response(JSON.stringify({ error: "higgsfield_not_configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body.image_url || typeof body.image_url !== "string") {
      return new Response(JSON.stringify({ error: "image_url required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const style = (body.style && STYLE_PROMPTS[body.style] ? body.style : "showcase") as keyof typeof STYLE_PROMPTS;
    const duration = Math.min(Math.max(body.duration ?? 5, 3), 10);
    const aspectRatio = body.aspect_ratio ?? "9:16";
    const prompt = `${STYLE_PROMPTS[style]}${body.extra_prompt ? " " + body.extra_prompt : ""}`;

    // Charge credits BEFORE submitting
    const charge = await chargeCredits(supabase, user.id, "product_video", body.product_id ?? null, {
      style,
      duration,
    });
    if (!charge.success) {
      if (charge.error === "insufficient_credits") {
        return insufficientCreditsResponse(charge, corsHeaders, "product_video");
      }
      return new Response(JSON.stringify({ error: charge.error ?? "charge_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Submit to Higgsfield
    const modelId = "higgsfield-ai/dop/standard";
    const hfRes = await fetch(`https://platform.higgsfield.ai/${modelId}`, {
      method: "POST",
      headers: {
        "Authorization": HF_AUTH,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        image_url: body.image_url,
        prompt,
        duration,
      }),
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      console.error("[generate-product-video] Higgsfield error:", hfRes.status, errText);
      if (charge.transactionId) {
        await refundCredits(supabase, charge.transactionId, "higgsfield_submit_failed");
      }
      return new Response(JSON.stringify({ error: "provider_error", detail: errText }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hfData = await hfRes.json();
    const requestId = hfData.request_id as string;

    // Insert row in DB
    const { data: video, error: insertError } = await supabase
      .from("product_videos")
      .insert({
        user_id: user.id,
        product_id: body.product_id ?? null,
        source_image_url: body.image_url,
        prompt,
        style,
        model_id: modelId,
        duration_sec: duration,
        aspect_ratio: aspectRatio,
        provider_request_id: requestId,
        status: "queued",
        credits_charged: charge.charged ?? 0,
        credit_transaction_id: charge.transactionId ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[generate-product-video] insert error:", insertError);
      if (charge.transactionId) {
        await refundCredits(supabase, charge.transactionId, "db_insert_failed");
      }
      return new Response(JSON.stringify({ error: "db_error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, video, balance: charge.balance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[generate-product-video] unexpected:", err);
    return new Response(JSON.stringify({ error: "unexpected_error", detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});