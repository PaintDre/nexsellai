import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Block {
  type: string;
  title: string;
  content: string | unknown[];
  order: number;
}

interface PlanConfig {
  blockTypes: string[];
  blockCount: number;
  limit: number;
}

interface PromptParams {
  product: { name: string; category: string; price: number; target_audience: string; description?: string };
  mode: string;
  intensity: string;
  hasOffer: boolean;
  guarantee?: string;
  plan: string;
}

// ─── Plan Configuration ─────────────────────────────────────────────────────

function getPlanConfig(plan: string): PlanConfig {
  const configs: Record<string, PlanConfig> = {
    free: {
      blockTypes: ["hero", "benefits", "cta"],
      blockCount: 3,
      limit: 1,
    },
    starter: {
      blockTypes: ["hero", "benefits", "features", "testimonials", "objections", "faq", "urgency", "cta"],
      blockCount: 8,
      limit: 10,
    },
    pro: {
      blockTypes: ["hero", "benefits", "features", "testimonials", "objections", "comparison", "bundles", "offer", "urgency", "guarantee", "faq", "microcopy", "cta"],
      blockCount: 13,
      limit: 100,
    },
  };
  return configs[plan] || configs.free;
}

// ─── Plan-Specific Prompt Sections ──────────────────────────────────────────

function buildPlanSections(plan: string): string {
  const sections: Record<string, string> = {
    free: `Generate EXACTLY these 3 blocks in this order:
1. hero (order: 1) — One powerful headline + short description. Simple and direct.
2. benefits (order: 2) — 3 key benefits as an array of strings.
3. cta (order: 3) — Final call to action with urgency text.

Do NOT generate any other blocks. Keep copy simple and informative.`,

    starter: `Generate EXACTLY these 8 blocks in this order:
1. hero (order: 1) — Strong headline with emotional hook + compelling description.
2. benefits (order: 2) — 4-6 benefits as array of strings. Each benefit should highlight an outcome.
3. features (order: 3) — 4-6 product features as array of strings with specific details.
4. testimonials (order: 4) — 3 trust-oriented phrases as array of strings. Use generic phrasing like "Nuestros clientes confirman que..." — do NOT invent specific names, dates, or quantified results.
5. objections (order: 5) — 3-4 common objections addressed as array of strings.
6. faq (order: 6) — 4-6 FAQ items as array of {q, a} objects with detailed answers.
7. urgency (order: 7) — Urgency message as string. Use time-based or availability-based phrasing WITHOUT inventing specific stock numbers.
8. cta (order: 8) — Strong final CTA with benefit reminder.`,

    pro: `Generate EXACTLY these 13 blocks in this order:
1. hero (order: 1) — Premium headline with multiple psychological angles. Title = best hook. Content = compelling description with emotional triggers.
2. benefits (order: 2) — 6 outcome-focused benefits as array of strings. Use "Imagina..." or "¿Sabías que...?" framing.
3. features (order: 3) — 6-8 detailed features as array of strings. Technical + emotional.
4. testimonials (order: 4) — 4-6 trust-oriented phrases as array of strings. Use generic phrasing like "Nuestros clientes confirman que..." — do NOT invent specific names, dates, or quantified results.
5. objections (order: 5) — 5-6 objections addressed with evidence, as array of strings.
6. comparison (order: 6) — 6 category-level comparison points as array of strings. Frame as general advantages of this type of product. Do NOT name specific competitors.
7. bundles (order: 7) — 3 bundle/pack suggestions as array of strings with pricing hints.
8. offer (order: 8) — Special offer block. Only include discounted price if hasOffer is true, otherwise use value-based framing.
9. urgency (order: 9) — Urgency triggers using time or availability phrasing. Do NOT invent specific stock numbers.
10. guarantee (order: 10) — Guarantee block. Use provided guarantee text if available, otherwise use a generic satisfaction guarantee.
11. faq (order: 11) — 6-8 detailed FAQ items as array of {q, a} objects.
12. microcopy (order: 12) — 4-6 trust signals as array of strings ("Pago 100% seguro", "Envío en 24-48h", etc.).
13. cta (order: 13) — Premium CTA with multiple benefit reminders and final urgency push.`,
  };
  return sections[plan] || sections.free;
}

// ─── System Prompt Builder ──────────────────────────────────────────────────

function buildSystemPrompt(params: PromptParams): string {
  const { product, mode, intensity, hasOffer, guarantee, plan } = params;

  const intensityMap: Record<string, string> = { soft: "low", medium: "medium", hard: "high" };
  const mappedIntensity = intensityMap[intensity] || "medium";

  const saasContext = product.category === "saas"
    ? `\n## SAAS PRODUCT CONTEXT\nThis is a SaaS/app product. Adapt the copy to sell software: emphasize ease of use, time savings, ROI, onboarding simplicity, and integrations. Use standard block types (hero, benefits, features, faq, cta, etc.) — do NOT use saas-prefixed block types.`
    : "";

  return `You are a conversion copywriter expert specialized in ecommerce / dropshipping in Chile.

Write in Spanish (Chilean). Prices are in CLP.

Return ONLY valid JSON: { "blocks": [...] }.

## Output format

Return a JSON object with a "blocks" array. Each block must include:
- "type" (string)
- "title" (string)
- "content" (string OR array — see specific rules below)
- "order" (number)

## FAQ block format
For blocks of type "faq", the "content" MUST be an array of objects with "q" (question) and "a" (answer) keys:
\`\`\`json
{ "type": "faq", "title": "Preguntas frecuentes", "content": [{"q": "¿Pregunta?", "a": "Respuesta detallada."}], "order": 8 }
\`\`\`

## PLAN-SPECIFIC SECTIONS (MANDATORY)
Plan: ${plan}

${buildPlanSections(plan)}

## Style & tone rules
- Every landing must feel like a professional Chilean ecommerce sales page
- Use conversational but professional Spanish (Chilean)
- Include emotional triggers: fear of missing out, social validation, aspiration
- Benefits > Features: always lead with what the customer GETS, not what the product HAS
- Prices always in CLP format ($XX.XXX)
- Never mention plan names inside the landing copy

## Framework
Mode: ${mode === "aida" ? "AIDA — structure each block content in AIDA style internally (Attention, Interest, Desire, Action), but still output the same blocks." : "Standard — standard direct-response sections."}

Intensity: ${mappedIntensity}
- low = softer, informative
- medium = persuasive with social proof
- high = strong direct-response, urgency, objections, tighter CTAs (without scams)

## Offers / Guarantee
${hasOffer ? "hasOffer = true: Include an offer with discounted price + anchor price + savings in CLP." : "hasOffer = false: No discount pricing. Do NOT invent discounted prices. Use value-based and time-limited framing instead."}
${guarantee ? `Guarantee: "${guarantee}" — include it in a guarantee block.` : "No guarantee text provided — use a generic satisfaction guarantee if a guarantee block is required by the plan, otherwise omit."}

## CRITICAL SAFETY RULES — DO NOT VIOLATE
- Do NOT invent specific testimonial names, dates, or quantified results (e.g. "María ganó $500.000 en 2 semanas"). Use generic trust phrasing instead.
- Do NOT invent specific stock numbers (e.g. "solo quedan 3 unidades"). Use vague availability phrasing if needed.
- Do NOT name specific competitors or invent competitor weaknesses. Use category-level comparisons only.
- Do NOT show discounted prices unless hasOffer is explicitly true.
- Do NOT include guarantee details unless guarantee text is provided (or plan requires a guarantee block, in which case use generic satisfaction guarantee).
- If information is missing, write plausible but safe copy without inventing technical facts (no fake certifications, no medical claims, no guaranteed outcomes).
- If the product is health-related, avoid medical promises; use softer wording (e.g., "ayuda", "puede ayudar", "muchos usuarios reportan mejoras").

## MICROCOPY (ALL PLANS)
For ALL plans, include trust signals in the CTA block content or as a separate microcopy block: "Pago 100% seguro", "Envío en 24-48h", "Garantía de satisfacción".
${saasContext}

## Product info
- Name: ${product.name}
- Category: ${product.category}
- Price: $${product.price} CLP
- Target audience: ${product.target_audience}
- Description: ${product.description || "N/A"}

Return ONLY valid JSON. No markdown. No explanations.`;
}

// ─── OpenAI Call ─────────────────────────────────────────────────────────────

async function callOpenAI(apiKey: string, systemPrompt: string, productName: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate the landing page blocks for "${productName}".` },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("OpenAI error:", errText);
    throw new Error("Error calling OpenAI API");
  }

  const aiData = await response.json();
  return aiData.choices?.[0]?.message?.content || "";
}

// ─── Block Parsing & Validation ─────────────────────────────────────────────

function parseBlocks(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.blocks)) return parsed.blocks;
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (e) {
    console.error("JSON parse error:", e);
    return [];
  }
}

function validateFaqContent(content: unknown): { q: string; a: string }[] {
  if (!Array.isArray(content)) return [{ q: "¿Tienen soporte?", a: "Sí, contamos con soporte dedicado para resolver tus dudas." }];
  return content
    .filter((item: unknown) => item && typeof item === "object" && "q" in (item as Record<string, unknown>) && "a" in (item as Record<string, unknown>))
    .map((item: unknown) => {
      const obj = item as Record<string, unknown>;
      return { q: String(obj.q || ""), a: String(obj.a || "") };
    })
    .filter((item) => item.q.length > 0 && item.a.length > 0);
}

function sanitizeBlock(block: unknown): Block | null {
  if (!block || typeof block !== "object") return null;
  const b = block as Record<string, unknown>;

  const type = typeof b.type === "string" ? b.type.trim().toLowerCase() : "";
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const order = typeof b.order === "number" ? b.order : 0;

  if (!type || !title) return null;

  let content: string | unknown[];
  if (type === "faq") {
    content = validateFaqContent(b.content);
    if ((content as unknown[]).length === 0) {
      content = [{ q: "¿Tienen soporte?", a: "Sí, contamos con soporte dedicado para resolver tus dudas." }];
    }
  } else if (Array.isArray(b.content)) {
    content = b.content.map((item) => (typeof item === "string" ? item : JSON.stringify(item)));
  } else {
    content = typeof b.content === "string" ? b.content : String(b.content || "");
  }

  return { type, title, content, order };
}

// ─── Fallback Blocks ────────────────────────────────────────────────────────

function getFallbackBlocks(plan: string): Block[] {
  const base: Block[] = [
    { type: "hero", title: "Descubre lo que este producto puede hacer por ti", content: "Una solución diseñada para facilitar tu día a día. Calidad, confianza y resultados.", order: 1 },
    { type: "benefits", title: "Beneficios principales", content: ["Fácil de usar desde el primer día", "Resultados que notarás rápidamente", "Diseñado pensando en ti"], order: 2 },
    { type: "cta", title: "¡Aprovecha ahora!", content: "No dejes pasar esta oportunidad. Haz tu pedido hoy y comienza a disfrutar de los beneficios.", order: 3 },
  ];

  if (plan === "free") return base;

  const starter: Block[] = [
    base[0],
    base[1],
    { type: "features", title: "Características destacadas", content: ["Materiales de alta calidad", "Diseño ergonómico y moderno", "Compatible con tu estilo de vida", "Fácil mantenimiento"], order: 3 },
    { type: "testimonials", title: "Lo que dicen nuestros clientes", content: ["Nuestros clientes confirman que este producto superó sus expectativas.", "Una compra que recomiendan sin dudar.", "Calidad y precio que convencen."], order: 4 },
    { type: "objections", title: "¿Tienes dudas?", content: ["¿Es de buena calidad? — Sí, usamos materiales premium.", "¿Puedo devolverlo? — Ofrecemos garantía de satisfacción.", "¿Cuánto tarda el envío? — Envío en 24-48 horas hábiles."], order: 5 },
    { type: "faq", title: "Preguntas frecuentes", content: [{ q: "¿Cómo hago mi pedido?", a: "Simplemente haz clic en el botón de compra y sigue los pasos." }, { q: "¿Tienen soporte?", a: "Sí, nuestro equipo está disponible para ayudarte." }], order: 6 },
    { type: "urgency", title: "Oferta por tiempo limitado", content: "Esta oferta está disponible por tiempo limitado. No te quedes sin el tuyo.", order: 7 },
    { type: "cta", title: "¡Compra ahora!", content: "Haz tu pedido hoy y recibe tu producto en la puerta de tu casa. Pago 100% seguro.", order: 8 },
  ];

  if (plan === "starter") return starter;

  // Pro fallback
  const pro: Block[] = [
    ...starter.slice(0, 5),
    { type: "comparison", title: "¿Por qué elegirnos?", content: ["Mayor durabilidad que alternativas genéricas", "Mejor relación calidad-precio en su categoría", "Soporte post-venta dedicado", "Materiales superiores certificados", "Diseño basado en necesidades reales", "Envío más rápido que el promedio del mercado"], order: 6 },
    { type: "bundles", title: "Packs disponibles", content: ["Pack Básico — 1 unidad al mejor precio", "Pack Dúo — 2 unidades con descuento especial", "Pack Familiar — 3 unidades al precio más conveniente"], order: 7 },
    { type: "offer", title: "Oferta especial", content: "Aprovecha nuestra oferta vigente y obtén el mejor valor por tu compra.", order: 8 },
    { type: "urgency", title: "No te quedes fuera", content: "La demanda es alta y esta oferta no durará para siempre. Asegura el tuyo ahora.", order: 9 },
    { type: "guarantee", title: "Garantía de satisfacción", content: "Si no quedas 100% satisfecho, te ayudamos con el proceso de devolución.", order: 10 },
    { type: "faq", title: "Preguntas frecuentes", content: [{ q: "¿Cómo hago mi pedido?", a: "Haz clic en comprar y sigue los pasos. Es rápido y seguro." }, { q: "¿Tienen soporte?", a: "Sí, estamos disponibles para ayudarte en todo momento." }, { q: "¿Cuál es el tiempo de envío?", a: "Enviamos en 24-48 horas hábiles a todo Chile." }], order: 11 },
    { type: "microcopy", title: "Compra con confianza", content: ["Pago 100% seguro", "Envío en 24-48h", "Garantía de satisfacción", "Atención al cliente dedicada"], order: 12 },
    { type: "cta", title: "¡Es tu momento!", content: "No lo pienses más. Haz tu pedido ahora y empieza a disfrutar de todos los beneficios. Pago seguro y envío rápido.", order: 13 },
  ];

  return pro;
}

// ─── Block Validation for Plan ──────────────────────────────────────────────

function validateBlocksForPlan(blocks: unknown[], plan: string): Block[] {
  const config = getPlanConfig(plan);
  const allowedTypes = new Set(config.blockTypes);

  // Sanitize and filter to allowed types
  const sanitized: Block[] = [];
  const seenTypes = new Set<string>();

  for (const raw of blocks) {
    const block = sanitizeBlock(raw);
    if (!block) continue;
    if (!allowedTypes.has(block.type)) continue;
    if (seenTypes.has(block.type)) continue; // no duplicates
    seenTypes.add(block.type);
    sanitized.push(block);
  }

  // Fill missing required blocks with fallbacks
  const fallbacks = getFallbackBlocks(plan);
  for (const fb of fallbacks) {
    if (!seenTypes.has(fb.type)) {
      sanitized.push(fb);
      seenTypes.add(fb.type);
    }
  }

  // Sort by the plan's expected order, then re-number
  const typeOrder = new Map(config.blockTypes.map((t, i) => [t, i]));
  sanitized.sort((a, b) => (typeOrder.get(a.type) ?? 99) - (typeOrder.get(b.type) ?? 99));

  // Cap to plan block count and re-number
  const final = sanitized.slice(0, config.blockCount);
  return final.map((block, i) => ({ ...block, order: i + 1 }));
}

// ─── Main Handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, mode, intensity, hasOffer, guarantee, plan, demo } = await req.json();

    const openaiKey = Deno.env.get("NexsellAi");
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "Server API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userPlan = plan || "free";

    // ── Auth & Plan Validation (unchanged) ──
    if (!demo) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("No auth header");

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) throw new Error("Unauthorized");

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, landings_used")
        .eq("user_id", user.id)
        .single();

      const config = getPlanConfig(profile.plan);
      if ((profile.landings_used || 0) >= config.limit) {
        return new Response(JSON.stringify({ error: "Landing limit reached" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userPlan = profile.plan;
    } else {
      userPlan = "free";
    }

    // ── Build prompt & call AI ──
    const systemPrompt = buildSystemPrompt({
      product,
      mode: mode || "standard",
      intensity: intensity || "medium",
      hasOffer: !!hasOffer,
      guarantee,
      plan: userPlan,
    });

    const rawContent = await callOpenAI(openaiKey, systemPrompt, product.name);

    // ── Parse, validate, fallback ──
    let blocks = parseBlocks(rawContent);

    if (blocks.length === 0) {
      console.warn("AI returned empty/invalid blocks, using fallbacks for plan:", userPlan);
      blocks = getFallbackBlocks(userPlan);
    }

    const validatedBlocks = validateBlocksForPlan(blocks, userPlan);

    return new Response(JSON.stringify({ blocks: validatedBlocks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-landing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
