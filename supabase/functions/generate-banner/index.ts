import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const templatePrompts: Record<string, string> = {
  "oferta-directa": `Create a professional Shopify-style product sales banner for dropshipping. Requirements:
- Product name in LARGE bold white text
- Price displayed EXACTLY as provided — large, clear, and prominent. Do NOT modify, discount, or invent prices
- Badge: "🚚 ENVÍO GRATIS" prominently visible
- Badge: "💰 PAGO CONTRAENTREGA" 
- CTA button: "COMPRAR AHORA" in a contrasting color
- Urgency strip: "⚡ OFERTA POR TIEMPO LIMITADO" or "🔥 ÚLTIMAS UNIDADES"
- Warm gradient background (coral/red/orange tones)
- Product image large and centered
- Trust badges at bottom: "✅ Entrega 24-48h" "✅ Garantía 30 días"
- Clean, professional ecommerce aesthetic like a real Shopify store`,

  "hero-producto": `Create a premium dark product showcase banner for dropshipping. Requirements:
- Dark/black gradient background for a luxury feel
- Product name in bold modern white typography, very prominent
- Price displayed EXACTLY as provided — large and clear. Do NOT modify or discount the price
- Product image large, centered, with subtle shadow/glow effect
- Minimal text: name, price, one tagline about the main benefit
- Badge: "🚚 Envío Gratis a Todo el País"
- Small trust indicators at bottom
- Premium, Apple-style minimalist aesthetic
- High-end Shopify store feel`,

  "social-proof": `Create a trust-focused ecommerce banner for dropshipping. Requirements:
- Large 5-star rating: "⭐⭐⭐⭐⭐ 4.9/5" at the top
- Counter: "MÁS DE 5,000 CLIENTES SATISFECHOS"
- Product name in bold
- 2 short fake testimonial quotes in quotation marks
- Product image visible and prominent
- Price displayed EXACTLY as provided. Do NOT modify or discount the price
- Trust badges row: "🚚 Envío Gratis" "🔒 Pago Seguro" "↩️ Garantía 30 días" "💰 Contraentrega"
- Warm amber/gold background tones
- Professional Shopify store aesthetic`,

  "beneficios-grid": `Create a benefits-focused product banner for dropshipping. Requirements:
- Product image centered and prominent
- Product name at the top in bold
- Price displayed EXACTLY as provided. Do NOT modify or discount the price
- 4 benefit icons arranged around the product in a grid-like layout:
  • "🚚 Envío Gratis"
  • "💰 Pago Contraentrega"  
  • "🔄 Garantía 30 días"
  • "⚡ Entrega Rápida"
- Clean emerald/teal gradient background
- Each benefit has a small icon and short text
- Professional, organized layout like a Shopify product page
- No excessive text, let the visual icons communicate`,

  "flash-sale": `Create an urgent flash sale banner for dropshipping. Requirements:
- "⚡ VENTA FLASH ⚡" in bold neon/electric text at the top
- Dark/black background with neon accent colors (electric cyan, magenta, or lime green)
- Product name in large bold text with glow effect
- Price displayed EXACTLY as provided — VERY LARGE. Do NOT modify or discount the price
- Countdown timer visual element (e.g., "QUEDAN 02:45:30")
- "🔥 ÚLTIMAS UNIDADES DISPONIBLES" urgency text
- Product image with neon glow/border effect
- Badges: "🚚 ENVÍO GRATIS" "💰 CONTRAENTREGA"
- High energy, high contrast, electric feel
- Gaming/tech store aesthetic`,

  "lifestyle": `Create a lifestyle/aspirational product banner for dropshipping. Requirements:
- Product shown in a warm, aspirational context
- Soft warm color palette (rose, peach, earth tones)
- Product name in elegant, modern typography
- Price displayed EXACTLY as provided. Do NOT modify or discount the price
- Short aspirational tagline about how the product improves life
- Social proof: "⭐ 4.9/5 — Miles de clientes felices"
- Subtle badges: "🚚 Envío Gratis" "💰 Contraentrega"
- Instagram-worthy aesthetic, lifestyle photography feel
- Aspirational, emotional connection
- Like a premium Shopify store's hero image`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, templateId, outputSize, sectionType, sectionTitle, landingId, blockContent, customText } = await req.json();

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

    const productPrice = product.price;

    let benefitsText = "";
    if (blockContent && Array.isArray(blockContent)) {
      benefitsText = `\nSection content/benefits to include on the banner:\n${blockContent.map((item: any) => typeof item === "string" ? `- ${item}` : `- ${JSON.stringify(item)}`).join("\n")}`;
    } else if (product.description) {
      benefitsText = `\nKey benefits to highlight:\n- ${product.description}`;
    }

    const textPrompt = `Generate a professional ecommerce marketing banner image for dropshipping. This is for a Shopify-style store.

Product Name: ${product.name}
Product Price: $${productPrice.toLocaleString("es-CL")} CLP
Category: ${product.category}
Description: ${product.description || "N/A"}
Target Audience: ${product.target_audience}
${benefitsText}

TEMPLATE STYLE:
${templateStyle}
${sectionContext}

CRITICAL RULES:
- Banner dimensions: ${width}x${height} pixels
- ALL text MUST be in Spanish
- Display the EXACT price "$${productPrice.toLocaleString("es-CL")} CLP" — do NOT invent discounts, do NOT show a "before/after" price, do NOT cross out any price
- Include the product name "${product.name}" prominently
- The design must look like a real professional Shopify/ecommerce store banner
- Include "Envío Gratis" and "Pago Contraentrega" badges where applicable
- NO watermarks, NO AI notices, NO stock photo text
- Make all text readable with high contrast against the background
- Professional Chilean ecommerce aesthetic${customText ? `\n\nIMPORTANT — Custom text/slogan to include PROMINENTLY and VISIBLY on the banner:\n"${customText}"` : ""}`;

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
