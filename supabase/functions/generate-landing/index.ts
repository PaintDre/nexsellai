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

    // Build the prompt based on plan features
    const planFeatures: Record<string, string> = {
      free: "Generate a simple landing with: 1 hero section with 1 hook, 1 benefits section, 1 CTA section. No objection handling, no urgency, no bundles, no upsell.",
      starter: "Generate a landing with: hero with 3 different hooks (pick best), benefits, basic objections section, editable urgency block, simple FAQs, CTA section.",
      pro: "Generate a comprehensive landing with: hero with multiple psychological angles, ad hooks, benefit sections, strong objection handling, urgency section, bundle suggestions, comparison vs competitors section, checkout microcopy, CTA variants, short version for product page.",
    };

    const systemPrompt = `You are a landing page copywriter expert for dropshipping products in Chile. 
Write in Spanish (Chilean). Prices are in CLP. 
Return a JSON object with a "blocks" array. Each block has: "type" (string), "title" (string), "content" (string or array of strings), "order" (number).

Block types: hero, benefits, features, objections, urgency, testimonials, guarantee, faq, cta, comparison, bundles, microcopy, short_version

Mode: ${mode === "aida" ? "AIDA framework (Attention, Interest, Desire, Action)" : "Standard sections"}
Intensity: ${intensity}
${hasOffer ? "Include a special offer with discounted price." : "No special offer."}
Guarantee text: "${guarantee}"

${planFeatures[plan] || planFeatures.free}

Product info:
- Name: ${product.name}
- Category: ${product.category}
- Price: $${product.price} CLP
- Target audience: ${product.target_audience}
- Description: ${product.description || "N/A"}

Return ONLY valid JSON with the blocks array.`;

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
