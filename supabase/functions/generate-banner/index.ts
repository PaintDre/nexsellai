import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

// --- Professional agency-level prompt system ---

const SYSTEM_PROMPT = `Diseño de landing para e-commerce en formato historia 1080x1920.

Estilo hiperrealista, fotografía publicitaria profesional, composición rica en elementos visuales, profundidad de campo, iluminación cinematográfica.

Fondo negro elegante en toda la composición.

El producto debe verse extremadamente nítido y realista, con iluminación de estudio, reflejos suaves y sombras naturales.

Agregar elementos visuales modernos: degradados de luz, partículas brillantes, líneas de energía, figuras geométricas sutiles, destellos y efectos de profundidad.

Diseño dinámico, no plano.

Jerarquía tipográfica clara con:
- título grande
- subtítulo
- bullets cortos
- elementos de confianza
- precio en COP si aplica
- llamado a la acción si corresponde a la etapa AIDA

El producto debe ser el protagonista visual de la escena.

Respetar margen interno de 20 px en todos los bordes para evitar recortes.

Estilo premium de publicidad para e-commerce.

No caricaturas, no ilustración, solo estilo fotográfico hiperrealista.

Pensado para anuncios de Meta Ads y TikTok Ads.`;

const templatePrompts: Record<string, string> = {
  "hook-visual": `BANNER TYPE: HOOK — Stop the scroll.

GOAL: Create instant curiosity. The viewer sees this and MUST stop scrolling.

COMPOSITION:
- Product: 55-65% of canvas, centered hero shot, larger than life
- One bold provocative question OR shocking statement (max 6 words) in ultra-bold typography
- Background: derived from product colors, gradient or solid — whatever creates maximum contrast
- Optional: subtle motion lines or glow effect around product to draw the eye

MOOD: High energy, bold, attention-grabbing. The product should feel like it's jumping off the screen.`,

  "problema": `Diseño de imagen para landing de e-commerce en formato vertical 1080x1920.

Estilo hiperrealista de fotografía publicitaria profesional.

Fondo negro elegante con degradados suaves y ligeros destellos de luz para mantener un estilo premium.

La escena debe mostrar claramente el PROBLEMA que experimenta el cliente al no tener el producto.

Una persona aparece enfrentando la dificultad o frustración relacionada con el problema principal del producto. La expresión debe transmitir incomodidad, dificultad o frustración de manera natural y realista.

El producto puede aparecer de forma secundaria o insinuada, pero el foco visual principal es el problema.

Iluminación cinematográfica con sombras suaves y profundidad de campo para generar dramatismo.

Agregar elementos visuales sutiles como líneas de energía, partículas de luz o iconos pequeños que refuercen visualmente el problema.

Composición dinámica y visualmente rica, no plana.

Jerarquía tipográfica clara:
- Título grande en la parte superior que describa el problema del cliente
- Subtítulo corto que refuerce la frustración o dificultad que genera ese problema

Mantener márgenes internos de 20 px en todos los bordes para evitar cortes.

Estilo completamente fotográfico e hiperrealista, no ilustración ni caricatura.

Pensado para anuncios de Meta Ads y TikTok Ads.

ESTRUCTURA VISUAL:
- Parte superior: Título del problema
- Centro: Persona enfrentando el problema
- Parte inferior: Subtítulo corto que intensifique el dolor

EJEMPLO DE REFERENCIA:
Si el producto fuera un corrector de postura:
Título: "¿Pasas horas con dolor de espalda?"
Subtítulo: "La mala postura puede afectar tu día a día."

CLAVE PSICOLÓGICA:
La escena debe mostrar una situación con la que el cliente se identifique inmediatamente: frustración, incomodidad, pérdida de tiempo, dificultad, desorden, cansancio.
El usuario debe pensar: "Ese soy yo."`,

  "solucion": `Diseño de imagen para landing de e-commerce en formato vertical 1080x1920.

Estilo hiperrealista de fotografía publicitaria premium.

Fondo negro elegante con degradados de luz y efectos luminosos modernos para transmitir innovación y tecnología.

La escena debe mostrar claramente el producto como la SOLUCIÓN al problema presentado anteriormente.

El producto aparece en primer plano o siendo utilizado por una persona de manera natural (en la mano, aplicado, instalado o en uso dependiendo del producto).

La expresión de la persona debe transmitir alivio, comodidad o facilidad al usar el producto.

Iluminación cinematográfica con reflejos suaves sobre el producto para resaltarlo como protagonista.

Agregar elementos visuales modernos alrededor del producto como líneas luminosas, partículas brillantes, destellos o pequeños iconos señalando características clave.

Composición dinámica y visualmente rica, con profundidad de campo y enfoque claro en el producto.

Jerarquía tipográfica clara:
- Título grande en la parte superior que comunique que el producto es la solución
- Debajo del producto incluir 2–3 bullets cortos explicando: cómo funciona, por qué es práctico, qué lo hace diferente

Mantener márgenes internos de 20 px en todos los bordes para evitar cortes.

Estilo completamente fotográfico e hiperrealista, no ilustración ni caricatura.

Pensado para anuncios de Meta Ads y TikTok Ads.

ESTRUCTURA VISUAL:
- Parte superior: Título que presenta la solución
- Centro: Producto en uso o claramente visible
- Lateral o parte inferior: 2–3 bullets explicativos

EJEMPLO DE REFERENCIA:
Si el producto fuera una afeitadora eléctrica portátil:
Título: "La forma fácil de afeitarte en segundos"
Bullets:
✔ Diseño compacto y portátil
✔ Corte preciso y rápido
✔ Ideal para usar en cualquier lugar

CLAVE PSICOLÓGICA:
El cliente debe pensar inmediatamente: "Ah… así funciona."
No debe haber confusión. La escena debe explicar el producto en 1 segundo visual.`,

  "beneficio": `BANNER TYPE: KEY BENEFIT — One irresistible advantage.

GOAL: Highlight the single most compelling benefit that differentiates this product.

COMPOSITION:
- Product: 50% of canvas, prominently displayed
- ONE benefit statement in large bold text (max 6 words)
- Clean layout: product + benefit text + minimal supporting element
- Background: harmonious colors from the product's palette

MOOD: Confident, specific, tangible. The benefit should answer "What do I REALLY gain?"`,

  "prueba-social": `BANNER TYPE: SOCIAL PROOF — Build trust and credibility.

GOAL: Show that thousands trust this product. Create confidence through social proof.

COMPOSITION:
- Product: 40-50% of canvas, centered
- Large 5-star rating: "⭐⭐⭐⭐⭐ 4.9/5" prominently displayed
- Customer counter: "+5,000 clientes satisfechos"
- One short testimonial quote (max 10 words) with a name
- Gold/amber accents for ratings elements

MOOD: Warm, trustworthy, established. The product should feel proven and loved.`,

  "oferta": `BANNER TYPE: OFFER — Make the deal irresistible.

GOAL: Present the product with its price in a way that feels like incredible value.

COMPOSITION:
- Product: 50% of canvas, large and prominent
- Price displayed EXACTLY as provided — large, bold, unmissable
- Optional urgency element: "Disponible ahora" or "Stock limitado" (max 3 words)
- Background: energetic colors that complement the product

MOOD: Exciting, valuable, urgent. The viewer should feel this is a deal they can't miss.`,

  "cta": `BANNER TYPE: CTA — Close the sale NOW.

GOAL: This is the final push. Create an irresistible call to action.

COMPOSITION:
- Product: 45-55% of canvas, looking ready to be yours
- Large CTA button with action text: "Comprar Ahora", "Lo Quiero", "Pedir Hoy" (max 3 words)
- Final push message creating desire (max 6 words)
- Visual arrows or elements directing attention toward the CTA button
- CTA button must use a high-contrast color against the background

MOOD: Decisive, action-oriented, now-or-never. This banner should make them click.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, templateId, outputSize, sectionType, sectionTitle, landingId, blockContent, customText, bannerIndex, sequencePosition, totalInSequence, generationMode, bannerGoal, tone, visualStyle } = await req.json();

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

    // --- Build prompt ---
    const actualTemplateId = templateId || "hook-visual";
    const templateStyle = templatePrompts[actualTemplateId] || templatePrompts["hook-visual"];
    const [width, height] = (outputSize || "1080x1080").split("x").map(Number);

    const currencyCode = "CLP"; // Default currency
    const priceFormatted = formatPrice(product.price, currencyCode);

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
      sequenceInstruction = `\n\nSALES SEQUENCE: Banner ${sequencePosition} of ${totalInSequence}.
Stage: ${stageNames[actualTemplateId] || actualTemplateId}
CRITICAL: This banner's messaging must be COMPLETELY DIFFERENT from other banners in the sequence. Focus ONLY on this stage's unique angle.`;
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
      sectionContext = `\n\nSection context: ${sectionDescriptions[sectionType] || `Section: "${sectionType}".`}`;
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
      bannerIndexInstruction = `\n\nBANNER #${bannerIndex}: Make this visually DISTINCT from previous banners. Different angle, composition, and visual emphasis while maintaining professional coherence.`;
    }

    // Custom mode instructions
    let customModeInstruction = "";
    if (generationMode === "custom") {
      const goalMap: Record<string, string> = {
        sale: "Drive immediate sales — focus on urgency, price, and desire to purchase NOW.",
        offer: "Highlight a special offer or promotion — make the deal feel irresistible and time-sensitive.",
        awareness: "Build brand awareness — focus on product recognition, lifestyle association, and memorability.",
        benefit: "Communicate the key benefit — make the viewer instantly understand what they gain.",
      };
      const toneMap: Record<string, string> = {
        premium: "Use a PREMIUM tone: elegant, sophisticated, luxurious. Think high-end brand advertising with refined typography and muted, rich colors.",
        direct: "Use a DIRECT tone: clear, straightforward, no-nonsense. Bold statements, clean layout, zero fluff.",
        minimal: "Use a MINIMAL tone: ultra-clean, lots of whitespace, restrained color palette. Less is more — let the product breathe.",
        bold: "Use a BOLD tone: high energy, vibrant colors, large impactful typography. The banner should SHOUT for attention.",
      };
      const styleMap: Record<string, string> = {
        auto: "", // AI decides
        clean: "VISUAL STYLE: Clean and modern — crisp edges, flat or subtle gradients, organized grid-like composition.",
        premium: "VISUAL STYLE: Premium luxury — dark or rich backgrounds, gold/silver accents, dramatic lighting on the product.",
        ecommerce: "VISUAL STYLE: Classic ecommerce — product-centric, price badge, trust elements, optimized for marketplace feel.",
        bold: "VISUAL STYLE: Bold and graphic — strong geometric shapes, contrasting colors, poster-like composition.",
      };

      const goalInstruction = goalMap[bannerGoal] || "";
      const toneInstruction = toneMap[tone] || "";
      const styleInstruction = styleMap[visualStyle] || "";

      customModeInstruction = `\n\nCUSTOM MODE DIRECTIVES (follow these strictly):
${goalInstruction ? `\nMARKETING GOAL: ${goalInstruction}` : ""}
${toneInstruction ? `\nTONE: ${toneInstruction}` : ""}
${styleInstruction ? `\n${styleInstruction}` : ""}`;
    }

    const textPrompt = `Generate a professional ecommerce marketing banner image.

PRODUCT DATA:
- Name: ${product.name}
- Price: ${priceFormatted}
- Category: ${product.category}
- Target Audience: ${product.target_audience}
${benefitsText}

BANNER DIMENSIONS: ${width}x${height} pixels

${templateStyle}
${sectionContext}
${bannerIndexInstruction}
${sequenceInstruction}
${customModeInstruction}
${customText ? `\nCUSTOM SLOGAN (include prominently): "${customText}"` : ""}`;

    // Build messages with system prompt + product image
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
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
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
