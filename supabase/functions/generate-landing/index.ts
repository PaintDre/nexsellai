import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { chargeCredits, insufficientCreditsResponse } from "../_shared/credits.ts";

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
  // Optional structured fields for advanced (Shrine Pro LATAM) blocks
  steps?: unknown[];
  rows?: unknown[];
  us_label?: string;
  others_label?: string;
  caption?: string;
  stats?: unknown[];
  before_image?: string;
  after_image?: string;
  text?: string;
  items?: unknown[];
  options?: unknown[];
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
  currency?: string;
  country_code?: string;
  template_id?: string;
  sections?: string[];
}

interface Strategy {
  primary_angle: string;
  tone: string;
  persuasion_level: string;
  awareness_level: string;
  key_objections: string[];
  section_emphasis: Record<string, string>;
  category_context: string;
  risky_blocks: string[];
}

// ─── Plan Configuration ─────────────────────────────────────────────────────

function getPlanConfig(plan: string): PlanConfig {
  const configs: Record<string, PlanConfig> = {
    free: {
      blockTypes: ["hero", "benefits", "urgency_bar", "cta", "sticky_cta"],
      blockCount: 3,
      limit: 1,
    },
    starter: {
      blockTypes: [
        "hero", "benefits", "features", "testimonials", "social_proof_carousel",
        "objections", "faq", "urgency", "urgency_bar", "cta", "sticky_cta",
      ],
      blockCount: 8,
      limit: 10,
    },
    pro: {
      blockTypes: [
        "hero", "benefits", "features", "testimonials", "objections",
        "comparison", "bundles", "offer", "urgency", "guarantee",
        "faq", "microcopy", "cta",
        // Shrine Pro LATAM advanced blocks
        "shipping_timeline", "comparison_table", "results_stats",
        "before_after_slider", "marquee_benefits", "emoji_benefits",
        "bundle_offer", "faq_cod",
        // v2 advanced conversion blocks
        "social_proof_carousel", "urgency_bar", "sticky_cta",
      ],
      blockCount: 21,
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

// ─── Default Strategy Fallback ──────────────────────────────────────────────

function getDefaultStrategy(params: PromptParams): Strategy {
  const intensityMap: Record<string, string> = { soft: "informative", medium: "persuasive", hard: "direct-response" };
  const isSaas = params.product.category === "saas";

  return {
    primary_angle: isSaas ? "productivity and time savings" : "quality and value for money",
    tone: intensityMap[params.intensity] || "persuasive",
    persuasion_level: params.intensity || "medium",
    awareness_level: "problem-aware",
    key_objections: isSaas
      ? ["Is it easy to use?", "Will it integrate with my tools?", "Is it worth the price?"]
      : ["Is the quality good?", "How long does shipping take?", "Can I return it?"],
    section_emphasis: {
      hero: "strong",
      benefits: "strong",
      cta: "strong",
      features: "medium",
      testimonials: "medium",
    },
    category_context: isSaas
      ? "SaaS product: emphasize ease of use, ROI, onboarding simplicity"
      : `Ecommerce product in ${params.product.category} category`,
    risky_blocks: ["testimonials", "comparison"],
  };
}

// ─── Prompt Packs por Categoría ──────────────────────────────────────────────
// Inyectados en planner y generator para subir calidad del copy por nicho.

interface CategoryPack {
  tone: string;
  avoid: string[];
  hook_examples: string[];
  block_emphasis: string;
}

const CATEGORY_PACKS: Record<string, CategoryPack> = {
  home: {
    tone: "cálido y aspiracional, enfocado en confort y transformación del hogar",
    avoid: ["promesas médicas", "exageraciones técnicas"],
    hook_examples: [
      "Convierte tu casa en el lugar donde siempre quisiste estar",
      "Pequeños detalles que cambian cómo se siente tu hogar",
    ],
    block_emphasis: "benefits + before_after_slider + faq fuertes",
  },
  fitness: {
    tone: "motivacional pero honesto, sin promesas de resultados garantizados",
    avoid: ["cifras médicas exactas", '"perderás X kilos"', "fechas específicas de resultados"],
    hook_examples: [
      "Diseñado para acompañarte cuando la motivación falla",
      "Tu mejor versión empieza con una decisión simple",
    ],
    block_emphasis: "results_stats (rangos) + objections + guarantee",
  },
  beauty: {
    tone: "sensorial, cuidadoso, libre de promesas absolutas",
    avoid: ['"sin arrugas"', '"resultados instantáneos"', "lenguaje médico"],
    hook_examples: [
      "El ritual diario que tu piel agradece",
      "Cuidado real, sin promesas imposibles",
    ],
    block_emphasis: "social_proof_carousel + faq + bundle_offer",
  },
  gadget: {
    tone: "claro, técnico-amigable, lleno de pruebas concretas de utilidad",
    avoid: ["jerga innecesaria", "promesas de marca sin evidencia"],
    hook_examples: [
      "Una solución pequeña para un problema que repites todos los días",
      "Diseñado para hacer lo que prometes, sin complicaciones",
    ],
    block_emphasis: "features + comparison_table + urgency_bar",
  },
  pets: {
    tone: "afectivo, cercano, con foco en bienestar animal",
    avoid: ["claims veterinarios sin respaldo", "promesas de cura"],
    hook_examples: [
      "Hecho para los que tratamos a nuestras mascotas como familia",
      "Lo que tu mascota merece, sin complicaciones para ti",
    ],
    block_emphasis: "testimonials suaves + faq + guarantee",
  },
  saas: {
    tone: "directo, orientado a ROI y onboarding rápido",
    avoid: ["jerga corporativa vacía", "promesas de productividad medidas"],
    hook_examples: [
      "Menos clics, más resultados",
      "Lo configuras en minutos, lo notas el primer día",
    ],
    block_emphasis: "benefits + features + faq",
  },
};

function getCategoryPack(category: string): CategoryPack {
  return CATEGORY_PACKS[category?.toLowerCase()] || {
    tone: "profesional, cercano, con foco en beneficios concretos",
    avoid: ["claims sin respaldo", "promesas imposibles"],
    hook_examples: ["Diseñado para resolver lo que más te importa"],
    block_emphasis: "benefits + faq + cta",
  };
}

function formatPackForPrompt(pack: CategoryPack): string {
  return `## CATEGORY PACK
- Tone: ${pack.tone}
- Avoid: ${pack.avoid.join(" | ")}
- Hook reference style: ${pack.hook_examples.join(" / ")}
- Block emphasis hint: ${pack.block_emphasis}`;
}

// ─── Planner Prompt ─────────────────────────────────────────────────────────

function buildPlannerPrompt(params: PromptParams): string {
  const { product, mode, intensity, hasOffer, guarantee, plan } = params;
  const currencyCode = params.currency || "CLP";
  const countryCode = params.country_code || "";

  return `You are a senior marketing strategist analyzing a product to plan a high-converting landing page.

Analyze the following product and return a JSON strategy object.

## Product
- Name: ${product.name}
- Category: ${product.category}
- Price: $${product.price} ${currencyCode}
- Target audience: ${product.target_audience}
- Description: ${product.description || "N/A"}

## Context
- Mode: ${mode}
- Intensity: ${intensity}
- Has offer: ${hasOffer}
- Guarantee: ${guarantee || "none"}
- Plan: ${plan}
- Country: ${countryCode || "not specified"}
- Currency: ${currencyCode}

## Return this exact JSON structure:
{
  "primary_angle": "the main persuasion angle (e.g. 'convenience and time savings', 'premium quality at accessible price')",
  "tone": "the writing tone (e.g. 'conversational and confident', 'professional and aspirational')",
  "persuasion_level": "low | medium | high",
  "awareness_level": "unaware | problem-aware | solution-aware | product-aware | most-aware",
  "key_objections": ["objection 1", "objection 2", "objection 3"],
  "section_emphasis": { "hero": "strong", "benefits": "strong", "features": "medium", ... },
  "category_context": "brief note on how to adapt copy for this product category",
  "risky_blocks": ["list of block types that lack real data and should use safe neutral copy, e.g. testimonials, comparison"]
}

IMPORTANT:
- If there are no real testimonials available, include "testimonials" in risky_blocks.
- If there is no real competitor data, include "comparison" in risky_blocks.
- Be honest about what data is missing. This helps the generator write safer copy.

Return ONLY valid JSON. No markdown. No explanations.`;
}

// ─── Generator Prompt (Strategy-Aware) ──────────────────────────────────────

function buildGeneratorPrompt(params: PromptParams, strategy: Strategy): string {
  const { product, hasOffer, guarantee, plan, currency, country_code, template_id } = params;
  const currencyCode = currency || "CLP";

  const countryContextMap: Record<string, string> = {
    AR: "Write in Argentine Spanish (voseo). Cultural references for Argentina.",
    CL: "Write in Chilean Spanish. Cultural references for Chile.",
    CO: "Write in Colombian Spanish. Cultural references for Colombia.",
    MX: "Write in Mexican Spanish. Cultural references for México.",
    PE: "Write in Peruvian Spanish. Cultural references for Perú.",
    BR: "Write in Brazilian Portuguese. Cultural references for Brasil.",
    US: "Write in English or neutral Spanish. Cultural references for USA.",
    ES: "Write in Castilian Spanish. Cultural references for Spain.",
  };
  const countryInstruction = country_code && countryContextMap[country_code]
    ? countryContextMap[country_code]
    : "Write in Spanish (Latin American).";

  // ── LATAM vs Global mode (adaptive copy) ──
  const LATAM_COUNTRIES = new Set(["AR", "CO", "CL", "MX", "PE", "EC", "BO", "UY", "PY", "VE"]);
  const isLatam = country_code && LATAM_COUNTRIES.has(country_code);

  const latamContext = isLatam ? `
## LATAM E-COMMERCE MODE (active for country=${country_code})
- Mention "pago contra entrega" or "paga al recibir" naturally where it makes sense (especially in CTAs and FAQ).
- Shipping language: "Envío en 2-6 días hábiles" or "Recibe en 3-5 días en tu ciudad".
- Use specific LATAM city names in testimonials when needed (e.g. Bogotá, Medellín, Cali, Buenos Aires, Córdoba, Santiago, CDMX, Guadalajara, Lima, Quito).
- Use specific customer counts that sound credible: "+5.000 clientes", "+14.000 personas confían en nosotros" — but keep them as ranges, never invent precise numbers like "14.327".
- Guarantee phrasing: "Garantía de 30 días" + "Si no te gusta, te devolvemos tu dinero".
- Currency: ${currencyCode}. Always show prices in this currency, formatted naturally for the country.
` : `
## GLOBAL E-COMMERCE MODE (active for country=${country_code || "unspecified"})
- Use neutral, international language. Mention "secure online payment" / "pago seguro online".
- Shipping language: "5-10 business days delivery" / "Entrega en 5-10 días hábiles".
- Use international city/region references when needed (NYC, London, Madrid, Berlin, Sydney).
- Customer counts as credible ranges: "+10,000 customers worldwide".
- Guarantee phrasing: "30-day money-back guarantee" / "Garantía de 30 días con reembolso".
- Currency: ${currencyCode}.
`;

  const saasContext = product.category === "saas"
    ? `\n## SAAS PRODUCT CONTEXT\nThis is a SaaS/app product. Adapt the copy to sell software: emphasize ease of use, time savings, ROI, onboarding simplicity, and integrations. Use standard block types (hero, benefits, features, faq, cta, etc.) — do NOT use saas-prefixed block types.`
    : "";

  const riskyBlockInstructions = strategy.risky_blocks.length > 0
    ? `\n## RISKY BLOCKS — USE SAFE COPY\nThe following blocks lack real user data: ${strategy.risky_blocks.join(", ")}.\nFor these blocks, use neutral trust-oriented copy. Do NOT invent specific names, dates, quantified results, or fake social proof. Use phrasing like "Nuestros clientes confirman que...", "Diseñado para quienes buscan...", etc.`
    : "";

  // ── Shrine Pro LATAM advanced blocks documentation ──
  const isShrineTemplate = template_id === "shrine-latam";
  const advancedBlocksInstructions = (plan === "pro") ? `
## ADVANCED STRUCTURED BLOCKS (Shrine Pro LATAM) — ${isShrineTemplate ? "REQUIRED" : "OPTIONAL — include the most relevant ones"}
These blocks use STRUCTURED FIELDS instead of plain content arrays. Each has a specific JSON shape:

### shipping_timeline
\`\`\`json
{ "type": "shipping_timeline", "title": "Cómo recibirás tu pedido", "order": N, "steps": [
  { "top": "Pedido confirmado", "bottom": "Hoy" },
  { "top": "Procesando", "bottom": "1-2 días" },
  { "top": "Enviado", "bottom": "Día 3" },
  { "top": "Recibes", "bottom": "Día 4-6" }
]}
\`\`\`

### comparison_table
\`\`\`json
{ "type": "comparison_table", "title": "Por qué elegirnos", "order": N,
  "us_label": "Nuestro producto", "others_label": "Otros",
  "rows": [
    { "benefit": "Garantía de 30 días", "us": true, "others": false },
    { "benefit": "Envío gratis", "us": true, "others": false },
    { "benefit": "Soporte dedicado", "us": true, "others": false },
    { "benefit": "Materiales premium", "us": true, "others": false }
  ]
}
\`\`\`

### results_stats
\`\`\`json
{ "type": "results_stats", "title": "Resultados que hablan", "order": N,
  "caption": "Basado en feedback de clientes",
  "stats": [
    { "percentage": 95, "text": "Clientes satisfechos" },
    { "percentage": 87, "text": "Recompran en 3 meses" },
    { "percentage": 92, "text": "Lo recomiendan a un amigo" }
  ]
}
\`\`\`

### before_after_slider
\`\`\`json
{ "type": "before_after_slider", "title": "Mira la diferencia", "order": N,
  "text": "Compara antes y después de usar el producto" }
\`\`\`
(images are auto-resolved from product images by the renderer; do NOT include image URLs)

### marquee_benefits
\`\`\`json
{ "type": "marquee_benefits", "title": "", "order": N,
  "items": ["Envío gratis", "Garantía 30 días", "Pago seguro", "Soporte 24/7", "+14.000 clientes"]
}
\`\`\`

### emoji_benefits
\`\`\`json
{ "type": "emoji_benefits", "title": "Por qué nos eligen", "order": N,
  "items": [
    { "emoji": "🚚", "text": "Envío rápido" },
    { "emoji": "🛡️", "text": "Garantía 30 días" },
    { "emoji": "💳", "text": "Pago seguro" },
    { "emoji": "⭐", "text": "+14.000 clientes" }
  ]
}
\`\`\`

### bundle_offer
\`\`\`json
{ "type": "bundle_offer", "title": "Elige tu pack", "order": N,
  "options": [
    { "label": "1 unidad", "price": "$29.900", "compare_price": "$39.900" },
    { "label": "Pack 3 unidades", "price": "$69.900", "compare_price": "$119.700", "badge": "Más popular", "savings": "Ahorra $49.800" },
    { "label": "Pack familiar 5 unidades", "price": "$99.900", "compare_price": "$199.500", "savings": "Ahorra $99.600" }
  ]
}
\`\`\`
(only use real prices in ${currencyCode}; if hasOffer is false, omit compare_price and savings)

### faq_cod
\`\`\`json
{ "type": "faq_cod", "title": "Preguntas frecuentes", "order": N,
  "items": [
    { "q": "${isLatam ? "¿Puedo pagar contra entrega?" : "¿Es el pago seguro?"}", "a": "..." },
    { "q": "¿Cuánto demora el envío?", "a": "..." },
    { "q": "¿Qué pasa si no me gusta?", "a": "..." },
    { "q": "¿Tienen garantía?", "a": "..." }
  ]
}
\`\`\`
` : "";

  const sectionsList = Array.isArray(params.sections) && params.sections.length > 0
    ? `\n## REQUESTED SECTIONS FOR THIS LANDING (template=${template_id || "default"})
The user picked a template that requests EXACTLY these block types in this order:
${params.sections.map((s, i) => `${i + 1}. ${s}`).join("\n")}
Generate these block types. For advanced structured blocks (shipping_timeline, comparison_table, results_stats, before_after_slider, marquee_benefits, emoji_benefits, bundle_offer, faq_cod), use the structured JSON shapes documented below — NOT plain content strings.\n`
    : "";

  return `You are a conversion copywriter expert specialized in ecommerce / dropshipping.

${countryInstruction}

Prices are in ${currencyCode}.
${latamContext}

Return ONLY valid JSON: { "blocks": [...] }.

## STRATEGY (from planner)
- Primary angle: ${strategy.primary_angle}
- Tone: ${strategy.tone}
- Persuasion level: ${strategy.persuasion_level}
- Awareness level: ${strategy.awareness_level}
- Key objections to address: ${strategy.key_objections.join("; ")}
- Category context: ${strategy.category_context}

## Section emphasis
${Object.entries(strategy.section_emphasis).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

## Output format

Return a JSON object with a "blocks" array. Each block must include:
- "type" (string)
- "title" (string)
- "content" (string OR array — see specific rules below)
- "order" (number)
- Plus structured fields for advanced blocks (see below)

## FAQ block format
For blocks of type "faq", the "content" MUST be an array of objects with "q" (question) and "a" (answer) keys:
\`\`\`json
{ "type": "faq", "title": "Preguntas frecuentes", "content": [{"q": "¿Pregunta?", "a": "Respuesta detallada."}], "order": 8 }
\`\`\`
${sectionsList}
${advancedBlocksInstructions}

## PLAN-SPECIFIC SECTIONS (MANDATORY when no template sections provided)
Plan: ${plan}

${Array.isArray(params.sections) && params.sections.length > 0 ? "(Template sections above take precedence — follow them.)" : buildPlanSections(plan)}

## Style & tone rules
- Every landing must feel like a professional ecommerce sales page for the target country
- ${countryInstruction}
- Include emotional triggers: fear of missing out, social validation, aspiration
- Benefits > Features: always lead with what the customer GETS, not what the product HAS
- Prices always in ${currencyCode} format
- Never mention plan names inside the landing copy
- Maintain consistent tone across all blocks (guided by strategy above)
- Each block should flow naturally into the next — avoid repetitive openers

## Offers / Guarantee
${hasOffer ? `hasOffer = true: Include an offer with discounted price + anchor price + savings in ${currencyCode}.` : "hasOffer = false: No discount pricing. Do NOT invent discounted prices. Use value-based and time-limited framing instead."}
${guarantee ? `Guarantee: "${guarantee}" — include it in a guarantee block.` : "No guarantee text provided — use a generic satisfaction guarantee if a guarantee block is required by the plan, otherwise omit."}

## CRITICAL SAFETY RULES — DO NOT VIOLATE
- Do NOT invent specific testimonial names, dates, or quantified results (e.g. "María ganó $500.000 en 2 semanas"). Use generic trust phrasing instead.
- Do NOT invent specific stock numbers (e.g. "solo quedan 3 unidades"). Use vague availability phrasing if needed.
- Do NOT name specific competitors or invent competitor weaknesses. Use category-level comparisons only.
- Do NOT show discounted prices unless hasOffer is explicitly true.
- Do NOT include guarantee details unless guarantee text is provided (or plan requires a guarantee block, in which case use generic satisfaction guarantee).
- If information is missing, write plausible but safe copy without inventing technical facts (no fake certifications, no medical claims, no guaranteed outcomes).
- If the product is health-related, avoid medical promises; use softer wording (e.g., "ayuda", "puede ayudar", "muchos usuarios reportan mejoras").
${riskyBlockInstructions}

## MICROCOPY (ALL PLANS)
For ALL plans, include trust signals in the CTA block content or as a separate microcopy block: "Pago 100% seguro", "Envío en 24-48h", "Garantía de satisfacción".
${saasContext}

## Product info
- Name: ${product.name}
- Category: ${product.category}
- Price: $${product.price} ${currencyCode}
- Target audience: ${product.target_audience}
- Description: ${product.description || "N/A"}
- Country: ${country_code || "not specified"}

Return ONLY valid JSON. No markdown. No explanations.`;
}

// ─── Critic Prompt ──────────────────────────────────────────────────────────

function buildCriticPrompt(plan: string): string {
  return `You are a QA editor reviewing landing page copy blocks for a Chilean ecommerce site.

You will receive a JSON object with a "blocks" array. Each block has: type, title, content, order, and optionally _meta.

Your job is to refine the copy and return the SAME structure with improvements.

## QA Checklist — Apply ALL of these:
1. REPETITION: Remove repeated phrases across blocks. Each block should have unique openers and angles.
2. FAKE URGENCY: Remove or soften any urgency that sounds fabricated (e.g. "solo quedan 3", "últimas horas"). Replace with general time-based or value-based urgency.
3. UNSUPPORTED CLAIMS: Soften any claims that sound like guarantees of specific outcomes (e.g. "ganarás X", "perderás X kilos"). Use "puede ayudar", "diseñado para", "muchos usuarios reportan".
4. FAKE SOCIAL PROOF: If testimonials use specific names, dates, or quantified results, replace with generic trust phrasing.
5. CTA CLARITY: Ensure CTA blocks have a clear, compelling call to action with a benefit reminder. Avoid generic "compra ahora" without context.
6. TONE CONSISTENCY: Ensure all blocks maintain a consistent professional yet conversational Chilean Spanish tone.
7. FLOW: Each block should transition naturally from the previous one without jarring shifts.

## Rules:
- Keep the exact same block types, order, and count.
- Keep FAQ content as [{q, a}] format.
- Keep array content as arrays, string content as strings.
- Preserve _meta fields if present.
- Plan: ${plan} — do not add or remove blocks.

## Output:
Return ONLY valid JSON: { "blocks": [...] }
No markdown. No explanations. Same structure, refined copy.`;
}

// ─── AI Call (Lovable AI Gateway) with retry + exponential backoff ─────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  temperature: number,
  options: { maxRetries?: number; label?: string; expectJson?: boolean } = {},
): Promise<string> {
  const maxRetries = options.maxRetries ?? 2; // total attempts = maxRetries + 1
  const label = options.label ?? "ai";
  const expectJson = options.expectJson ?? true;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const startedAt = Date.now();
    try {
      console.log(`[${label}] attempt ${attempt + 1}/${maxRetries + 1} → ${model}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Lovable-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        const status = response.status;
        const isRetryable = status === 429 || status >= 500;
        console.error(`[${label}] HTTP ${status} (retryable=${isRetryable}):`, errText.slice(0, 500));

        if (!isRetryable || attempt === maxRetries) {
          throw new Error(`AI gateway HTTP ${status}: ${errText.slice(0, 200)}`);
        }
        // retryable → fall through to backoff
        lastError = new Error(`AI gateway HTTP ${status}`);
      } else {
        const aiData = await response.json();
        const content: string = aiData.choices?.[0]?.message?.content || "";
        const elapsed = Date.now() - startedAt;

        // Validate JSON shape if expected
        if (expectJson) {
          try {
            JSON.parse(content);
          } catch (parseErr) {
            console.error(`[${label}] malformed JSON on attempt ${attempt + 1} (elapsed ${elapsed}ms):`, String(parseErr).slice(0, 200), "preview:", content.slice(0, 200));
            if (attempt === maxRetries) {
              throw new Error(`Malformed JSON from AI after ${attempt + 1} attempts`);
            }
            lastError = parseErr;
            // fall through to backoff
          }
        }

        if (!expectJson || (() => { try { JSON.parse(content); return true; } catch { return false; } })()) {
          console.log(`[${label}] success on attempt ${attempt + 1} (${elapsed}ms, ${content.length} chars)`);
          return content;
        }
      }
    } catch (err) {
      lastError = err;
      console.error(`[${label}] attempt ${attempt + 1} threw:`, err instanceof Error ? err.message : String(err));
      if (attempt === maxRetries) {
        throw err;
      }
    }

    // Exponential backoff: 500ms, 1500ms (jittered)
    const backoffMs = Math.round((500 * Math.pow(3, attempt)) + Math.random() * 250);
    console.log(`[${label}] backing off ${backoffMs}ms before retry`);
    await sleep(backoffMs);
  }

  throw lastError instanceof Error ? lastError : new Error(`[${label}] exhausted retries`);
}

// ─── Pipeline v2 model selection ────────────────────────────────────────────
const MODELS = {
  research: "google/gemini-3-flash-preview",
  strategy: "openai/gpt-5-mini",
  generator: "google/gemini-3-flash-preview",
  critic: "openai/gpt-5.2",
  polish: "openai/gpt-5-mini",
} as const;

interface ResearchInsights {
  audience_pains: string[];
  customer_language: string[];
  category_objections: string[];
  competitive_angle: string;
}

function buildResearchPrompt(params: PromptParams, pack: CategoryPack): string {
  return `You are a market research analyst. Analyze this product and return JSON insights useful for landing copy.

${formatPackForPrompt(pack)}

## Product
- Name: ${params.product.name}
- Category: ${params.product.category}
- Price: ${params.product.price} ${params.currency || "USD"}
- Target audience: ${params.product.target_audience}
- Description: ${params.product.description || "N/A"}
- Country: ${params.country_code || "global"}

## Return EXACTLY this JSON shape:
{
  "audience_pains": ["3-5 real pains this audience feels in their words"],
  "customer_language": ["3-5 short phrases customers actually say/search about this product type"],
  "category_objections": ["3-5 specific objections this category triggers (price, trust, fit, use, durability...)"],
  "competitive_angle": "one sentence describing the strongest differentiating angle vs alternatives in this category"
}

Return ONLY JSON. No markdown. No prose.`;
}

async function runResearchStep(apiKey: string, params: PromptParams, pack: CategoryPack): Promise<ResearchInsights> {
  const t0 = Date.now();
  const fallback: ResearchInsights = {
    audience_pains: ["No encuentro algo que realmente funcione", "Probé varias opciones y ninguna convence", "Quiero algo que valga lo que pago"],
    customer_language: ["¿de verdad funciona?", "vale la pena", "es bueno-bonito-barato"],
    category_objections: ["¿es seguro?", "¿cuánto dura?", "¿qué pasa si no me gusta?"],
    competitive_angle: "calidad superior al precio justo, con garantía real",
  };
  try {
    const prompt = buildResearchPrompt(params, pack);
    const raw = await callAI(apiKey, MODELS.research, prompt, `Research product: "${params.product.name}"`, 0.4, { label: "research", maxRetries: 1 });
    const parsed = JSON.parse(raw);
    const insights: ResearchInsights = {
      audience_pains: Array.isArray(parsed.audience_pains) ? parsed.audience_pains.slice(0, 5).map(String) : fallback.audience_pains,
      customer_language: Array.isArray(parsed.customer_language) ? parsed.customer_language.slice(0, 5).map(String) : fallback.customer_language,
      category_objections: Array.isArray(parsed.category_objections) ? parsed.category_objections.slice(0, 5).map(String) : fallback.category_objections,
      competitive_angle: typeof parsed.competitive_angle === "string" ? parsed.competitive_angle : fallback.competitive_angle,
    };
    console.log(`[research] done in ${Date.now() - t0}ms — pains=${insights.audience_pains.length}`);
    return insights;
  } catch (e) {
    console.warn(`[research] failed after ${Date.now() - t0}ms — using fallback:`, e instanceof Error ? e.message : String(e));
    return fallback;
  }
}

// ─── Pipeline Steps ─────────────────────────────────────────────────────────

async function runPlannerStep(apiKey: string, params: PromptParams, insights: ResearchInsights, pack: CategoryPack): Promise<Strategy> {
  const t0 = Date.now();
  try {
    console.log(`[planner] start — product="${params.product.name}" plan=${params.plan}`);
    const base = buildPlannerPrompt(params);
    const prompt = `${base}

${formatPackForPrompt(pack)}

## RESEARCH INSIGHTS (use them when shaping strategy)
- Audience pains: ${insights.audience_pains.join(" | ")}
- Customer language: ${insights.customer_language.join(" | ")}
- Category objections: ${insights.category_objections.join(" | ")}
- Competitive angle: ${insights.competitive_angle}`;
    const raw = await callAI(
      apiKey,
      MODELS.strategy,
      prompt,
      `Analyze this product and create a strategy: "${params.product.name}"`,
      0.6,
      { label: "planner", maxRetries: 2 },
    );
    const parsed = JSON.parse(raw);

    if (
      typeof parsed.primary_angle === "string" &&
      typeof parsed.tone === "string" &&
      Array.isArray(parsed.key_objections)
    ) {
      console.log(`[planner] done in ${Date.now() - t0}ms — angle="${parsed.primary_angle}"`);
      return {
        primary_angle: parsed.primary_angle,
        tone: parsed.tone,
        persuasion_level: parsed.persuasion_level || params.intensity,
        awareness_level: parsed.awareness_level || "problem-aware",
        key_objections: parsed.key_objections.slice(0, 6).map(String),
        section_emphasis: typeof parsed.section_emphasis === "object" ? parsed.section_emphasis : {},
        category_context: parsed.category_context || "",
        risky_blocks: Array.isArray(parsed.risky_blocks) ? parsed.risky_blocks.map(String) : ["testimonials", "comparison"],
      };
    }
    console.warn(`[planner] invalid structure after ${Date.now() - t0}ms — using defaults`);
    return getDefaultStrategy(params);
  } catch (e) {
    console.warn(`[planner] failed after ${Date.now() - t0}ms — using default strategy:`, e instanceof Error ? e.message : String(e));
    return getDefaultStrategy(params);
  }
}

async function runGeneratorStep(apiKey: string, params: PromptParams, strategy: Strategy, insights: ResearchInsights, pack: CategoryPack): Promise<unknown[]> {
  const t0 = Date.now();
  try {
    console.log(`[generator] start — plan=${params.plan} intensity=${params.intensity}`);
    const base = buildGeneratorPrompt(params, strategy);
    const prompt = `${base}

${formatPackForPrompt(pack)}

## CUSTOMER VOICE (use these phrases verbatim where natural)
${insights.customer_language.map((s) => `- "${s}"`).join("\n")}

## AUDIENCE PAINS (reference them in hero/benefits/objections)
${insights.audience_pains.map((s) => `- ${s}`).join("\n")}`;
    const raw = await callAI(
      apiKey,
      MODELS.generator,
      prompt,
      `Generate the landing page blocks for "${params.product.name}".`,
      0.8,
      { label: "generator", maxRetries: 2 },
    );
    const blocks = parseBlocks(raw);
    if (blocks.length > 0) {
      console.log(`[generator] done in ${Date.now() - t0}ms — produced ${blocks.length} raw blocks`);
      return blocks;
    }
    console.warn(`[generator] empty blocks after ${Date.now() - t0}ms — using fallbacks`);
    return getFallbackBlocks(params.plan);
  } catch (e) {
    console.warn(`[generator] failed after ${Date.now() - t0}ms — using fallbacks:`, e instanceof Error ? e.message : String(e));
    return getFallbackBlocks(params.plan);
  }
}

// ─── SOFT Critic ─────────────────────────────────────────────────────────────
// El crítico ya no reescribe. Solo devuelve { issues: [{block_type, issue, fix_hint}] }.
// Polish (paso 5) decide qué aplicar. Esto baja el tiempo total y evita pérdidas de copy.

interface CriticIssue {
  block_type: string;
  issue: string;
  fix_hint: string;
}

async function runCriticStep(apiKey: string, blocks: Block[], plan: string): Promise<CriticIssue[]> {
  const t0 = Date.now();
  try {
    console.log(`[critic-soft] start — auditing ${blocks.length} blocks (plan=${plan})`);
    const prompt = `You are a senior conversion-copy QA reviewer.

You will receive a JSON object with a "blocks" array. Audit it and return ONLY a JSON object:
{ "issues": [ { "block_type": "<type>", "issue": "<short>", "fix_hint": "<actionable>" } ] }

Flag (max 8 issues, prioritize the most impactful):
1. Repetition across blocks (same openers, same phrases).
2. Fake urgency ("solo quedan 3", "últimas horas").
3. Unsupported claims ("ganarás X", medical promises).
4. Fake social proof (specific names, dates, exact numbers).
5. CTAs without benefit reminder or unclear action.
6. Tone inconsistencies.
7. Awkward flow between blocks.
8. Hardcoded prices that should reference product price.

Plan: ${plan}.
If everything looks good return { "issues": [] }.
Return ONLY JSON.`;
    const raw = await callAI(
      apiKey,
      MODELS.critic,
      prompt,
      `Audit:\n${JSON.stringify({ blocks })}`,
      0.2,
      { label: "critic-soft", maxRetries: 1 },
    );
    const parsed = JSON.parse(raw);
    const issues: CriticIssue[] = Array.isArray(parsed.issues)
      ? parsed.issues.slice(0, 8).map((i: unknown) => {
          const o = (i || {}) as Record<string, unknown>;
          return {
            block_type: String(o.block_type || ""),
            issue: String(o.issue || ""),
            fix_hint: String(o.fix_hint || ""),
          };
        }).filter((i: CriticIssue) => i.issue.length > 0)
      : [];
    console.log(`[critic-soft] done in ${Date.now() - t0}ms — ${issues.length} issues found`);
    return issues;
  } catch (e) {
    console.warn(`[critic-soft] failed after ${Date.now() - t0}ms — skipping:`, e instanceof Error ? e.message : String(e));
    return [];
  }
}

async function runPolishStep(apiKey: string, blocks: Block[], issues: CriticIssue[], plan: string): Promise<Block[]> {
  if (issues.length === 0) {
    console.log(`[polish] no issues — skipping`);
    return blocks;
  }
  const t0 = Date.now();
  try {
    console.log(`[polish] applying ${issues.length} issues to ${blocks.length} blocks`);
    const prompt = `You are a senior copy editor. You will receive landing blocks and a list of issues.
Apply the fix_hints to the affected blocks. Keep:
- The same block types, order and count.
- FAQ items as [{q,a}], arrays as arrays, strings as strings.
- All structured fields (steps, rows, options, items, stats, etc.) intact.
- Same JSON shape as input: { "blocks": [...] }.

Do NOT add or remove blocks. Plan: ${plan}.
Return ONLY the polished JSON.`;
    const raw = await callAI(
      apiKey,
      MODELS.polish,
      prompt,
      `Blocks:\n${JSON.stringify({ blocks })}\n\nIssues:\n${JSON.stringify(issues)}`,
      0.3,
      { label: "polish", maxRetries: 1 },
    );
    const polished = parseBlocks(raw);
    if (polished.length > 0) {
      console.log(`[polish] done in ${Date.now() - t0}ms — ${polished.length} blocks returned`);
      return polished as Block[];
    }
    console.warn(`[polish] empty output — keeping original blocks`);
    return blocks;
  } catch (e) {
    console.warn(`[polish] failed after ${Date.now() - t0}ms — keeping original:`, e instanceof Error ? e.message : String(e));
    return blocks;
  }
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

// Block types that use structured fields instead of just `content`
const ADVANCED_BLOCK_TYPES = new Set([
  "shipping_timeline", "comparison_table", "results_stats",
  "before_after_slider", "marquee_benefits", "emoji_benefits",
  "bundle_offer", "faq_cod",
  // v2 advanced — may have empty title (urgency bar, sticky cta…)
  "urgency_bar", "sticky_cta", "social_proof_carousel",
]);

function sanitizeBlock(block: unknown): Block | null {
  if (!block || typeof block !== "object") return null;
  const b = block as Record<string, unknown>;

  const type = typeof b.type === "string" ? b.type.trim().toLowerCase() : "";
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const order = typeof b.order === "number" ? b.order : 0;

  if (!type) return null;
  // Advanced blocks may not have a title — provide empty string fallback
  const safeTitle = title || (ADVANCED_BLOCK_TYPES.has(type) ? "" : "");
  if (!ADVANCED_BLOCK_TYPES.has(type) && !title) return null;

  let content: string | unknown[];
  if (type === "faq") {
    content = validateFaqContent(b.content);
    if ((content as unknown[]).length === 0) {
      content = [{ q: "¿Tienen soporte?", a: "Sí, contamos con soporte dedicado para resolver tus dudas." }];
    }
  } else if (Array.isArray(b.content)) {
    content = b.content.map((item) => (typeof item === "string" ? item : (typeof item === "object" ? item as unknown : String(item))));
  } else {
    content = typeof b.content === "string" ? b.content : (b.content == null ? "" : String(b.content));
  }

  const result: Block = { type, title: safeTitle, content, order };

  // Preserve advanced structured fields
  if (Array.isArray(b.steps)) result.steps = b.steps;
  if (Array.isArray(b.rows)) result.rows = b.rows;
  if (typeof b.us_label === "string") result.us_label = b.us_label;
  if (typeof b.others_label === "string") result.others_label = b.others_label;
  if (typeof b.caption === "string") result.caption = b.caption;
  if (Array.isArray(b.stats)) result.stats = b.stats;
  if (typeof b.before_image === "string") result.before_image = b.before_image;
  if (typeof b.after_image === "string") result.after_image = b.after_image;
  if (typeof b.text === "string") result.text = b.text;
  if (Array.isArray(b.items)) result.items = b.items;
  if (Array.isArray(b.options)) result.options = b.options;

  return result;
}

// ─── Strip Internal Metadata ────────────────────────────────────────────────

function stripMeta(blocks: Block[]): Block[] {
  return blocks.map((b) => {
    const { type, title, content, order, steps, rows, us_label, others_label, caption, stats, before_image, after_image, text, items, options } = b;
    const out: Block = { type, title, content, order };
    if (steps) out.steps = steps;
    if (rows) out.rows = rows;
    if (us_label) out.us_label = us_label;
    if (others_label) out.others_label = others_label;
    if (caption) out.caption = caption;
    if (stats) out.stats = stats;
    if (before_image) out.before_image = before_image;
    if (after_image) out.after_image = after_image;
    if (text) out.text = text;
    if (items) out.items = items;
    if (options) out.options = options;
    return out;
  });
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

  const sanitized: Block[] = [];
  const seenTypes = new Set<string>();

  for (const raw of blocks) {
    const block = sanitizeBlock(raw);
    if (!block) continue;
    if (!allowedTypes.has(block.type)) continue;
    if (seenTypes.has(block.type)) continue;
    seenTypes.add(block.type);
    sanitized.push(block);
  }

  const fallbacks = getFallbackBlocks(plan);
  for (const fb of fallbacks) {
    if (!seenTypes.has(fb.type)) {
      sanitized.push(fb);
      seenTypes.add(fb.type);
    }
  }

  const typeOrder = new Map(config.blockTypes.map((t, i) => [t, i]));
  sanitized.sort((a, b) => (typeOrder.get(a.type) ?? 99) - (typeOrder.get(b.type) ?? 99));

  const final = sanitized.slice(0, config.blockCount);
  return final.map((block, i) => ({ ...block, order: i + 1 }));
}

// ─── Main Handler ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, mode, intensity, hasOffer, guarantee, plan, demo, currency, country_code, template_id, sections } = await req.json();

    // Pipeline v2: usa Lovable AI Gateway. Fallback al secret legacy NexsellAi si LOVABLE_API_KEY no existiera.
    const aiKey = Deno.env.get("LOVABLE_API_KEY") || Deno.env.get("NexsellAi");
    if (!aiKey) {
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

      // Determine plan first (needed for free-plan landing limit + prompt-shaping)
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();
      userPlan = (profile?.plan as string) || "free";

      // ── Free plan: hard limit of 1 landing total ──
      if (userPlan === "free") {
        const { count, error: countError } = await supabase
          .from("landings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);
        if (countError) {
          console.error("free-limit count error:", countError);
          return new Response(
            JSON.stringify({ error: "limit_check_failed" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if ((count ?? 0) >= 1) {
          return new Response(
            JSON.stringify({
              error: "free_limit_reached",
              message: "El plan Free permite solo 1 landing. Actualiza tu plan para crear más.",
              upgrade_url: "/subscription",
            }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      // Server-authoritative credit charge.
      const chargeResult = await chargeCredits(supabase, user.id, "landing_text", null, { pipeline_version: "v2" });
      if (!chargeResult.success) {
        if (chargeResult.error === "insufficient_credits") {
          return insufficientCreditsResponse(chargeResult, corsHeaders, "landing_text");
        }
        return new Response(
          JSON.stringify({ error: "charge_failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else {
      userPlan = "free";
    }

    const params: PromptParams = {
      product,
      mode: mode || "standard",
      intensity: intensity || "medium",
      hasOffer: !!hasOffer,
      guarantee,
      plan: userPlan,
      currency: currency || "CLP",
      country_code: country_code || null,
      template_id: template_id || undefined,
      sections: Array.isArray(sections) ? sections : undefined,
    };

    // ============ Pipeline v2 ============
    const pipelineStart = Date.now();
    const pack = getCategoryPack(product?.category || "");

    // Step 1 — Market Research
    console.log("[v2] step 1/5 research");
    const insights = await runResearchStep(aiKey, params, pack);

    // Step 2 — Strategy
    console.log("[v2] step 2/5 strategy");
    const strategy = await runPlannerStep(aiKey, params, insights, pack);

    // Step 3 — Blocks generator
    console.log("[v2] step 3/5 generator");
    const rawBlocks = await runGeneratorStep(aiKey, params, strategy, insights, pack);
    const validatedPre = validateBlocksForPlan(rawBlocks, userPlan);

    // Step 4 — Soft critic (just collects issues)
    console.log("[v2] step 4/5 critic-soft");
    const issues = await runCriticStep(aiKey, validatedPre, userPlan);

    // Step 5 — Polish (applies issues)
    console.log("[v2] step 5/5 polish");
    const polished = await runPolishStep(aiKey, validatedPre, issues, userPlan);

    const finalBlocks = stripMeta(validateBlocksForPlan(polished, userPlan));
    const totalMs = Date.now() - pipelineStart;
    console.log(`[v2] pipeline complete in ${totalMs}ms — ${finalBlocks.length} blocks, ${issues.length} critic issues`);

    return new Response(JSON.stringify({
      blocks: finalBlocks,
      _meta: {
        pipeline_version: "v2",
        generation_time_ms: totalMs,
        critic_issues_count: issues.length,
      },
    }), {
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
