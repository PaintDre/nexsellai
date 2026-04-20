// AI Design Critic — evaluates a generated landing's blocks and returns
// a 0-100 score plus actionable suggestions across 4 axes:
// hierarchy, contrast, spacing, conversion.
//
// Uses Lovable AI Gateway with structured tool-calling output.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CriticBody {
  blocks: any[];
  theme?: string;
  product?: { name?: string; price?: number; category?: string } | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = (await req.json()) as CriticBody;
    if (!body || !Array.isArray(body.blocks)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const blocksSummary = body.blocks
      .slice(0, 20)
      .map((b: any, i: number) => {
        const title = b.title ? ` "${String(b.title).slice(0, 80)}"` : "";
        const text =
          typeof b.content === "string"
            ? ` — ${b.content.slice(0, 120)}`
            : Array.isArray(b.content)
              ? ` — ${b.content.length} items`
              : "";
        return `${i + 1}. [${b.type}]${title}${text}`;
      })
      .join("\n");

    const systemPrompt = `Eres un Director de Arte / UX senior especializado en landings de e-commerce de alta conversión (Apple, Linear, Stripe).
Evalúas una landing generada y devuelves un análisis estructurado en JSON.
Sé específico, accionable y honesto: si el score es bajo, explica por qué.
Idioma de respuesta: español.`;

    const userPrompt = `Analiza esta landing:

Producto: ${body.product?.name || "—"} (categoría: ${body.product?.category || "—"})
Tema visual: ${body.theme || "clean"}
Bloques (${body.blocks.length}):
${blocksSummary}

Evalúa 4 ejes (0-100 cada uno):
1) Jerarquía visual: orden de importancia, tamaños, foco.
2) Contraste: legibilidad, color, separación entre secciones.
3) Espaciado: respiración, ritmo vertical, densidad.
4) Conversión: claridad de oferta, CTA, prueba social, fricción.

Devuelve también:
- score global (promedio ponderado)
- 3-6 sugerencias accionables y concretas (qué cambiar y por qué)
- 1-2 wins (qué está bien hecho)`;

    const tool = {
      type: "function",
      function: {
        name: "report_design_critique",
        description: "Returns design critique with score and actionable suggestions.",
        parameters: {
          type: "object",
          properties: {
            score: { type: "integer", minimum: 0, maximum: 100 },
            axes: {
              type: "object",
              properties: {
                hierarchy: { type: "integer", minimum: 0, maximum: 100 },
                contrast: { type: "integer", minimum: 0, maximum: 100 },
                spacing: { type: "integer", minimum: 0, maximum: 100 },
                conversion: { type: "integer", minimum: 0, maximum: 100 },
              },
              required: ["hierarchy", "contrast", "spacing", "conversion"],
              additionalProperties: false,
            },
            summary: { type: "string", description: "1-2 sentence overall verdict" },
            wins: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 3,
            },
            suggestions: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              items: {
                type: "object",
                properties: {
                  axis: {
                    type: "string",
                    enum: ["hierarchy", "contrast", "spacing", "conversion"],
                  },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                  title: { type: "string" },
                  fix: { type: "string", description: "Concrete actionable fix" },
                },
                required: ["axis", "severity", "title", "fix"],
                additionalProperties: false,
              },
            },
          },
          required: ["score", "axes", "summary", "wins", "suggestions"],
          additionalProperties: false,
        },
      },
    };

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "report_design_critique" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit, intenta en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Sin créditos en el workspace de IA." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      console.error("No tool call returned", aiData);
      return new Response(JSON.stringify({ error: "No structured response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(argsStr);
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("design-critic error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
