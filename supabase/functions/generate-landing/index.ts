import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

      const limits: Record<string, number> = { free: 1, starter: 10, pro: 100 };
      if ((profile.landings_used || 0) >= (limits[profile.plan] || 1)) {
        return new Response(JSON.stringify({ error: "Landing limit reached" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userPlan = profile.plan;
    } else {
      userPlan = "free";
    }

    const intensityMap: Record<string, string> = { soft: "low", medium: "medium", hard: "high" };
    const mappedIntensity = intensityMap[intensity] || "medium";

    // Plan-specific section definitions
    const planSections: Record<string, string> = {
      free: `Generate EXACTLY these 3 blocks in this order:
1. hero (order: 1) — One powerful headline + short description. Simple and direct.
2. benefits (order: 2) — 3 key benefits as an array of strings.
3. cta (order: 3) — Final call to action with urgency text.

Do NOT generate any other blocks. Keep copy simple and informative.`,

      starter: `Generate EXACTLY these 8 blocks in this order:
1. hero (order: 1) — Strong headline with emotional hook + compelling description. Include 3 hook variations in the content (pick the best as title, put alternatives in content).
2. benefits (order: 2) — 4-6 benefits as array of strings. Each benefit should highlight an outcome, not just a feature.
3. features (order: 3) — 4-6 product features as array of strings with specific details.
4. testimonials (order: 4) — 3 realistic customer testimonials as array of strings. Chilean names/context.
5. objections (order: 5) — 3-4 common objections addressed as array of strings.
6. faq (order: 6) — 4-6 FAQ items as array of {q, a} objects with detailed answers.
7. urgency (order: 7) — Urgency message as string (stock-based or time-based, no lies).
8. cta (order: 8) — Strong final CTA with benefit reminder.

Include improved hooks, editable urgency, and basic social proof in testimonials.`,

      pro: `Generate EXACTLY these 13 blocks in this order:
1. hero (order: 1) — Premium headline with multiple psychological angles. Title = best hook. Content = compelling description with emotional triggers. Include power words.
2. benefits (order: 2) — 6 outcome-focused benefits as array of strings. Use "Imagina..." or "¿Sabías que...?" framing.
3. features (order: 3) — 6-8 detailed features as array of strings. Technical + emotional.
4. testimonials (order: 4) — 4-6 detailed testimonials as array of strings. Include specific results ("En 2 semanas noté...").
5. objections (order: 5) — 5-6 objections demolished with evidence, as array of strings.
6. comparison (order: 6) — 6 comparison points as array of strings. First half = our advantages, second half = competitor weaknesses.
7. bundles (order: 7) — 3 bundle/pack suggestions as array of strings with pricing hints.
8. offer (order: 8) — Special offer block with discounted price, savings amount, and deadline.
9. urgency (order: 9) — Multiple urgency triggers (stock + time + social proof).
10. guarantee (order: 10) — Detailed guarantee with specific terms.
11. faq (order: 11) — 6-8 detailed FAQ items as array of {q, a} objects.
12. microcopy (order: 12) — 4-6 trust signals as array of strings ("Pago 100% seguro", "Envío en 24-48h", etc.).
13. cta (order: 13) — Premium CTA with multiple benefit reminders and final urgency push.

Full persuasion system: advanced hooks, strong objections, bundles, comparison vs competitors, checkout microcopy.`
    };

    const systemPrompt = `You are a conversion copywriter expert specialized in ecommerce / dropshipping in Chile.

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
Plan: ${userPlan}

${planSections[userPlan] || planSections.free}

## Style & tone rules
- Every landing must feel like a professional Chilean ecommerce sales page
- Use conversational but professional Spanish (Chilean)
- Include emotional triggers: fear of missing out, social validation, aspiration
- Benefits > Features: always lead with what the customer GETS, not what the product HAS
- Prices always in CLP format ($XX.XXX)
- Never mention plan names inside the landing copy

## Framework
Mode: ${mode === "aida" ? 'AIDA — structure each block content in AIDA style internally (Attention, Interest, Desire, Action), but still output the same blocks.' : 'Standard — standard direct-response sections.'}

Intensity: ${mappedIntensity}
- low = softer, informative
- medium = persuasive with social proof
- high = strong direct-response, urgency, objections, tighter CTAs (without scams)

## Offers / Guarantee
${hasOffer ? 'hasOffer = true: Include an offer with discounted price + anchor price + savings in CLP.' : 'hasOffer = false: No discount; still add urgency based on stock/time WITHOUT lying. Use "por tiempo limitado" only.'}
${guarantee ? `Guarantee: "${guarantee}" — include it in a guarantee block.` : 'No guarantee text provided — omit guarantee block or use generic satisfaction guarantee.'}

## Safety rules
If information is missing, write plausible but safe copy without inventing technical facts (no fake certifications, no medical claims, no guaranteed outcomes).
If the product is health-related, avoid medical promises; use softer wording (e.g., "ayuda", "puede ayudar", "muchos usuarios").

## MICROCOPY (ALL PLANS)
For ALL plans, include trust signals in the CTA block content or as a separate microcopy block: "Pago 100% seguro", "Envío en 24-48h", "Garantía de satisfacción".

${product.category === "saas" ? `## SAAS MARKETING LANDING CONTEXT
Generate a landing that SELLS THE APP with saas-prefixed block types:
1) saas_hero 2) saas_benefits 3) saas_how_it_works 4) saas_pricing 5) saas_demo 6) saas_faq 7) saas_cta` : ''}

## Product info
- Name: ${product.name}
- Category: ${product.category}
- Price: $${product.price} CLP
- Target audience: ${product.target_audience}
- Description: ${product.description || "N/A"}

Return ONLY valid JSON. No markdown. No explanations.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate the landing page blocks for "${product.name}".` },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return new Response(JSON.stringify({ error: "Error calling OpenAI API" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify({ blocks: parsed.blocks || [] }), {
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
