interface Block {
  type: string;
  title?: string;
  content?: string | string[];
}

export function generateLandingHTML(
  blocks: Block[],
  product: { name: string; price: number } | null,
  landingName: string
): string {
  const getBlock = (type: string) => blocks.find((b) => b.type === type);
  const price = product?.price ?? 0;
  const formattedPrice = `$${price.toLocaleString("es-CL")}`;
  const productName = product?.name ?? landingName;

  const renderList = (content: string | string[] | undefined): string => {
    if (!content) return "";
    if (Array.isArray(content)) {
      return `<ul style="list-style:none;padding:0;">${content.map((item) => `<li style="padding:8px 0;border-bottom:1px solid #eee;">✓ ${item}</li>`).join("")}</ul>`;
    }
    return `<p>${content}</p>`;
  };

  const hero = getBlock("hero");
  const benefits = getBlock("benefits");
  const features = getBlock("features");
  const testimonials = getBlock("testimonials");
  const objections = getBlock("objections");
  const offer = getBlock("offer");
  const urgency = getBlock("urgency");
  const cta = getBlock("cta");
  const guarantee = getBlock("guarantee");
  const microcopy = getBlock("microcopy");

  const ctaButton = `<a href="#" style="display:inline-block;background:#2563eb;color:white;padding:16px 48px;border-radius:8px;text-decoration:none;font-size:18px;font-weight:bold;">Comprar ahora — ${formattedPrice}</a>`;

  const sections: string[] = [];

  if (hero) {
    sections.push(`
      <div style="text-align:center;padding:64px 24px;background:linear-gradient(180deg,#eff6ff,#fff);">
        <h1 style="font-size:42px;font-weight:800;margin-bottom:16px;">${hero.title || ""}</h1>
        ${hero.content ? `<p style="font-size:18px;color:#64748b;max-width:600px;margin:0 auto 24px;">${typeof hero.content === "string" ? hero.content : ""}</p>` : ""}
        ${ctaButton}
      </div>
    `);
  }

  if (benefits) {
    sections.push(`
      <div style="padding:48px 24px;background:#f8fafc;">
        <h2 style="text-align:center;font-size:28px;margin-bottom:24px;">${benefits.title || "Beneficios"}</h2>
        <div style="max-width:700px;margin:0 auto;">${renderList(benefits.content)}</div>
      </div>
    `);
  }

  if (features) {
    sections.push(`
      <div style="padding:48px 24px;">
        <h2 style="text-align:center;font-size:28px;margin-bottom:24px;">${features.title || "Características"}</h2>
        <div style="max-width:700px;margin:0 auto;">${renderList(features.content)}</div>
      </div>
    `);
  }

  if (testimonials) {
    const items = Array.isArray(testimonials.content) ? testimonials.content : [];
    sections.push(`
      <div style="padding:48px 24px;background:#f8fafc;">
        <h2 style="text-align:center;font-size:28px;margin-bottom:24px;">${testimonials.title || "Testimonios"}</h2>
        <div style="max-width:800px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">
          ${items.map((t) => `<div style="background:white;border:1px solid #e2e8f0;border-radius:12px;padding:24px;"><p style="font-style:italic;color:#64748b;">"${t}"</p><p style="margin-top:12px;">⭐⭐⭐⭐⭐</p></div>`).join("")}
        </div>
      </div>
    `);
  }

  if (objections) {
    sections.push(`
      <div style="padding:48px 24px;">
        <h2 style="text-align:center;font-size:28px;margin-bottom:24px;">${objections.title || "Preguntas comunes"}</h2>
        <div style="max-width:700px;margin:0 auto;">${renderList(objections.content)}</div>
      </div>
    `);
  }

  if (offer || urgency) {
    sections.push(`
      <div style="padding:48px 24px;background:#eff6ff;text-align:center;">
        ${urgency ? `<p style="color:#dc2626;font-weight:bold;margin-bottom:12px;">⏰ ${typeof urgency.content === "string" ? urgency.content : urgency.title || ""}</p>` : ""}
        ${offer ? `<h2 style="font-size:28px;margin-bottom:16px;">${offer.title || ""}</h2>` : ""}
        ${offer?.content ? `<p style="color:#64748b;margin-bottom:24px;">${typeof offer.content === "string" ? offer.content : ""}</p>` : ""}
        ${ctaButton}
      </div>
    `);
  }

  if (guarantee) {
    sections.push(`
      <div style="padding:32px 24px;">
        <div style="max-width:600px;margin:0 auto;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:24px;display:flex;gap:16px;align-items:flex-start;">
          <span style="font-size:28px;">🛡️</span>
          <div>
            <h3 style="font-weight:bold;margin-bottom:4px;">${guarantee.title || "Garantía"}</h3>
            <p style="color:#64748b;">${typeof guarantee.content === "string" ? guarantee.content : ""}</p>
          </div>
        </div>
      </div>
    `);
  }

  if (microcopy) {
    const items = Array.isArray(microcopy.content) ? microcopy.content : (typeof microcopy.content === "string" ? [microcopy.content] : []);
    sections.push(`
      <div style="padding:16px 24px;text-align:center;color:#94a3b8;font-size:14px;">
        🚚 Envío seguro &nbsp;|&nbsp; 🛡️ Compra protegida &nbsp;|&nbsp; 🔒 Pago 100% seguro
        ${items.length > 0 ? ` &nbsp;|&nbsp; ${items.join(" &nbsp;|&nbsp; ")}` : ""}
      </div>
    `);
  }

  // Final CTA
  sections.push(`
    <div style="padding:64px 24px;text-align:center;">
      <h2 style="font-size:32px;font-weight:800;margin-bottom:16px;">${cta?.title || "¿Listo para probarlo?"}</h2>
      ${cta?.content ? `<p style="color:#64748b;margin-bottom:24px;">${typeof cta.content === "string" ? cta.content : ""}</p>` : ""}
      ${ctaButton}
    </div>
  `);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${productName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${sections.join("\n")}
</body>
</html>`;
}
