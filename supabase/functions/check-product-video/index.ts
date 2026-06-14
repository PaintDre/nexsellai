import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { refundCredits } from "../_shared/credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HF_API_KEY = Deno.env.get("HIGGSFIELD_API_KEY") ?? "";
const HF_API_SECRET = Deno.env.get("HIGGSFIELD_API_SECRET") ?? "";
const HF_AUTH = `Key ${HF_API_KEY}:${HF_API_SECRET}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { video_id } = (await req.json()) as { video_id: string };
    if (!video_id) {
      return new Response(JSON.stringify({ error: "video_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: video, error: vErr } = await supabase
      .from("product_videos")
      .select("*")
      .eq("id", video_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (vErr || !video) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already final — just return
    if (video.status === "completed" || video.status === "failed" || video.status === "nsfw") {
      return new Response(JSON.stringify({ video }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!video.provider_request_id) {
      return new Response(JSON.stringify({ video }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Poll Higgsfield
    const statusRes = await fetch(
      `https://platform.higgsfield.ai/requests/${video.provider_request_id}/status`,
      { headers: { "Authorization": HF_AUTH, "Accept": "application/json" } },
    );
    if (!statusRes.ok) {
      const errText = await statusRes.text();
      console.error("[check-product-video] status error:", statusRes.status, errText);
      return new Response(JSON.stringify({ video, provider_error: errText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const statusData = await statusRes.json();
    const newStatus = statusData.status as string;

    let updated: Record<string, unknown> = { status: newStatus };

    if (newStatus === "completed" && statusData.video?.url) {
      // Download video and upload to our bucket
      try {
        const videoUrl = statusData.video.url as string;
        const vidRes = await fetch(videoUrl);
        const buf = new Uint8Array(await vidRes.arrayBuffer());
        const path = `${user.id}/${video.id}.mp4`;
        const { error: upErr } = await supabase.storage
          .from("product-videos")
          .upload(path, buf, { contentType: "video/mp4", upsert: true });
        if (upErr) {
          console.error("[check-product-video] upload error:", upErr);
          updated.video_url = videoUrl; // fallback to provider URL
        } else {
          const { data: pub } = supabase.storage.from("product-videos").getPublicUrl(path);
          updated.video_url = pub.publicUrl;
        }
        if (statusData.images?.[0]?.url) updated.thumbnail_url = statusData.images[0].url;
      } catch (e) {
        console.error("[check-product-video] download error:", e);
        updated.video_url = statusData.video.url;
      }
    } else if (newStatus === "failed" || newStatus === "nsfw") {
      updated.error_message = statusData.message ?? newStatus;
      if (video.credit_transaction_id) {
        await refundCredits(supabase, video.credit_transaction_id, newStatus);
      }
    }

    const { data: refreshed } = await supabase
      .from("product_videos")
      .update(updated)
      .eq("id", video.id)
      .select()
      .single();

    return new Response(JSON.stringify({ video: refreshed ?? video }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[check-product-video] unexpected:", err);
    return new Response(JSON.stringify({ error: "unexpected_error", detail: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});