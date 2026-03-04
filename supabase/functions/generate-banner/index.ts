import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const templatePrompts: Record<string, string> = {
  "oferta-directa": `Create a bold promotional ecommerce sales banner. Requirements:
- Show the product name in LARGE bold text at the top
- Include a social proof bar at the very top: "⭐⭐⭐⭐⭐ 4.9/5 MÁS DE 5,000 CLIENTES SATISFECHOS"
- Show a compelling subtitle describing the main benefit
- Display crossed-out original price and new discounted price in large text ("Antes $X (tachado) AHORA $Y")
- List 3 key product benefits with small icons/checkmarks on the left side
- Place the product image prominently in the center-right area
- Use warm gradient background (pink/coral tones)
- Add urgency element like "OFERTA LIMITADA" or "ÚLTIMAS UNIDADES"
- Professional ecommerce aesthetic, clean typography, high contrast`,

  "hero-producto": `Create a premium product showcase banner for ecommerce. Requirements:
- Product name in bold, modern typography at the top
- Social proof badge: "⭐⭐⭐⭐⭐ 4.9/5 +5,000 clientes satisfechos"
- Clean subtitle with the main value proposition
- Product image large and centered as the hero element
- List 2-3 key benefits with icons alongside the product
- Minimalist gradient background (light to white)
- Price displayed clearly at the bottom
- Premium, aspirational feel with lots of white space`,

  "social-proof": `Create a testimonial-focused ecommerce banner. Requirements:
- Large 5-star rating display at the top: "⭐⭐⭐⭐⭐ 4.9/5"
- Counter: "MÁS DE 5,000 CLIENTES SATISFECHOS"
- Product name in bold
- 1-2 short customer testimonial quotes overlaid
- Product image visible and prominent
- Trust badges: "Envío Gratis", "Garantía 30 días", "Pago Seguro"
- Warm, trustworthy colors (amber/gold tones)
- Professional ecommerce layout`,

  "beneficios-grid": `Create a benefits-focused ecommerce banner. Requirements:
- Product name at the top in bold
- Social proof: "⭐⭐⭐⭐⭐ +5,000 clientes satisfechos"
- Product image in the center
- 3-4 benefit callouts arranged around the product with small icons
- Each benefit has an icon and 1-2 line description
- Clean layout with modern flat design
- Gradient background
- Price displayed at the bottom with CTA text`,

  "flash-sale": `Create an urgent flash sale ecommerce banner. Requirements:
- "VENTA FLASH" or "OFERTA RELÁMPAGO" in bold neon text
- Dark/black background with electric accent colors (neon green, cyan, or magenta)
- Product name in large bold text
- Massive discount display: "ANTES $X → AHORA $Y" with original price crossed out
- Large percentage badge: "-30%" or "-50%"
- Countdown timer aesthetic element
- Product image with glow effect
- "ÚLTIMAS UNIDADES" urgency text
- High energy, high contrast design`,

  "lifestyle": `Create a lifestyle ecommerce banner. Requirements:
- Product shown in natural use context/environment
- Warm, aspirational color palette (earth tones, soft pastels)
- Product name and short tagline in elegant typography
- Social proof: "⭐ 4.9/5 — Miles de clientes felices"
- 2-3 subtle benefit callouts
- Price displayed naturally
- Instagram-worthy aesthetic
- Aspirational, emotional feel`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, templateId, outputSize, sectionType, sectionTitle, landingId, blockContent } = await req.json();

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
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

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

    // Build prompt - adapt for section-specific or standalone banner
    const templateStyle = templatePrompts[templateId] || templatePrompts["oferta-directa"];
    const [width, height] = (outputSize || "1080x1080").split("x").map(Number);

    let sectionContext = "";
    if (sectionType) {
      const sectionDescriptions: Record<string, string> = {
        hero: "This is for the HERO section of a landing page. Create an impactful header-style banner that grabs attention.",
        benefits: "This is for the BENEFITS section. Show the product with benefit highlights visually represented.",
        offer: "This is for the OFFER/SALE section. Emphasize the deal, discount, and urgency.",
        testimonials: "This is for the TESTIMONIALS section. Create a social-proof focused banner with trust elements.",
        features: "This is for the FEATURES section. Showcase key product features in a clean visual layout.",
        cta: "This is for the CALL TO ACTION section. Create a compelling visual that drives the user to buy.",
      };
      sectionContext = `\n\nSection context: ${sectionDescriptions[sectionType] || `This is for the "${sectionType}" section of a landing page.`}`;
      if (sectionTitle) sectionContext += `\nSection title: "${sectionTitle}"`;
    }

    // Calculate offer prices for the prompt
    const originalPrice = product.price;
    const discountedPrice = Math.round(originalPrice * 0.7);
    const discountPercent = 30;

    // Extract benefits from landing block content if available
    const { blockContent } = await req.json().catch(() => ({ blockContent: null }));

    let benefitsText = "";
    if (product.description) {
      benefitsText = `\nKey benefits to highlight:\n- ${product.description}`;
    }

    const textPrompt = `Generate a professional ecommerce marketing banner image for the following product:

Product Name: ${product.name}
Original Price: $${originalPrice.toLocaleString("es-CL")} CLP
Discounted Price: $${discountedPrice.toLocaleString("es-CL")} CLP (${discountPercent}% OFF)
Category: ${product.category}
Description: ${product.description || "N/A"}
Target Audience: ${product.target_audience}
${benefitsText}

COPYWRITING STYLE INSTRUCTIONS:
${templateStyle}
${sectionContext}

CRITICAL DESIGN RULES:
- The banner dimensions are ${width}x${height} pixels
- ALL text on the banner MUST be in Spanish (Chile)
- Include the product name "${product.name}" prominently
- Show pricing: "Antes $${originalPrice.toLocaleString("es-CL")}" (crossed out) and "AHORA $${discountedPrice.toLocaleString("es-CL")}"
- Add social proof element at top: "⭐⭐⭐⭐⭐ 4.9/5  MÁS DE 5,000 CLIENTES SATISFECHOS"
- Include at least 2-3 key product benefits with small icons
- Use professional ecommerce aesthetic with clean typography
- NO watermarks, NO AI notices, NO stock photo text
- The design should look like a real ecommerce promotion banner from a professional Chilean store
- Make text readable and high contrast against the background`;

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
