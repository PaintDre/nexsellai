import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const templatePrompts: Record<string, string> = {
  "hook-visual": `Create a scroll-stopping HOOK banner for social media advertising. The PRODUCT must be the absolute hero of the image.

COMPOSITION:
- Product occupies 50-60% of the banner, centered and prominent
- Background adapts to complement the product — analyze the product image and choose colors/gradients that make it POP
- One bold provocative question or shocking statement that creates instant curiosity
- Ultra-bold modern typography (influencer/dropshipping style)
- The product should look premium, desirable, and larger than life

VISUAL STYLE:
- Background: gradient, solid, textured, or ambient — whatever best highlights THIS specific product
- Dramatic lighting on the product — make it glow, shine, or stand out
- High contrast between text and background
- Professional ecommerce aesthetic
- Trust badges subtly integrated: "🚚 Envío Gratis" "💰 Pago Contraentrega"

GOAL: Stop the scroll. The viewer sees the product and NEEDS to know more.`,

  "problema": `Create a PROBLEM AWARENESS banner where the product is still visible but the emotional context dominates.

COMPOSITION:
- Product shown smaller (30-40% of banner), positioned to the side
- Visual context showing the PROBLEM the customer faces without the product
- Empathetic text: "¿Te pasa esto?" or "¿Cansado de...?" in bold typography
- Split composition: problem context on one side, product as the distant solution on the other
- Background colors that convey frustration but still complement the product

VISUAL STYLE:
- Muted/desaturated tones for the problem area, product area slightly brighter
- Bold modern typography
- The product is visible as a hint of the solution to come
- Professional layout with clear visual hierarchy

GOAL: Make the viewer feel understood. "YES, that's my problem!" — and notice the product waiting.`,

  "solucion": `Create a SOLUTION REVEAL banner where the product is presented as THE answer.

COMPOSITION:
- Product is the LARGEST element (60-70% of banner), front and center, hero shot
- Bright, optimistic background that complements the product colors
- Text like "La solución existe" or "Descubre cómo..." in bold typography
- Visual transition feel: from problem to bright solution
- Product shown in action or in its best angle, looking premium

VISUAL STYLE:
- Bright, clean, hopeful color palette derived from the product itself
- Product with dramatic lighting — make it look like the answer to everything
- Bold typography with high readability
- "🚚 Envío Gratis" badge integrated
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
- Trust and quality visual cues

GOAL: Show the ONE thing that makes this product special. Product + benefit = irresistible.`,

  "prueba-social": `Create a SOCIAL PROOF banner with the product surrounded by trust signals.

COMPOSITION:
- Product centered (40-50% of banner)
- Large 5-star rating: "⭐⭐⭐⭐⭐ 4.9/5" prominently displayed near the product
- Customer counter: "+5,000 clientes satisfechos"
- 2-3 short testimonial quotes with names arranged around the product
- Trust badges: "🔒 Compra Segura" "🚚 Envío Gratis" "↩️ Garantía 30 días"

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
- Badge: "🚚 ENVÍO GRATIS" prominently visible
- Badge: "💰 PAGO CONTRAENTREGA"
- Urgency elements: "⏱ OFERTA POR TIEMPO LIMITADO" or "🔥 ÚLTIMAS UNIDADES"
- Trust badges: "✅ Entrega 24-48h" "✅ Garantía 30 días"

VISUAL STYLE:
- Energetic colors that complement the product — warm tones, urgency feel
- Product looks premium and worth every penny
- Price typography large and bold
- Professional urgency without looking cheap
- Background enhances the product, not competes with it

GOAL: Make the deal irresistible. Product + price + free shipping = must buy NOW.`,

  "cta": `Create a powerful CALL TO ACTION banner with the product and CTA button as the focal point.

COMPOSITION:
- Product prominent (45-55% of banner)
- Large, unmissable CTA button: "COMPRAR AHORA" or "¡LO QUIERO!"
- Final push messaging: "¡No te quedes sin el tuyo!" or "Últimas unidades disponibles"
- Arrows or visual elements directing attention to the CTA
- "🚚 Envío Gratis" and "💰 Pago Contraentrega" as final reassurance

VISUAL STYLE:
- High energy colors complementing the product
- CTA button with contrasting color that stands out
- Action-oriented, decisive design
- Product looks ready to be yours
- Countdown or scarcity visual element
- Professional, bold typography

GOAL: This is the FINAL push. Product + CTA = click and buy NOW.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, templateId, outputSize, sectionType, sectionTitle, landingId, blockContent, customText, bannerIndex, sequencePosition, totalInSequence } = await req.json();

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

    // Check plan
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("user_id", userId)
      .single();

    if (!profile || profile.plan === "free") {
      return new Response(JSON.stringify({ error: "Banner generation requires Starter or Pro plan" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check monthly limits
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("banners")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth.toISOString());

    const limits: Record<string, number> = { starter: 5, pro: 50 };
    const limit = limits[profile.plan] || 5;
    if ((count || 0) >= limit) {
      return new Response(JSON.stringify({ error: `Monthly banner limit reached (${limit})` }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build prompt
    const actualTemplateId = templateId || "hook-visual";
    const templateStyle = templatePrompts[actualTemplateId] || templatePrompts["hook-visual"];
    const [width, height] = (outputSize || "1080x1080").split("x").map(Number);

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

    const productPrice = product.price;

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

    const textPrompt = `Generate a professional ecommerce marketing banner image for dropshipping.

Product Name: ${product.name}
Product Price: $${productPrice.toLocaleString("es-CL")} CLP
Category: ${product.category}
Description: ${product.description || "N/A"}
Target Audience: ${product.target_audience}
${benefitsText}

TEMPLATE STYLE (Sales Funnel Stage):
${templateStyle}
${sectionContext}
${bannerIndexInstruction}

CRITICAL RULES:
- Banner dimensions: ${width}x${height} pixels
- ALL text MUST be in Spanish
- Display the EXACT price "$${productPrice.toLocaleString("es-CL")} CLP" — do NOT invent discounts or crossed-out prices
- The PRODUCT must be the LARGEST and most prominent visual element in the banner
- Use the provided product image as direct reference — the product must look like the real product
- Background and colors must COMPLEMENT the product — analyze the product and choose what makes it stand out most
- DO NOT force dark/black backgrounds — choose whatever background best highlights this specific product
- Professional influencer/dropshipping ecommerce aesthetic
- Include "Envío Gratis" and "Pago Contraentrega" badges where applicable
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

    // Save banner record
    await supabase.from("banners").insert({
      user_id: userId,
      product_id: product.id || null,
      image_url: publicUrl.publicUrl,
      template_id: templateId,
      output_size: outputSize || "1080x1080",
    });

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
