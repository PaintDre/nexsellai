import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FORMATS = [
  { name: "1x1", width: 1080, height: 1080 },
  { name: "4x5", width: 1080, height: 1350 },
  { name: "9x16", width: 1080, height: 1920 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const { product_id, product_name, image_url, show_name, badge } = await req.json();

  if (!image_url) {
    return new Response(JSON.stringify({ error: "No image_url" }), { status: 400, headers: corsHeaders });
  }

  // Check free plan limit
  const { data: profile } = await supabase.from("profiles").select("plan").eq("user_id", user.id).single();
  if (profile?.plan === "free") {
    const { count } = await supabase
      .from("dropi_ad_generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= 1) {
      return new Response(JSON.stringify({ error: "Free plan limit reached" }), { status: 403, headers: corsHeaders });
    }
  }

  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const generatedImages: { format: string; variation: number; url: string }[] = [];

  try {
    for (const format of FORMATS) {
      for (let v = 1; v <= 3; v++) {
        const placementHint = v === 1 ? "centered product" : v === 2 ? "product on the left with text on the right" : "product at the bottom with text above";
        const badgeText = badge ? `Include a promotional badge "${badge}" prominently.` : "";
        const nameText = show_name ? `Display the product name "${product_name}" in bold modern typography.` : "Do NOT include any product name text.";

        const prompt = `Create a professional e-commerce advertising image for Facebook/Instagram ads.
Format: ${format.width}x${format.height} pixels.
Layout: ${placementHint}.
${nameText}
${badgeText}
Use the product from the reference image as the main subject. Keep the product realistic and recognizable.
Modern, clean, high-contrast design with vibrant colors. Professional marketing quality.`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: image_url } },
                ],
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        const aiData = await aiRes.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (imageData) {
          // Upload to storage
          const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          const filePath = `${user.id}/${product_id}/${format.name}_v${v}.png`;

          await supabase.storage.from("dropi-ads").upload(filePath, bytes, {
            contentType: "image/png",
            upsert: true,
          });

          const { data: urlData } = supabase.storage.from("dropi-ads").getPublicUrl(filePath);
          generatedImages.push({ format: format.name, variation: v, url: urlData.publicUrl });
        }
      }
    }

    // Track generation
    await supabase.from("dropi_ad_generations").insert({
      user_id: user.id,
      dropi_product_id: product_id,
    });

    return new Response(JSON.stringify({ images: generatedImages }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
