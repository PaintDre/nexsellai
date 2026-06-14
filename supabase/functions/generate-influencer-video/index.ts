import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chargeCredits, refundCredits, insufficientCreditsResponse } from "../_shared/credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HF_API_KEY = Deno.env.get("HIGGSFIELD_API_KEY") ?? "";
const HF_API_SECRET = Deno.env.get("HIGGSFIELD_API_SECRET") ?? "";
const HF_AUTH = `Key ${HF_API_KEY}:${HF_API_SECRET}`;

interface Body {
  product_id?: string;
  image_url: string;
  audio_url: string;
  prompt?: string;
  script?: string;
  voice_id?: string;
  language?: string;
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!HF_API_KEY || !HF_API_SECRET) {
      return new Response(JSON.stringify({ error: "higgsfield_not_configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body.image_url || !body.audio_url) {
      return new Response(JSON.stringify({ error: "image_url and audio_url required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const voiceId = body.voice_id || "spanish_female";
    const language = body.language || "es";

    const charge = await chargeCredits(supabase, user.id, "influencer_video", body.product_id ?? null, {
      voice_id: voiceId, language,
    });
    if (!charge.success) {
      if (charge.error === "insufficient_credits") {
        return insufficientCreditsResponse(charge, corsHeaders, "influencer_video");
      }
      return new Response(JSON.stringify({ error: charge.error ?? "charge_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const modelId = "higgsfield-ai/speak";
    const promptText = (body.prompt && body.prompt.trim().length > 0)
      ? body.prompt.trim()
      : "A person speaking naturally to the camera, expressive face, soft natural lighting, premium cinematic look.";
    const hfRes = await fetch(`https://platform.higgsfield.ai/${modelId}`, {
      method: "POST",
      headers: {
        "Authorization": HF_AUTH,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        image_url: body.image_url,
        audio_url: body.audio_url,
        prompt: promptText,
      }),
    });

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      console.error("[generate-influencer-video] Higgsfield error:", hfRes.status, errText);
      if (charge.transactionId) {
        await refundCredits(supabase, charge.transactionId, "higgsfield_submit_failed");
      }
      return new Response(JSON.stringify({ error: "provider_error", detail: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hfData = await hfRes.json();
    const requestId = hfData.request_id as string;

    const { data: video, error: insertError } = await supabase
      .from("ai_influencers")
      .insert({
        user_id: user.id,
        product_id: body.product_id ?? null,
        source_image_url: body.image_url,
        script: body.script ?? body.prompt ?? null,
        audio_url: body.audio_url,
        voice_id: voiceId,
        language,
        model_id: modelId,
        provider_request_id: requestId,
        status: "queued",
        credits_charged: charge.charged ?? 0,
        credit_transaction_id: charge.transactionId ?? null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[generate-influencer-video] insert error:", insertError);
      if (charge.transactionId) {
        await refundCredits(supabase, charge.transactionId, "db_insert_failed");
      }
      return new Response(JSON.stringify({ error: "db_error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, video, balance: charge.balance }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[generate-influencer-video] unexpected:", err);
    return new Response(JSON.stringify({ error: "unexpected_error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});