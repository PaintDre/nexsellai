import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// AIDA mini-pack for sub-phase 5.2: Hook → Beneficio → CTA.
const BANNER_SEQUENCE = [
  { templateId: "hook-visual", outputSize: "1080x1350" },
  { templateId: "beneficio", outputSize: "1080x1350" },
  { templateId: "cta", outputSize: "1080x1350" },
];

async function callGenerateBanner(
  authHeader: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; imageUrl?: string; error?: string; status: number }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-banner`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: (json as any)?.error ?? `http_${res.status}`, status: res.status };
  }
  return { ok: true, imageUrl: (json as any)?.imageUrl, status: res.status };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { productId, step } = await req.json().catch(() => ({}));
    if (!productId || typeof productId !== "string") {
      return new Response(JSON.stringify({ error: "productId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load product (owned by user)
    const { data: product, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (prodErr || !product) {
      return new Response(JSON.stringify({ error: "product_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load user profile for currency / country
    const { data: profile } = await supabase
      .from("profiles")
      .select("currency, country_code")
      .eq("user_id", user.id)
      .maybeSingle();

    // Create job
    const { data: job, error: jobErr } = await supabase
      .from("launch_jobs")
      .insert({
        user_id: user.id,
        product_id: product.id,
        status: "running",
        current_step: step ?? "banners",
        steps_completed: { product: true },
        assets: {},
      })
      .select()
      .single();
    if (jobErr || !job) {
      console.error("launch-campaign job insert error", jobErr);
      return new Response(JSON.stringify({ error: "job_create_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate banners sequentially, streaming progress into launch_jobs.assets.
    const banners: string[] = [];
    let firstError: { code: string; status: number } | null = null;

    for (let i = 0; i < BANNER_SEQUENCE.length; i++) {
      const cfg = BANNER_SEQUENCE[i];
      const result = await callGenerateBanner(authHeader, {
        product,
        templateId: cfg.templateId,
        outputSize: cfg.outputSize,
        bannerIndex: i + 1,
        sequencePosition: i + 1,
        totalInSequence: BANNER_SEQUENCE.length,
        currency: profile?.currency ?? "USD",
        country_code: profile?.country_code ?? null,
      });

      if (!result.ok || !result.imageUrl) {
        firstError = { code: result.error ?? "banner_failed", status: result.status };
        break;
      }
      banners.push(result.imageUrl);
      // Stream update so UI realtime shows progress
      await supabase
        .from("launch_jobs")
        .update({ assets: { banners } })
        .eq("id", job.id);
    }

    if (firstError) {
      await supabase
        .from("launch_jobs")
        .update({
          status: "failed",
          error_message: `banners:${firstError.code}`,
          assets: { banners },
        })
        .eq("id", job.id);
      return new Response(
        JSON.stringify({
          error: firstError.code,
          jobId: job.id,
          partialBanners: banners,
        }),
        {
          status: firstError.status >= 400 ? firstError.status : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Phase 5.2 done — mark banners step complete, move pointer to video.
    await supabase
      .from("launch_jobs")
      .update({
        status: "running",
        current_step: "video",
        steps_completed: { product: true, banners: true },
        assets: { banners },
      })
      .eq("id", job.id);

    return new Response(
      JSON.stringify({ jobId: job.id, banners }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("launch-campaign error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});