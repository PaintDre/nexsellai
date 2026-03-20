import type { LandingTheme } from "@/components/landing/themes";
import JSZip from "jszip";

interface Block {
  type: string;
  title?: string;
  content?: string | string[] | Array<{ q: string; a: string }>;
  image_url?: string;
}

interface ThemeColors {
  heroBg: string;
  heroText: string;
  sectionAltBg: string;
  sectionAltText: string;
  sectionAltMuted: string;
  sectionAltCardBg: string;
  sectionAltCardBorder: string;
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
    sectionAltText: "#111827", sectionAltMuted: "#6b7280",
    sectionAltCardBg: "#ffffff", sectionAltCardBorder: "#f3f4f6",
    ctaBg: "#111827", ctaHover: "#1f2937", ctaText: "#ffffff",
    headingColor: "#111827", bodyColor: "#374151", mutedColor: "#6b7280",
    accentBg: "#f9fafb", cardBg: "#ffffff", cardBorder: "#f3f4f6",
    guaranteeBg: "#f0fdf4", guaranteeBorder: "#bbf7d0",
    urgencyBg: "#fef2f2", urgencyText: "#dc2626",
    starColor: "#facc15", trustColor: "#9ca3af",
  },
  bold: {
    heroBg: "#030712", heroText: "#ffffff", sectionAltBg: "#030712",
    sectionAltText: "#ffffff", sectionAltMuted: "#9ca3af",
    sectionAltCardBg: "#111827", sectionAltCardBorder: "#1f2937",
    ctaBg: "#10b981", ctaHover: "#059669", ctaText: "#ffffff",
    headingColor: "#111827", bodyColor: "#374151", mutedColor: "#6b7280",
    accentBg: "#ecfdf5", cardBg: "#ffffff", cardBorder: "#e5e7eb",
    guaranteeBg: "#ecfdf5", guaranteeBorder: "#6ee7b7",
    urgencyBg: "#dc2626", urgencyText: "#ffffff",
    starColor: "#facc15", trustColor: "#9ca3af",
  },
  clean: {
    heroBg: "#eff6ff", heroText: "#0f172a", sectionAltBg: "#f8fafc",
    sectionAltText: "#0f172a", sectionAltMuted: "#94a3b8",
    sectionAltCardBg: "#ffffff", sectionAltCardBorder: "#f1f5f9",
    ctaBg: "#2563eb", ctaHover: "#1d4ed8", ctaText: "#ffffff",
    headingColor: "#0f172a", bodyColor: "#475569", mutedColor: "#94a3b8",
    accentBg: "#eff6ff", cardBg: "#ffffff", cardBorder: "#f1f5f9",
    guaranteeBg: "#f0fdf4", guaranteeBorder: "#bbf7d0",
    urgencyBg: "#fef2f2", urgencyText: "#dc2626",
    starColor: "#3b82f6", trustColor: "#94a3b8",
  },
  warm: {
    heroBg: "#fffbeb", heroText: "#451a03", sectionAltBg: "#fff7ed",
    sectionAltText: "#451a03", sectionAltMuted: "#a16207",
    sectionAltCardBg: "#ffffff", sectionAltCardBorder: "#ffedd5",
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
  theme: LandingTheme = "clean",
  imageUrl?: string | null,
  imageLocalPath?: string | null
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
  const faq = getBlock("faq");
  const comparison = getBlock("comparison");
  const bundles = getBlock("bundles");

  const trustHTML = `
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px;font-size:12px;color:${t.trustColor};margin-top:16px;">
      <span>🚚 Envío seguro</span>
      <span>🛡️ Compra protegida</span>
      <span>🔒 Pago 100% seguro</span>
      <span>💳 Tarjetas aceptadas</span>
    </div>`;

  const ctaBtn = `<a href="#" style="display:inline-block;background:${t.ctaBg};color:${t.ctaText};padding:16px 48px;border-radius:8px;text-decoration:none;font-size:18px;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,0.15);transition:background 0.2s;">Comprar ahora — ${formattedPrice}</a>`;
  const ctaWithTrust = `<div style="text-align:center;">${ctaBtn}${trustHTML}</div>`;

  const sections: string[] = [];

  // Helper to render section banner image
  const sectionBannerHTML = (block: Block) => {
    if (!block.image_url) return "";
    return `<div style="width:100%;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);margin-bottom:32px;"><img src="${block.image_url}" alt="${block.title || block.type}" style="width:100%;height:auto;display:block;" /></div>`;
  };

  // HERO
  const heroImgSrc = hero?.image_url || imageLocalPath || imageUrl;
  if (hero) {
    sections.push(`
      <section style="padding:80px 24px;background:${t.heroBg};color:${t.heroText};">
        <div style="max-width:1152px;margin:0 auto;${heroImgSrc ? "display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;" : ""}">
          <div>
            <h1 style="font-family:'Space Grotesk',sans-serif;font-size:clamp(36px,5vw,60px);font-weight:800;line-height:1.1;margin-bottom:20px;">${hero.title || ""}</h1>
            ${hero.content ? `<p style="font-size:18px;line-height:1.7;max-width:600px;margin-bottom:32px;opacity:0.85;">${typeof hero.content === "string" ? hero.content : ""}</p>` : ""}
            ${ctaWithTrust}
          </div>
          ${heroImgSrc ? `<div style="text-align:center;"><img src="${heroImgSrc}" alt="${productName}" style="max-height:480px;width:100%;max-width:400px;object-fit:cover;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15);" /></div>` : ""}
        </div>
      </section>`);
  }

  // BENEFITS
  if (benefits) {
    const items = Array.isArray(benefits.content) ? benefits.content as string[] : [];
    sections.push(`
      <section style="padding:64px 24px;background:${t.sectionAltBg};">
        <div style="max-width:960px;margin:0 auto;">
          <h2 style="font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:700;text-align:center;margin-bottom:40px;color:${t.sectionAltText};">${benefits.title || "Beneficios"}</h2>
          ${sectionBannerHTML(benefits)}
            ${items.map((item) => `
              <div style="display:flex;align-items:flex-start;gap:16px;padding:24px;background:${t.sectionAltCardBg};border:1px solid ${t.sectionAltCardBorder};border-radius:12px;">
                <span style="font-size:20px;color:#10b981;">✓</span>
                <p style="color:${theme === "bold" ? t.sectionAltMuted : t.bodyColor};line-height:1.6;">${item}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>`);
  }

  // FEATURES
  if (features) {
    const renderList = (content: Block["content"]): string => {
      if (!content) return "";
      if (Array.isArray(content)) {
        return (content as string[]).map((item) => `<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;"><span style="color:#10b981;font-size:18px;line-height:1;">✓</span><span>${item}</span></div>`).join("");
      }
      return `<p>${content}</p>`;
    };
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
    const items = Array.isArray(testimonials.content) ? testimonials.content as string[] : [];
    sections.push(`
      <section style="padding:64px 24px;background:${t.sectionAltBg};">
        <div style="max-width:960px;margin:0 auto;">
          <h2 style="font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:700;text-align:center;margin-bottom:40px;color:${t.sectionAltText};">${testimonials.title || "Lo que dicen nuestros clientes"}</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;">
            ${items.map((item, i) => `
              <div style="padding:24px;background:${t.sectionAltCardBg};border:1px solid ${t.sectionAltCardBorder};border-radius:12px;position:relative;">
                <div style="color:${t.starColor};margin-bottom:12px;">★★★★★</div>
                <p style="font-style:italic;color:${t.sectionAltMuted};line-height:1.6;font-size:14px;">"${item}"</p>
                <div style="margin-top:16px;display:flex;align-items:center;gap:10px;">
                  <div style="width:32px;height:32px;border-radius:50%;background:${t.accentBg};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${t.sectionAltText};">${String.fromCharCode(65 + (i % 26))}</div>
                  <span style="font-size:12px;color:${t.sectionAltMuted};">Cliente verificado</span>
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
          ${Array.isArray(objections.content) ? (objections.content as string[]).map((item) => `
            <div style="display:flex;align-items:flex-start;gap:16px;padding:20px;border:1px solid ${t.cardBorder};border-radius:12px;margin-bottom:12px;background:${t.cardBg};">
              <span style="color:#10b981;font-size:18px;">🛡️</span>
              <p style="color:${t.bodyColor};line-height:1.6;">${item}</p>
            </div>
          `).join("") : `<p style="text-align:center;color:${t.bodyColor};">${objections.content}</p>`}
        </div>
      </section>`);
  }

  // FAQ
  if (faq && Array.isArray(faq.content)) {
    const faqItems = (faq.content as any[]).map((item: any) => {
      if (typeof item === "string") return { q: item, a: "" };
      if (typeof item === "object" && item?.q) return { q: item.q, a: item.a || "" };
      return { q: String(item), a: "" };
    });
    sections.push(`
      <section style="padding:64px 24px;background:${t.sectionAltBg};">
        <div style="max-width:640px;margin:0 auto;">
          <h2 style="font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:700;text-align:center;margin-bottom:40px;color:${t.sectionAltText};">${faq.title || "Preguntas frecuentes"}</h2>
          ${faqItems.map((item) => `
            <details style="margin-bottom:8px;background:${t.sectionAltCardBg};border:1px solid ${t.sectionAltCardBorder};border-radius:12px;overflow:hidden;">
              <summary style="padding:20px;cursor:pointer;font-weight:600;font-size:14px;color:${t.sectionAltText};">${item.q}</summary>
              ${item.a ? `<div style="padding:0 20px 20px;font-size:14px;line-height:1.6;color:${t.sectionAltMuted};">${item.a}</div>` : ""}
            </details>
          `).join("")}
        </div>
      </section>`);
  }

  // COMPARISON
  if (comparison && Array.isArray(comparison.content)) {
    const items = comparison.content as string[];
    const half = Math.ceil(items.length / 2);
    sections.push(`
      <section style="padding:64px 24px;background:#ffffff;">
        <div style="max-width:960px;margin:0 auto;">
          <h2 style="font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:700;text-align:center;margin-bottom:40px;color:${t.headingColor};">${comparison.title || "¿Por qué elegirnos?"}</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
            <div style="padding:24px;border:2px solid #10b981;border-radius:12px;background:${t.cardBg};">
              <h3 style="font-weight:700;color:${t.headingColor};margin-bottom:16px;">✅ ${productName}</h3>
              ${items.slice(0, half).map((item) => `<p style="font-size:14px;color:${t.bodyColor};padding:4px 0;">✓ ${item}</p>`).join("")}
            </div>
            <div style="padding:24px;border:1px solid ${t.cardBorder};border-radius:12px;background:${t.cardBg};opacity:0.6;">
              <h3 style="font-weight:700;color:${t.mutedColor};margin-bottom:16px;">Alternativas</h3>
              ${items.slice(half).map((item) => `<p style="font-size:14px;color:${t.mutedColor};padding:4px 0;">✗ ${item}</p>`).join("")}
            </div>
          </div>
        </div>
      </section>`);
  }

  // BUNDLES
  if (bundles && Array.isArray(bundles.content)) {
    sections.push(`
      <section style="padding:64px 24px;background:${t.sectionAltBg};">
        <div style="max-width:960px;margin:0 auto;">
          <h2 style="font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:700;text-align:center;margin-bottom:40px;color:${t.sectionAltText};">${bundles.title || "Packs disponibles"}</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;">
            ${(bundles.content as string[]).map((item) => `
              <div style="padding:24px;background:${t.sectionAltCardBg};border:1px solid ${t.sectionAltCardBorder};border-radius:12px;text-align:center;">
                <p style="font-size:14px;line-height:1.6;color:${theme === "bold" ? t.sectionAltMuted : t.bodyColor};">${item}</p>
              </div>
            `).join("")}
          </div>
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
          ${offer?.content ? `<p style="color:${t.bodyColor};margin-bottom:16px;font-size:18px;">${typeof offer.content === "string" ? offer.content : ""}</p>` : ""}
          ${offer ? `<div style="margin-bottom:24px;">
            <span style="font-size:24px;text-decoration:line-through;color:${t.mutedColor};margin-right:16px;">${formattedPrice}</span>
            <span style="font-size:40px;font-weight:800;color:#059669;font-family:'Space Grotesk',sans-serif;">$${Math.round(price * 0.7).toLocaleString("es-CL")}</span>
            <span style="display:inline-block;background:#ef4444;color:white;font-size:14px;font-weight:700;padding:4px 12px;border-radius:999px;margin-left:12px;">-30%</span>
          </div>` : ""}
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
        <h2 style="font-family:'Space Grotesk',sans-serif;font-size:36px;font-weight:800;margin-bottom:16px;color:${t.sectionAltText};">${cta?.title || "¿Listo para probarlo?"}</h2>
        ${cta?.content ? `<p style="color:${theme === "bold" ? t.sectionAltMuted : t.bodyColor};margin-bottom:24px;font-size:18px;">${typeof cta.content === "string" ? cta.content : ""}</p>` : ""}
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
    details summary { list-style:none; }
    details summary::-webkit-details-marker { display:none; }
    @media (max-width:640px) {
      h1 { font-size:32px !important; }
      h2 { font-size:26px !important; }
      section { padding:48px 16px !important; }
    }
    @media (max-width:768px) {
      div[style*="grid-template-columns:1fr 1fr"] { grid-template-columns:1fr !important; }
    }
  </style>
</head>
<body>
${sections.join("\n")}
</body>
</html>`;
}

/**
 * Fetch an image URL as a Blob
 */
async function fetchImageAsBlob(url: string): Promise<{ blob: Blob; extension: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    return { blob, extension: ext };
  } catch {
    return null;
  }
}

/**
 * Convert a Blob to a base64 data URI string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Export landing as a ZIP file containing:
 * - index.html (with local image references)
 * - images/ folder with product images
 */
export async function exportLandingAsZip(
  blocks: Block[],
  product: { name: string; price: number } | null,
  landingName: string,
  theme: LandingTheme = "clean",
  imageUrls: string[] = []
): Promise<Blob> {
  const zip = new JSZip();
  const imgFolder = zip.folder("images")!;
  
  let heroImagePath: string | null = null;

  // Download and add product images to ZIP
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const result = await fetchImageAsBlob(url);
    if (result) {
      const filename = `product-${i + 1}.${result.extension}`;
      imgFolder.file(filename, result.blob);
      if (i === 0) heroImagePath = `images/${filename}`;
    }
  }

  // Download and add section banner images to ZIP
  const blocksWithLocalImages = blocks.map((block, idx) => {
    if (!block.image_url) return block;
    return { ...block, _originalImageUrl: block.image_url };
  });

  for (let i = 0; i < blocksWithLocalImages.length; i++) {
    const block = blocksWithLocalImages[i] as any;
    if (block._originalImageUrl) {
      const result = await fetchImageAsBlob(block._originalImageUrl);
      if (result) {
        const filename = `section-${block.type}-${i}.${result.extension}`;
        imgFolder.file(filename, result.blob);
        blocksWithLocalImages[i] = { ...block, image_url: `images/${filename}` };
      }
      delete (blocksWithLocalImages[i] as any)._originalImageUrl;
    }
  }

  // Generate HTML with local image paths
  const html = generateLandingHTML(
    blocksWithLocalImages,
    product,
    landingName,
    theme,
    null,
    heroImagePath
  );
  
  zip.file("index.html", html);

  return zip.generateAsync({ type: "blob" });
}

/**
 * Export only the HTML file (no images bundled, uses absolute URLs)
 */
export function exportLandingAsHTML(
  blocks: Block[],
  product: { name: string; price: number } | null,
  landingName: string,
  theme: LandingTheme = "clean",
  imageUrl?: string | null
): Blob {
  const html = generateLandingHTML(blocks, product, landingName, theme, imageUrl);
  return new Blob([html], { type: "text/html" });
}

/**
 * Generate a Shopify-compatible HTML fragment (no <!DOCTYPE>, <html>, <head>, <body>).
 * Wrapped in a scoped <div class="nexsell-landing"> with a <style> block
 * to avoid conflicts with Shopify themes.
 */
export function generateShopifyHTML(
  blocks: Block[],
  product: { name: string; price: number } | null,
  landingName: string,
  theme: LandingTheme = "clean",
  imageUrl?: string | null
): string {
  // Generate the full HTML and extract just the body content + create scoped styles
  const fullHTML = generateLandingHTML(blocks, product, landingName, theme, imageUrl);

  // Extract sections between <body> and </body>
  const bodyMatch = fullHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : "";

  const t = themeCSS[theme];

  return `<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
.nexsell-landing, .nexsell-landing * { margin: 0; padding: 0; box-sizing: border-box; }
.nexsell-landing { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; line-height: 1.6; -webkit-font-smoothing: antialiased; }
.nexsell-landing img { max-width: 100%; height: auto; }
.nexsell-landing a { text-decoration: none; }
.nexsell-landing details summary { list-style: none; }
.nexsell-landing details summary::-webkit-details-marker { display: none; }
@media (max-width: 640px) {
  .nexsell-landing h1 { font-size: 32px !important; }
  .nexsell-landing h2 { font-size: 26px !important; }
  .nexsell-landing section { padding: 48px 16px !important; }
}
@media (max-width: 768px) {
  .nexsell-landing div[style*="grid-template-columns:1fr 1fr"] { grid-template-columns: 1fr !important; }
  .nexsell-landing div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
}
</style>
<div class="nexsell-landing">
${bodyContent}
</div>`;
}
