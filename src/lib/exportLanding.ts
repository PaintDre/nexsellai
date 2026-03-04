import type { LandingTheme } from "@/components/landing/themes";

interface Block {
  type: string;
  title?: string;
  content?: string | string[];
}

interface ThemeColors {
  heroBg: string;
  heroText: string;
  sectionAltBg: string;
  ctaBg: string;
  ctaHover: string;
  ctaText: string;
  headingColor: string;
  bodyColor: string;
  mutedColor: string;
  accentBg: string;
  cardBg: string;
  cardBorder: string;
  guaranteeBg: string;
  guaranteeBorder: string;
  urgencyBg: string;
  urgencyText: string;
  starColor: string;
  trustColor: string;
}

const themeCSS: Record<LandingTheme, ThemeColors> = {
  minimal: {
    heroBg: "#ffffff", heroText: "#111827", sectionAltBg: "#f9fafb",
    ctaBg: "#111827", ctaHover: "#1f2937", ctaText: "#ffffff",
    headingColor: "#111827", bodyColor: "#374151", mutedColor: "#6b7280",
    accentBg: "#f9fafb", cardBg: "#ffffff", cardBorder: "#f3f4f6",
    guaranteeBg: "#f0fdf4", guaranteeBorder: "#bbf7d0",
    urgencyBg: "#fef2f2", urgencyText: "#dc2626",
    starColor: "#facc15", trustColor: "#9ca3af",
  },
  bold: {
    heroBg: "#030712", heroText: "#ffffff", sectionAltBg: "#030712",
    ctaBg: "#10b981", ctaHover: "#059669", ctaText: "#ffffff",
    headingColor: "#111827", bodyColor: "#374151", mutedColor: "#6b7280",
    accentBg: "#ecfdf5", cardBg: "#ffffff", cardBorder: "#e5e7eb",
    guaranteeBg: "#ecfdf5", guaranteeBorder: "#6ee7b7",
    urgencyBg: "#dc2626", urgencyText: "#ffffff",
    starColor: "#facc15", trustColor: "#9ca3af",
  },
  clean: {
    heroBg: "#eff6ff", heroText: "#0f172a", sectionAltBg: "#f8fafc",
    ctaBg: "#2563eb", ctaHover: "#1d4ed8", ctaText: "#ffffff",
    headingColor: "#0f172a", bodyColor: "#475569", mutedColor: "#94a3b8",
    accentBg: "#eff6ff", cardBg: "#ffffff", cardBorder: "#f1f5f9",
    guaranteeBg: "#f0fdf4", guaranteeBorder: "#bbf7d0",
    urgencyBg: "#fef2f2", urgencyText: "#dc2626",
    starColor: "#3b82f6", trustColor: "#94a3b8",
  },
  warm: {
    heroBg: "#fffbeb", heroText: "#451a03", sectionAltBg: "#fff7ed",
    ctaBg: "#f97316", ctaHover: "#ea580c", ctaText: "#ffffff",
    headingColor: "#451a03", bodyColor: "#78350f", mutedColor: "#a16207",
    accentBg: "#fffbeb", cardBg: "#ffffff", cardBorder: "#ffedd5",
    guaranteeBg: "#f0fdf4", guaranteeBorder: "#bbf7d0",
    urgencyBg: "#fef2f2", urgencyText: "#dc2626",
    starColor: "#fb923c", trustColor: "#d97706",
  },
};

export function generateLandingHTML(
  blocks: Block[],
  product: { name: string; price: number } | null,
  landingName: string,
  theme: LandingTheme = "clean"
): string {
  const t = themeCSS[theme];
  const getBlock = (type: string) => blocks.find((b) => b.type === type);
  const price = product?.price ?? 0;
  const formattedPrice = `$${price.toLocaleString("es-CL")}`;
  const productName = product?.name ?? landingName;

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

  const trustHTML = `
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px;font-size:12px;color:${t.trustColor};margin-top:16px;">
      <span>🚚 Envío seguro</span>
      <span>🛡️ Compra protegida</span>
      <span>🔒 Pago 100% seguro</span>
      <span>💳 Tarjetas aceptadas</span>
    </div>`;

  const ctaBtn = `<a href="#" style="display:inline-block;background:${t.ctaBg};color:${t.ctaText};padding:16px 48px;border-radius:8px;text-decoration:none;font-size:18px;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,0.15);transition:background 0.2s;">Comprar ahora — ${formattedPrice}</a>`;
  const ctaWithTrust = `<div style="text-align:center;">${ctaBtn}${trustHTML}</div>`;

  const renderList = (content: string | string[] | undefined): string => {
    if (!content) return "";
    if (Array.isArray(content)) {
      return content.map((item) => `<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;"><span style="color:#10b981;font-size:18px;line-height:1;">✓</span><span>${item}</span></div>`).join("");
    }
    return `<p>${content}</p>`;
  };

  const sections: string[] = [];

  // HERO
  if (hero) {
    sections.push(`
      <section style="padding:80px 24px;background:${t.heroBg};color:${t.heroText};">
        <div style="max-width:1152px;margin:0 auto;">
          <h1 style="font-family:'Space Grotesk',sans-serif;font-size:clamp(36px,5vw,60px);font-weight:800;line-height:1.1;margin-bottom:20px;">${hero.title || ""}</h1>
          ${hero.content ? `<p style="font-size:18px;line-height:1.7;max-width:600px;margin-bottom:32px;opacity:0.85;">${typeof hero.content === "string" ? hero.content : ""}</p>` : ""}
          ${ctaWithTrust}
        </div>
      </section>`);
  }

  // BENEFITS
  if (benefits) {
    const items = Array.isArray(benefits.content) ? benefits.content : [];
    sections.push(`
      <section style="padding:64px 24px;background:${t.sectionAltBg};">
        <div style="max-width:960px;margin:0 auto;">
          <h2 style="font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:700;text-align:center;margin-bottom:40px;color:${t.headingColor};">${benefits.title || "Beneficios"}</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;">
            ${items.map((item) => `
              <div style="display:flex;align-items:flex-start;gap:16px;padding:24px;background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:12px;">
                <span style="font-size:20px;color:#10b981;">✓</span>
                <p style="color:${t.bodyColor};line-height:1.6;">${item}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>`);
  }

  // FEATURES
  if (features) {
    sections.push(`
      <section style="padding:64px 24px;background:#ffffff;">
        <div style="max-width:768px;margin:0 auto;">
          <h2 style="font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:700;text-align:center;margin-bottom:40px;color:${t.headingColor};">${features.title || "Características"}</h2>
          <div style="color:${t.bodyColor};line-height:1.7;">${renderList(features.content)}</div>
        </div>
      </section>`);
  }

  // TESTIMONIALS
  if (testimonials) {
    const items = Array.isArray(testimonials.content) ? testimonials.content : [];
    sections.push(`
      <section style="padding:64px 24px;background:${t.sectionAltBg};">
        <div style="max-width:960px;margin:0 auto;">
          <h2 style="font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:700;text-align:center;margin-bottom:40px;color:${t.headingColor};">${testimonials.title || "Lo que dicen nuestros clientes"}</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;">
            ${items.map((item, i) => `
              <div style="padding:24px;background:${t.cardBg};border:1px solid ${t.cardBorder};border-radius:12px;position:relative;">
                <div style="color:${t.starColor};margin-bottom:12px;">★★★★★</div>
                <p style="font-style:italic;color:${t.mutedColor};line-height:1.6;font-size:14px;">"${item}"</p>
                <div style="margin-top:16px;display:flex;align-items:center;gap:10px;">
                  <div style="width:32px;height:32px;border-radius:50%;background:${t.accentBg};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${t.headingColor};">${String.fromCharCode(65 + (i % 26))}</div>
                  <span style="font-size:12px;color:${t.mutedColor};">Cliente verificado</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </section>`);
  }

  // OBJECTIONS
  if (objections) {
    sections.push(`
      <section style="padding:64px 24px;background:#ffffff;">
        <div style="max-width:720px;margin:0 auto;">
          <h2 style="font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:700;text-align:center;margin-bottom:40px;color:${t.headingColor};">${objections.title || "¿Aún tienes dudas?"}</h2>
          ${Array.isArray(objections.content) ? objections.content.map((item) => `
            <div style="display:flex;align-items:flex-start;gap:16px;padding:20px;border:1px solid ${t.cardBorder};border-radius:12px;margin-bottom:12px;background:${t.cardBg};">
              <span style="color:#10b981;font-size:18px;">🛡️</span>
              <p style="color:${t.bodyColor};line-height:1.6;">${item}</p>
            </div>
          `).join("") : `<p style="text-align:center;color:${t.bodyColor};">${objections.content}</p>`}
        </div>
      </section>`);
  }

  // OFFER / URGENCY
  if (offer || urgency) {
    sections.push(`
      <section style="padding:64px 24px;background:${t.accentBg};text-align:center;">
        <div style="max-width:720px;margin:0 auto;">
          ${urgency ? `<span style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:999px;font-size:14px;font-weight:700;background:${t.urgencyBg};color:${t.urgencyText};margin-bottom:20px;">⏰ ${typeof urgency.content === "string" ? urgency.content : urgency.title || ""}</span>` : ""}
          ${offer ? `<h2 style="font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:700;margin:20px 0 12px;color:${t.headingColor};">${offer.title || ""}</h2>` : ""}
          ${offer?.content ? `<p style="color:${t.bodyColor};margin-bottom:24px;font-size:18px;">${typeof offer.content === "string" ? offer.content : ""}</p>` : ""}
          ${ctaWithTrust}
        </div>
      </section>`);
  }

  // GUARANTEE
  if (guarantee) {
    sections.push(`
      <section style="padding:48px 24px;">
        <div style="max-width:640px;margin:0 auto;display:flex;align-items:flex-start;gap:20px;padding:24px;background:${t.guaranteeBg};border:1px solid ${t.guaranteeBorder};border-radius:16px;">
          <span style="font-size:28px;">🛡️</span>
          <div>
            <h3 style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:18px;margin-bottom:4px;color:${t.headingColor};">${guarantee.title || "Garantía"}</h3>
            <p style="color:${t.bodyColor};line-height:1.6;">${typeof guarantee.content === "string" ? guarantee.content : ""}</p>
          </div>
        </div>
      </section>`);
  }

  // FINAL CTA
  sections.push(`
    <section style="padding:80px 24px;background:${t.sectionAltBg};text-align:center;">
      <div style="max-width:640px;margin:0 auto;">
        <h2 style="font-family:'Space Grotesk',sans-serif;font-size:36px;font-weight:800;margin-bottom:16px;color:${t.headingColor};">${cta?.title || "¿Listo para probarlo?"}</h2>
        ${cta?.content ? `<p style="color:${t.bodyColor};margin-bottom:24px;font-size:18px;">${typeof cta.content === "string" ? cta.content : ""}</p>` : ""}
        ${ctaWithTrust}
      </div>
    </section>`);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${productName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',system-ui,sans-serif; color:#1e293b; line-height:1.6; -webkit-font-smoothing:antialiased; }
    img { max-width:100%; height:auto; }
    a { text-decoration:none; }
    @media (max-width:640px) {
      h1 { font-size:32px !important; }
      h2 { font-size:26px !important; }
      section { padding:48px 16px !important; }
    }
  </style>
</head>
<body>
${sections.join("\n")}
</body>
</html>`;
}
