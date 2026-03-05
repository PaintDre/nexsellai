import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const templatePrompts: Record<string, string> = {
  "hook-visual": `Create an attention-grabbing HOOK banner for social media advertising. Requirements:
- The banner must STOP the scroll — maximum visual impact
- Use a bold, provocative question or shocking statement related to the product
- Large eye-catching typography that demands attention
- Dramatic visual composition with the product as the focal point
- High contrast colors and bold design elements
- The viewer should feel compelled to keep watching/reading
- Style: bold, disruptive, curiosity-inducing
- This is the FIRST banner in a sales sequence — it must hook the viewer instantly`,

  "problema": `Create an empathy-driven PROBLEM AWARENESS banner. Requirements:
- Identify and visualize the customer's pain point or frustration
- Use emotional imagery that the target audience relates to
- Include text like "¿Te pasa esto?" or "¿Cansado de...?"
- Show the negative situation BEFORE having the product
- Dark, moody tones to convey the problem/frustration
- The viewer should think "YES, that's exactly my problem!"
- Style: emotional, relatable, empathetic
- This is the PROBLEM stage — make the viewer feel understood`,

  "solucion": `Create a SOLUTION REVEAL banner for the product. Requirements:
- Present the product as THE answer to the customer's problem
- Transition from dark/problem to bright/hopeful visual tone
- Product displayed prominently as the hero/savior
- Text like "La solución existe" or "Descubre cómo..."
- Show the product in action or solving the problem
- Clean, bright, optimistic design
- Before/after visual transition feel
- Style: hopeful, revealing, transformative
- This is the SOLUTION stage — the product is the answer`,

  "beneficio": `Create a KEY BENEFIT showcase banner. Requirements:
- Highlight ONE main competitive advantage of the product
- Large, bold statement about the primary benefit
- Visual proof or representation of the benefit
- Use icons or visual elements to reinforce the message
- Premium, clean design that communicates value
- The benefit should be specific and tangible, not generic
- Text should answer "What do I REALLY gain?"
- Style: confident, clear, value-focused
- This is the BENEFIT stage — show what makes this product special`,

  "prueba-social": `Create a SOCIAL PROOF trust-building banner. Requirements:
- Large 5-star rating: "⭐⭐⭐⭐⭐ 4.9/5" prominently displayed
- Customer counter: "+5,000 clientes satisfechos"
- 2-3 short testimonial quotes with names
- Trust badges: "🔒 Pago Seguro" "🚚 Envío Gratis" "↩️ Garantía 30 días"
- Product image visible alongside the social proof
- Warm, trustworthy color palette (gold, amber tones)
- Professional review-style layout
- Style: trustworthy, credible, reassuring
- This is the SOCIAL PROOF stage — build confidence to buy`,

  "oferta": `Create an OFFER & INCENTIVE banner for dropshipping. Requirements:
- Price displayed EXACTLY as provided — large, clear, prominent. Do NOT modify, discount, or invent prices
- Badge: "🚚 ENVÍO GRATIS" prominently visible
- Badge: "💰 PAGO CONTRAENTREGA"
- Urgency elements: "⏱ OFERTA POR TIEMPO LIMITADO" or "🔥 ÚLTIMAS UNIDADES"
- Product image large and centered
- Trust badges: "✅ Entrega 24-48h" "✅ Garantía 30 días"
- Warm gradient background (coral/red/orange tones)
- Style: urgent, valuable, irresistible
- This is the OFFER stage — make the deal too good to pass up`,

  "cta": `Create a powerful CALL TO ACTION banner. Requirements:
- Large, unmissable CTA button: "COMPRAR AHORA" or "¡LO QUIERO!"
- Final push messaging: "¡No te quedes sin el tuyo!" or "Últimas unidades disponibles"
- Product image with the CTA as the clear focal point
- Arrows or visual elements pointing to the CTA
- High energy, action-oriented design
- Include "🚚 Envío Gratis" and "💰 Pago Contraentrega" as final reassurance
- Countdown or scarcity element
- Style: energetic, decisive, action-driving
- This is the FINAL stage — push the viewer to click and buy NOW`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, templateId, outputSize, sectionType, sectionTitle, landingId, blockContent, customText, variation, bannerIndex } = await req.json();

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
    const templateStyle = templatePrompts[templateId] || templatePrompts["hook-visual"];
    const [width, height] = (outputSize || "1080x1080").split("x").map(Number);

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

    // Variation instruction
    let variationInstruction = "";
    if (variation === 2) {
      variationInstruction = `\n\nVARIATION INSTRUCTION: This is variation #2. Create a DISTINCTLY DIFFERENT version:
- Use a different color scheme or visual approach
- Different typography arrangement and layout composition
- Different visual emphasis (e.g., if v1 focuses on product, v2 focuses on text/message)
- Keep the same sales message but present it in a visually unique way`;
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
${variationInstruction}
${bannerIndexInstruction}

CRITICAL RULES:
- Banner dimensions: ${width}x${height} pixels
- ALL text MUST be in Spanish
- Display the EXACT price "$${productPrice.toLocaleString("es-CL")} CLP" — do NOT invent discounts or crossed-out prices
- Include the product name "${product.name}" prominently
- Professional Shopify/ecommerce store aesthetic
- Include "Envío Gratis" and "Pago Contraentrega" badges where applicable
- NO watermarks, NO AI notices, NO stock photo text
- All text must be readable with high contrast
- Professional Chilean ecommerce aesthetic${customText ? `\n\nIMPORTANT — Custom text/slogan to include PROMINENTLY:\n"${customText}"` : ""}`;

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
