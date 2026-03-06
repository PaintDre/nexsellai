import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Badge builder ---
interface BusinessConfig {
  currency?: string;
  badges?: string[];
  customBadge?: string;
  guaranteeDays?: string;
  deliveryTime?: string;
  tone?: string;
}

const CURRENCY_MAP: Record<string, { symbol: string; locale: string }> = {
  CLP: { symbol: "$", locale: "es-CL" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" },
  MXN: { symbol: "$", locale: "es-MX" },
  COP: { symbol: "$", locale: "es-CO" },
  ARS: { symbol: "$", locale: "es-AR" },
  BRL: { symbol: "R$", locale: "pt-BR" },
  PEN: { symbol: "S/", locale: "es-PE" },
};

function formatPrice(price: number, currencyCode: string): string {
  const info = CURRENCY_MAP[currencyCode] || { symbol: "$", locale: "en-US" };
  const formatted = price.toLocaleString(info.locale);
  return `${info.symbol}${formatted} ${currencyCode}`;
}

function buildBadgeList(config: BusinessConfig): string {
  const badges: string[] = [];
  const selected = config.badges || [];

  if (selected.includes("free_shipping")) badges.push("🚚 Envío Gratis");
  if (selected.includes("cod")) badges.push("💰 Pago Contraentrega");
  if (selected.includes("secure")) badges.push("🔒 Compra Segura");
  if (selected.includes("guarantee")) {
    const days = config.guaranteeDays || "30";
    badges.push(`↩️ Garantía ${days} días`);
  }
  if (selected.includes("fast_delivery")) {
    const time = config.deliveryTime || "24-48h";
    badges.push(`⚡ Entrega en ${time}`);
  }
  if (selected.includes("custom") && config.customBadge) {
    badges.push(`✅ ${config.customBadge}`);
  }

  return badges.length > 0
    ? `Trust badges to include in the banner: ${badges.join(" | ")}`
    : "Do NOT include any trust badges or shipping/payment icons in this banner.";
}

function getToneInstruction(tone: string): string {
  switch (tone) {
    case "urgent": return "Use URGENT, high-energy, FOMO-driven language. Scarcity and time pressure. Bold exclamations.";
    case "professional": return "Use PROFESSIONAL, clean, corporate language. Sophisticated and trustworthy. No hype.";
    case "casual": return "Use CASUAL, friendly, conversational language. Approachable and relatable. Emoji welcome.";
    case "luxury": return "Use PREMIUM, elegant, aspirational language. Minimalist and sophisticated. Less is more.";
    default: return "Use a confident, persuasive marketing tone.";
  }
}

// --- Template prompts (now generic, no hardcoded badges/currency) ---
const templatePrompts: Record<string, string> = {
  "hook-visual": `Create a scroll-stopping HOOK banner for social media advertising. The PRODUCT must be the absolute hero of the image.

COMPOSITION:
- Product occupies 50-60% of the banner, centered and prominent
- Background adapts to complement the product — analyze the product image and choose colors/gradients that make it POP
- One bold provocative question or shocking statement that creates instant curiosity
- Ultra-bold modern typography
- The product should look premium, desirable, and larger than life

VISUAL STYLE:
- Background: gradient, solid, textured, or ambient — whatever best highlights THIS specific product
- Dramatic lighting on the product — make it glow, shine, or stand out
- High contrast between text and background
- Professional ecommerce aesthetic

GOAL: Stop the scroll. The viewer sees the product and NEEDS to know more.`,

  "problema": `Create a PROBLEM AWARENESS banner where the product is still visible but the emotional context dominates.

COMPOSITION:
- Product shown smaller (30-40% of banner), positioned to the side
- Visual context showing the PROBLEM the customer faces without the product
- Empathetic text in bold typography addressing the customer's pain point
- Split composition: problem context on one side, product as the distant solution on the other
- Background colors that convey frustration but still complement the product

VISUAL STYLE:
- Muted/desaturated tones for the problem area, product area slightly brighter
- Bold modern typography
- The product is visible as a hint of the solution to come
- Professional layout with clear visual hierarchy

GOAL: Make the viewer feel understood — and notice the product waiting.`,

  "solucion": `Create a SOLUTION REVEAL banner where the product is presented as THE answer.

COMPOSITION:
- Product is the LARGEST element (60-70% of banner), front and center, hero shot
- Bright, optimistic background that complements the product colors
- Text presenting the product as the solution in bold typography
- Visual transition feel: from problem to bright solution
- Product shown in action or in its best angle, looking premium

VISUAL STYLE:
- Bright, clean, hopeful color palette derived from the product itself
- Product with dramatic lighting — make it look like the answer to everything
- Bold typography with high readability
- Professional transformation aesthetic

GOAL: The product IS the answer. Make it undeniable.`,

  "beneficio": `Create a KEY BENEFIT showcase banner with the product as the centerpiece.

COMPOSITION:
- Product occupies 50% of the banner, prominently displayed
- ONE main benefit highlighted with large bold text
- Visual icons or elements reinforcing the specific benefit around the product
- Clean layout: product + benefit statement + supporting visual elements
- Background complements and elevates the product

VISUAL STYLE:
- Colors derived from the product to create visual harmony
- Premium, confident design
- Bold statement typography answering "What do I REALLY gain?"
- The benefit should be specific and tangible, not generic

GOAL: Show the ONE thing that makes this product special. Product + benefit = irresistible.`,

  "prueba-social": `Create a SOCIAL PROOF banner with the product surrounded by trust signals.

COMPOSITION:
- Product centered (40-50% of banner)
- Large 5-star rating: "⭐⭐⭐⭐⭐ 4.9/5" prominently displayed near the product
- Customer counter: "+5,000 clientes satisfechos"
- 2-3 short testimonial quotes with names arranged around the product

VISUAL STYLE:
- Warm, trustworthy color palette that complements the product
- Professional review-style layout
- Gold/amber accents for ratings
- Product looks established and trusted
- Clean, credible typography

GOAL: Build confidence. The product is proven, trusted, and loved by thousands.`,

  "oferta": `Create an OFFER & INCENTIVE banner with the product and price as dual focal points.

COMPOSITION:
- Product large and prominent (50% of banner)
- Price displayed EXACTLY as provided — large, clear, unmissable. Do NOT modify, discount, or invent prices
- Urgency elements if appropriate for the communication tone

VISUAL STYLE:
- Energetic colors that complement the product
- Product looks premium and worth every penny
- Price typography large and bold
- Professional design
- Background enhances the product, not competes with it

GOAL: Make the deal irresistible. Product + price = must buy NOW.`,

  "cta": `Create a powerful CALL TO ACTION banner with the product and CTA button as the focal point.

COMPOSITION:
- Product prominent (45-55% of banner)
- Large, unmissable CTA button with action text
- Final push messaging creating urgency or desire
- Arrows or visual elements directing attention to the CTA

VISUAL STYLE:
- High energy colors complementing the product
- CTA button with contrasting color that stands out
- Action-oriented, decisive design
- Product looks ready to be yours
- Professional, bold typography

GOAL: This is the FINAL push. Product + CTA = click and buy NOW.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, templateId, outputSize, sectionType, sectionTitle, landingId, blockContent, customText, bannerIndex, sequencePosition, totalInSequence, businessConfig } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authUser.id;

    // Check plan and banner limits
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, banners_used, banners_reset_at")
      .eq("user_id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bannerLimits: Record<string, number> = { free: 2, starter: 30, pro: 150 };
    const limit = bannerLimits[profile.plan] || 2;

    let currentUsed = profile.banners_used || 0;
    const resetAt = profile.banners_reset_at ? new Date(profile.banners_reset_at) : null;
    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    if (!resetAt || (now.getTime() - resetAt.getTime()) >= thirtyDaysMs) {
      currentUsed = 0;
      await supabase
        .from("profiles")
        .update({ banners_used: 0, banners_reset_at: now.toISOString() })
        .eq("user_id", userId);
    }

    if (currentUsed >= limit) {
      return new Response(JSON.stringify({ error: `Has alcanzado el límite de banners de tu plan (${currentUsed}/${limit}). Actualiza tu plan para seguir generando banners.` }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Build dynamic prompt ---
    const actualTemplateId = templateId || "hook-visual";
    const templateStyle = templatePrompts[actualTemplateId] || templatePrompts["hook-visual"];
    const [width, height] = (outputSize || "1080x1080").split("x").map(Number);

    // Resolve business config (defaults for backward compatibility)
    const config: BusinessConfig = businessConfig || {
      currency: "CLP",
      badges: ["free_shipping", "cod"],
      tone: "urgent",
      guaranteeDays: "30",
      deliveryTime: "24-48h",
    };

    const currencyCode = config.currency || "CLP";
    const priceFormatted = formatPrice(product.price, currencyCode);
    const badgeInstruction = buildBadgeList(config);
    const toneInstruction = getToneInstruction(config.tone || "urgent");

    // Sequence context
    let sequenceInstruction = "";
    if (sequencePosition && totalInSequence) {
      const stageNames: Record<string, string> = {
        "hook-visual": "HOOK — captar atención",
        "problema": "PROBLEMA — identificar dolor",
        "solucion": "SOLUCIÓN — presentar respuesta",
        "beneficio": "BENEFICIO — ventaja clave",
        "prueba-social": "PRUEBA SOCIAL — generar confianza",
        "oferta": "OFERTA — motivar compra",
        "cta": "CTA — cerrar venta",
      };
      sequenceInstruction = `\n\nSALES SEQUENCE CONTEXT: This is banner ${sequencePosition} of ${totalInSequence} in a complete sales funnel sequence.
Current stage: ${stageNames[actualTemplateId] || actualTemplateId}
CRITICAL: Each banner in this sequence uses a completely different angle and messaging. This banner's role is specifically "${stageNames[actualTemplateId]}" — focus ONLY on this stage's unique messaging.`;
    }

    let sectionContext = "";
    if (sectionType) {
      const sectionDescriptions: Record<string, string> = {
        hero: "This is for the HERO section of a landing page.",
        benefits: "This is for the BENEFITS section.",
        offer: "This is for the OFFER/SALE section.",
        testimonials: "This is for the TESTIMONIALS section.",
        features: "This is for the FEATURES section.",
        cta: "This is for the CALL TO ACTION section.",
      };
      sectionContext = `\n\nSection context: ${sectionDescriptions[sectionType] || `This is for the "${sectionType}" section.`}`;
      if (sectionTitle) sectionContext += `\nSection title: "${sectionTitle}"`;
    }

    let benefitsText = "";
    if (blockContent && Array.isArray(blockContent)) {
      benefitsText = `\nContent to include:\n${blockContent.map((item: any) => typeof item === "string" ? `- ${item}` : `- ${JSON.stringify(item)}`).join("\n")}`;
    } else if (product.description) {
      benefitsText = `\nProduct description:\n${product.description}`;
    }

    let bannerIndexInstruction = "";
    if (bannerIndex && bannerIndex > 1) {
      bannerIndexInstruction = `\n\nBANNER INDEX: This is banner #${bannerIndex} in a sequence. Make it visually distinct from previous banners while maintaining the same template style. Use different angles, compositions, or visual emphasis.`;
    }

    const textPrompt = `Generate a professional ecommerce marketing banner image.

Product Name: ${product.name}
Product Price: ${priceFormatted}
Category: ${product.category}
Description: ${product.description || "N/A"}
Target Audience: ${product.target_audience}
${benefitsText}

TEMPLATE STYLE (Sales Funnel Stage):
${templateStyle}
${sectionContext}
${bannerIndexInstruction}

COMMUNICATION TONE:
${toneInstruction}

TRUST BADGES:
${badgeInstruction}

CRITICAL RULES:
- Banner dimensions: ${width}x${height} pixels
- ALL text MUST be in Spanish
- Display the EXACT price "${priceFormatted}" — do NOT invent discounts or crossed-out prices
- The PRODUCT must be the LARGEST and most prominent visual element in the banner
- Use the provided product image as direct reference — the product must look like the real product
- Background and colors must COMPLEMENT the product — analyze the product and choose what makes it stand out most
- DO NOT force dark/black backgrounds — choose whatever background best highlights this specific product
- Professional ecommerce aesthetic
- Bold, modern typography — large and readable
- NO watermarks, NO AI notices, NO stock photo text
- All text must be readable with high contrast
- Each banner in a sequence must have a unique visual identity while maintaining professional coherence${customText ? `\n\nIMPORTANT — Custom text/slogan to include PROMINENTLY:\n"${customText}"` : ""}${sequenceInstruction}`;

    // Build messages with product image if available
    const userContent: any[] = [{ type: "text", text: textPrompt }];
    
    if (product.images && product.images.length > 0) {
      userContent.push({
        type: "image_url",
        image_url: { url: product.images[0] },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: userContent }],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract base64 and upload to storage
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const fileName = `${userId}/${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from("banner-images")
      .upload(fileName, imageBytes, { contentType: "image/png" });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to save banner image" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = supabase.storage
      .from("banner-images")
      .getPublicUrl(fileName);

    // Save banner record and increment usage
    await supabase.from("banners").insert({
      user_id: userId,
      product_id: product.id || null,
      image_url: publicUrl.publicUrl,
      template_id: templateId,
      output_size: outputSize || "1080x1080",
    });

    await supabase
      .from("profiles")
      .update({ banners_used: (currentUsed + 1) })
      .eq("user_id", userId);

    // If this is for a landing section, update the landing blocks
    if (landingId && sectionType) {
      const { data: landing } = await supabase
        .from("landings")
        .select("blocks")
        .eq("id", landingId)
        .eq("user_id", userId)
        .single();

      if (landing && Array.isArray(landing.blocks)) {
        const updatedBlocks = (landing.blocks as any[]).map((block: any) => {
          if (block.type === sectionType) {
            return { ...block, image_url: publicUrl.publicUrl };
          }
          return block;
        });

        await supabase
          .from("landings")
          .update({ blocks: updatedBlocks })
          .eq("id", landingId)
          .eq("user_id", userId);
      }
    }

    return new Response(JSON.stringify({ imageUrl: publicUrl.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-banner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
