import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, mode, intensity, hasOffer, guarantee, plan } = await req.json();

    // Get user's OpenAI key from profile
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Fetch the user's profile to get their API key
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
      .from("profiles")
      .select("openai_api_key, plan, landings_used")
      .eq("user_id", user.id)
      .single();

    if (!profile?.openai_api_key) {
      return new Response(JSON.stringify({ error: "No API key configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check plan limits
    const limits: Record<string, number> = { free: 1, starter: 10, pro: 999999 };
    if ((profile.landings_used || 0) >= (limits[profile.plan] || 1)) {
      return new Response(JSON.stringify({ error: "Landing limit reached" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const intensityMap: Record<string, string> = { soft: "low", medium: "medium", hard: "high" };
    const mappedIntensity = intensityMap[intensity] || "medium";

    const systemPrompt = `You are a conversion copywriter expert specialized in ecommerce / dropshipping in Chile.

Write in Spanish (Chilean). Prices are in CLP.

Return ONLY valid JSON: { "blocks": [...] }.

## Output format

Return a JSON object with a "blocks" array. Each block must include:
- "type" (string)
- "title" (string)
- "content" (string OR array of strings)
- "order" (number)

## Allowed block types
hero, benefits, features, testimonials, objections, offer, urgency, guarantee, faq, cta, comparison, bundles, microcopy, short_version, saas_hero, saas_benefits, saas_how_it_works, saas_pricing, saas_demo, saas_faq, saas_cta

## Important conversion rule (DEFAULT SALES STRUCTURE)
Unless explicitly told otherwise, every PRODUCT landing MUST include these 7 sales-optimized sections in this order:
1) hero 2) benefits 3) features 4) testimonials 5) objections 6) offer (or urgency if no offer) 7) cta

If information is missing, write plausible but safe copy without inventing technical facts (no fake certifications, no medical claims, no guaranteed outcomes).
If the product is health-related, avoid medical promises; use softer wording (e.g., "ayuda", "puede ayudar", "muchos usuarios").

## Framework
Mode: ${mode === "aida" ? 'AIDA — structure each block content in AIDA style internally (Attention, Interest, Desire, Action), but still output the same blocks.' : 'Standard — standard direct-response sections.'}

Intensity: ${mappedIntensity}
- low = softer, informative
- medium = persuasive with social proof
- high = strong direct-response, urgency, objections, tighter CTAs (without scams)

## Offers / Guarantee
${hasOffer ? 'hasOffer = true: Include an offer with discounted price + anchor price + savings in CLP.' : 'hasOffer = false: No discount; still add urgency based on stock/time WITHOUT lying. Use "por tiempo limitado" only.'}
${guarantee ? `Guarantee: "${guarantee}" — include it in a guarantee block.` : 'No guarantee text provided — omit guarantee block.'}

## PLAN RULES
Plan: ${plan}
- free: 1 landing total, simple copy, NO advanced persuasion extras. Generate exactly 3 blocks: hero (1 hook), benefits, cta.
- starter: up to 10 landings, improved hooks, basic objections, editable urgency, FAQs. Generate: hero with 3 hooks (pick the best but show the 3 as options), benefits, features, testimonials (basic), objections (basic), faq, urgency, cta.
- pro: up to 100 landings, full persuasion system. Generate: hero with multiple psychological angles + ad hooks, benefits, features, testimonials, strong objections, offer + urgency (or urgency only), bundles suggestions, comparison vs competitors, microcopy for checkout, CTA variants, short_version for product page.

Never mention plan names inside the landing copy.

${product.category === "saas" ? `## SAAS MARKETING LANDING CONTEXT
Generate a landing that SELLS THE APP with these sections:
1) saas_hero: clear promise + CTA "Probar gratis"
2) saas_benefits: 3-6 bullets on outcomes
3) saas_how_it_works: 3 steps
4) saas_demo: explain free trial with limits
5) saas_pricing: show 3 plans (Free: 1 landing, Starter: 10, Pro: 100)
6) saas_faq
7) saas_cta: "Crear cuenta y exportar"` : ''}

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
        Authorization: `Bearer ${profile.openai_api_key}`,
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
