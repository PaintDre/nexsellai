import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FORMATS = [
  { name: "1x1", width: 1080, height: 1080, platform: "Instagram/Facebook feed" },
  { name: "4x5", width: 1080, height: 1350, platform: "Instagram/Facebook portrait" },
  { name: "9x16", width: 1080, height: 1920, platform: "Stories/Reels/TikTok" },
];

// LATAM-specific ad structure presets (Mercado Libre, Shein, Temu, Dropi, TikTok Shop)
type StructureKey = "price_urgency" | "lifestyle_benefit" | "direct_response";

interface LangPack {
  // headlines / labels
  offerToday: string;
  freeShipping: string;
  buyNow: string;
  beforeLabel: string;
  afterLabel: string;
  // generation guidance (keeps the AI on language)
  languageInstruction: string;
}

const LANG_PACKS: Record<string, LangPack> = {
  es: {
    offerToday: "OFERTA HOY",
    freeShipping: "ENVÍO GRATIS",
    buyNow: "PIDE AHORA",
    beforeLabel: "ANTES",
    afterLabel: "DESPUÉS",
    languageInstruction:
      "ALL text overlays must be in Spanish (Latin America / LATAM market). Use LATAM e-commerce conventions (precios en pesos, expresiones como ¡OFERTA!, ENVÍO GRATIS, PIDE AHORA, AGOTA STOCK).",
  },
  pt: {
    offerToday: "OFERTA HOJE",
    freeShipping: "FRETE GRÁTIS",
    buyNow: "COMPRE AGORA",
    beforeLabel: "ANTES",
    afterLabel: "DEPOIS",
    languageInstruction:
      "ALL text overlays must be in Brazilian Portuguese. Use Brazilian e-commerce conventions (FRETE GRÁTIS, COMPRE AGORA, OFERTA RELÂMPAGO, ÚLTIMAS UNIDADES).",
  },
  en: {
    offerToday: "TODAY'S DEAL",
    freeShipping: "FREE SHIPPING",
    buyNow: "SHOP NOW",
    beforeLabel: "BEFORE",
    afterLabel: "AFTER",
    languageInstruction:
      "ALL text overlays must be in clear, punchy English used in DTC/social commerce.",
  },
};

function getLangPack(lang?: string | null): LangPack {
  if (!lang) return LANG_PACKS.es;
  const code = lang.toLowerCase().slice(0, 2);
  return LANG_PACKS[code] ?? LANG_PACKS.es;
}

function buildStructurePrompt(
  structure: StructureKey,
  variation: number,
  productName: string,
  showName: boolean,
  badge: string | null,
  pack: LangPack,
  format: { width: number; height: number; platform: string },
): string {
  const nameRule = showName
    ? `Display the product name "${productName}" in BOLD modern sans-serif typography (max 4 words, large, high-contrast, never overlapping the product).`
    : `Do NOT include the product name. No brand text.`;

  const badgeRule = badge
    ? `Include a circular or ribbon-style PROMOTIONAL BADGE with the exact text "${badge}" in vibrant red/yellow contrasting color, placed top-right or top-left corner.`
    : ``;

  const baseRules = `
Output dimensions: ${format.width}x${format.height} pixels. Platform: ${format.platform}.
${pack.languageInstruction}
${nameRule}
${badgeRule}
Keep the product from the reference image as the HERO — realistic, recognizable, sharp focus, never distorted.
Professional e-commerce ad quality: high contrast, clean composition, strong visual hierarchy. NO watermarks, NO logos other than the badge.
Text rules: max 5-7 words per text block, super legible from a phone screen, sans-serif bold typography, no spelling mistakes.`;

  // ---- Variation 1: Price + Urgency (Mercado Libre / Temu style) ----
  if (structure === "price_urgency") {
    const layouts = [
      `Layout A: Product CENTERED on a vibrant solid background (deep red, electric yellow or hot pink). LARGE price tag bottom area with a fake "old price" struck-through and a NEW DISCOUNTED PRICE in huge bold numbers. Add an URGENCY label like "${pack.offerToday}" at the top in a bright contrasting color.`,
      `Layout B: Product on the LEFT (60% of canvas), pricing block on the RIGHT with discount percentage in a yellow burst shape (e.g. -50%). Add small text "${pack.freeShipping}" below the price.`,
      `Layout C: Product at the BOTTOM, pricing and urgency stack above (HUGE discounted price + countdown-style "${pack.offerToday}"). Background is a bold gradient (red to orange or purple to magenta).`,
    ];
    return `Create a high-conversion LATAM e-commerce price-urgency ad (Mercado Libre / Temu style).
${layouts[variation - 1]}
${baseRules}`;
  }

  // ---- Variation 2: Lifestyle Benefit (Shein / Dropi style) ----
  if (structure === "lifestyle_benefit") {
    const layouts = [
      `Layout A: Product CENTERED on a clean pastel or aspirational solid background (soft beige, sage green, blush pink, or muted navy). A short BENEFIT HEADLINE (3-5 words, e.g. "Ahorra tiempo. Vive mejor.") in elegant bold typography above the product.`,
      `Layout B: Product on the RIGHT, benefit headline (3-5 words) on the LEFT in big editorial typography. Minimalist composition, lots of negative space, premium feel.`,
      `Layout C: Product slightly off-center, lifestyle context background (subtle blurred home/desk/kitchen scene matching the product). Benefit headline at the top in clean white or dark contrasting type.`,
    ];
    return `Create a premium lifestyle-benefit ad (Shein / Dropi premium style) focused on emotional appeal, NOT on price.
${layouts[variation - 1]}
${baseRules}`;
  }

  // ---- Variation 3: Direct Response (split / before-after / multi-use) ----
  const layouts = [
    `Layout A: SPLIT the canvas in two halves. LEFT side labeled "${pack.beforeLabel}" showing a problem or messy/old scenario, RIGHT side labeled "${pack.afterLabel}" showing the product solving it. Bold CTA at the bottom: "${pack.buyNow}" in a vibrant button shape.`,
    `Layout B: Multi-use grid — split into 3 small scenes showing the product used in 3 different ways/contexts, with tiny labels under each. Bottom strip with CTA "${pack.buyNow}" + "${pack.freeShipping}".`,
    `Layout C: Product in the CENTER with arrows or callout labels pointing to 3 KEY FEATURES around it (short 2-3 word labels each). Bottom CTA bar: "${pack.buyNow}" in a vibrant pill button.`,
  ];
  return `Create a high-conversion DIRECT-RESPONSE ad (LATAM dropshipping / TikTok Shop style).
${layouts[variation - 1]}
${baseRules}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization");
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

  const body = await req.json();
  const {
    product_id,
    product_name,
    image_url,
    show_name,
    badge,
    structures, // optional array of StructureKey
    language,   // optional override; otherwise we read from profile
  }: {
    product_id: string;
    product_name: string;
    image_url: string;
    show_name: boolean;
    badge: string | null;
    structures?: StructureKey[];
    language?: string;
  } = body;

  if (!image_url) {
    return new Response(JSON.stringify({ error: "No image_url" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Load profile (plan + language)
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, language")
    .eq("user_id", user.id)
    .single();

  // Plan-based monthly (rolling 30 days) limit, configurable from /admin/config
  const plan = (profile?.plan ?? "free") as "free" | "starter" | "pro";
  const { data: limitsRow } = await supabase
    .from("system_config")
    .select("value")
    .eq("key", "dropi_ads_limits")
    .maybeSingle();
  const limits = (limitsRow?.value ?? { free: 1, starter: 30, pro: 150 }) as Record<string, number>;
  const planLimit = limits[plan] ?? 1;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count: usedCount } = await supabase
    .from("dropi_ad_generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since);

  if ((usedCount ?? 0) >= planLimit) {
    return new Response(
      JSON.stringify({ error: "Plan limit reached", limit: planLimit, used: usedCount ?? 0 }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const userLang = language || profile?.language || "es";
  const pack = getLangPack(userLang);

  // Default to all 3 structures if user did not pick
  const VALID: StructureKey[] = ["price_urgency", "lifestyle_benefit", "direct_response"];
  const selected: StructureKey[] =
    Array.isArray(structures) && structures.length > 0
      ? structures.filter((s): s is StructureKey => VALID.includes(s))
      : VALID;

  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const generatedImages: {
    format: string;
    structure: StructureKey;
    variation: number;
    url: string;
  }[] = [];

  try {
    for (const format of FORMATS) {
      for (const structure of selected) {
        // 1 high-quality variation per structure per format = 3 structures × 3 formats = 9 images
        // (matches existing "9 images" UX expectation)
        const variation = 1;
        const prompt = buildStructurePrompt(
          structure,
          variation,
          product_name,
          show_name,
          badge,
          pack,
          format,
        );

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

        if (!aiRes.ok) {
          console.error("AI gateway error", aiRes.status, await aiRes.text());
          continue;
        }

        const aiData = await aiRes.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageData) continue;

        const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const filePath = `${user.id}/${product_id}/${structure}_${format.name}.png`;

        await supabase.storage.from("dropi-ads").upload(filePath, bytes, {
          contentType: "image/png",
          upsert: true,
        });

        const { data: urlData } = supabase.storage.from("dropi-ads").getPublicUrl(filePath);
        generatedImages.push({
          format: format.name,
          structure,
          variation,
          url: urlData.publicUrl,
        });
      }
    }

    await supabase.from("dropi_ad_generations").insert({
      user_id: user.id,
      dropi_product_id: product_id,
    });

    return new Response(JSON.stringify({ images: generatedImages, language: userLang }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-dropi-ads failed", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
