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
  "saas-mono": {
    heroBg: "#fafafa", heroText: "#09090b", sectionAltBg: "#fafafa",
    sectionAltText: "#09090b", sectionAltMuted: "#a1a1aa",
    sectionAltCardBg: "#ffffff", sectionAltCardBorder: "#e4e4e7",
    ctaBg: "#09090b", ctaHover: "#27272a", ctaText: "#ffffff",
    headingColor: "#09090b", bodyColor: "#52525b", mutedColor: "#a1a1aa",
    accentBg: "#eef2ff", cardBg: "#ffffff", cardBorder: "#e4e4e7",
    guaranteeBg: "#eef2ff", guaranteeBorder: "#c7d2fe",
    urgencyBg: "#f4f4f5", urgencyText: "#3f3f46",
    starColor: "#6366f1", trustColor: "#a1a1aa",
  },
  "dtc-bold": {
    heroBg: "#09090b", heroText: "#fde047", sectionAltBg: "#fde047",
    sectionAltText: "#09090b", sectionAltMuted: "#3f3f46",
    sectionAltCardBg: "#09090b", sectionAltCardBorder: "#09090b",
    ctaBg: "#fde047", ctaHover: "#facc15", ctaText: "#09090b",
    headingColor: "#09090b", bodyColor: "#27272a", mutedColor: "#52525b",
    accentBg: "#fde047", cardBg: "#ffffff", cardBorder: "#09090b",
    guaranteeBg: "#fde047", guaranteeBorder: "#09090b",
    urgencyBg: "#dc2626", urgencyText: "#ffffff",
    starColor: "#fbbf24", trustColor: "#71717a",
  },
  "editorial-apple": {
    heroBg: "#ffffff", heroText: "#171717", sectionAltBg: "#f5f5f5",
    sectionAltText: "#171717", sectionAltMuted: "#a3a3a3",
    sectionAltCardBg: "#ffffff", sectionAltCardBorder: "#e5e5e5",
    ctaBg: "#2563eb", ctaHover: "#1d4ed8", ctaText: "#ffffff",
    headingColor: "#171717", bodyColor: "#525252", mutedColor: "#a3a3a3",
    accentBg: "#fafafa", cardBg: "#ffffff", cardBorder: "#e5e5e5",
    guaranteeBg: "#fafafa", guaranteeBorder: "#e5e5e5",
    urgencyBg: "#fff7ed", urgencyText: "#ea580c",
    starColor: "#3b82f6", trustColor: "#a3a3a3",
  },
  "modern-ecommerce": {
    heroBg: "#f5f5f4", heroText: "#1c1917", sectionAltBg: "#ffffff",
    sectionAltText: "#1c1917", sectionAltMuted: "#78716c",
    sectionAltCardBg: "#fafaf9", sectionAltCardBorder: "#e7e5e4",
    ctaBg: "#065f46", ctaHover: "#064e3b", ctaText: "#fafaf9",
    headingColor: "#1c1917", bodyColor: "#44403c", mutedColor: "#78716c",
    accentBg: "#ecfdf5", cardBg: "#ffffff", cardBorder: "#e7e5e4",
    guaranteeBg: "#ecfdf5", guaranteeBorder: "#a7f3d0",
    urgencyBg: "#f5f5f4", urgencyText: "#44403c",
    starColor: "#047857", trustColor: "#a8a29e",
  },
  "story-soft": {
    heroBg: "#fff1f2", heroText: "#4c0519", sectionAltBg: "#ffffff",
    sectionAltText: "#4c0519", sectionAltMuted: "#9f1239",
    sectionAltCardBg: "#ffffff", sectionAltCardBorder: "#ffe4e6",
    ctaBg: "#881337", ctaHover: "#4c0519", ctaText: "#fff1f2",
    headingColor: "#4c0519", bodyColor: "#881337", mutedColor: "#be123c",
    accentBg: "#fff1f2", cardBg: "#ffffff", cardBorder: "#ffe4e6",
    guaranteeBg: "#fffbeb", guaranteeBorder: "#fde68a",
    urgencyBg: "#ffe4e6", urgencyText: "#9f1239",
    starColor: "#f43f5e", trustColor: "#fda4af",
  },
};

function normalizeImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("blob:") || url.startsWith("data:")) return "";
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/product-images/${url.replace(/^\/+/, "")}`;
  }
  return url;
}

function escapeForLiquid(str: string): string {
  return str.replace(/"/g, '\\"').replace(/{/g, '&#123;').replace(/}/g, '&#125;');
}

function escapeSchemaDefault(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Generate a complete Shopify Liquid section file from landing blocks.
 */
export function generateShopifyLiquid(
  blocks: Block[],
  product: { name: string; price: number } | null,
  theme: LandingTheme = "clean",
  productImage?: string | null,
  allImageUrls: string[] = []
): string {
  const t = themeCSS[theme];
  const getBlock = (type: string) => blocks.find((b) => b.type === type);
  const productResolver = `{% assign nexsell_product = product | default: section.settings.connected_product %}`;

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

  const heroImgSrc = normalizeImageUrl(productImage || (allImageUrls.length > 0 ? allImageUrls[0] : "") || "");

  const sections: string[] = [];

  // Trust badges
  const trustHTML = `
    <div class="nexsell-trust">
      <span>🚚 {{ section.settings.trust_shipping | default: "Envío seguro" }}</span>
      <span>🛡️ {{ section.settings.trust_protected | default: "Compra protegida" }}</span>
      <span>🔒 {{ section.settings.trust_secure | default: "Pago 100% seguro" }}</span>
      <span>💳 {{ section.settings.trust_cards | default: "Tarjetas aceptadas" }}</span>
    </div>`;

  // Add-to-Cart CTA
  const addToCartForm = `
    <div class="nexsell-cta-wrap">
      {% if nexsell_product %}
        <form action="/cart/add" method="post">
          <input type="hidden" name="id" value="{{ nexsell_product.variants.first.id }}">
          <button type="submit" class="nexsell-btn">
            {{ section.settings.cta_label | default: "Comprar ahora" }} — {{ nexsell_product.price | money }}
          </button>
        </form>
      {% else %}
        <a href="{{ section.settings.cta_url | default: '#' }}" class="nexsell-btn">
          {{ section.settings.cta_label | default: "Comprar ahora" }}
        </a>
      {% endif %}
      ${trustHTML}
    </div>`;

  // HERO
  if (hero) {
    sections.push(`
  <!-- Hero -->
  <section class="nexsell-hero">
    <div class="nexsell-container nexsell-hero-grid">
      <div>
        <h1 class="nexsell-h1">{{ section.settings.hero_title }}</h1>
        {% if section.settings.hero_subtitle != blank %}
          <p class="nexsell-subtitle">{{ section.settings.hero_subtitle }}</p>
        {% endif %}
        ${addToCartForm}
      </div>
      {% if section.settings.hero_image != blank %}
        <div class="nexsell-hero-img-wrap">
          <img src="{{ section.settings.hero_image | image_url: width: 800 }}" alt="{{ section.settings.hero_title }}" class="nexsell-hero-img" loading="lazy">
        </div>
      {% endif %}
    </div>
  </section>`);
  }

  // BENEFITS
  if (benefits) {
    const items = Array.isArray(benefits.content) ? benefits.content as string[] : [];
    sections.push(`
  <!-- Benefits -->
  <section class="nexsell-section-alt">
    <div class="nexsell-container-sm">
      <h2 class="nexsell-h2">{{ section.settings.benefits_title | default: "${escapeForLiquid(benefits.title || 'Beneficios')}" }}</h2>
      {% for block in section.blocks %}
        {% if block.type == 'benefit' %}
          <div class="nexsell-benefit-card">
            <span class="nexsell-check">✓</span>
            <p>{{ block.settings.text }}</p>
          </div>
        {% endif %}
      {% endfor %}
    </div>
  </section>`);
  }

  // FEATURES
  if (features) {
    sections.push(`
  <!-- Features -->
  <section class="nexsell-section">
    <div class="nexsell-container-sm">
      <h2 class="nexsell-h2">{{ section.settings.features_title | default: "${escapeForLiquid(features.title || 'Características')}" }}</h2>
      {% for block in section.blocks %}
        {% if block.type == 'feature' %}
          <div class="nexsell-feature-item">
            <span class="nexsell-check">✓</span>
            <span>{{ block.settings.text }}</span>
          </div>
        {% endif %}
      {% endfor %}
    </div>
  </section>`);
  }

  // TESTIMONIALS
  if (testimonials) {
    sections.push(`
  <!-- Testimonials -->
  <section class="nexsell-section-alt">
    <div class="nexsell-container">
      <h2 class="nexsell-h2">{{ section.settings.testimonials_title | default: "${escapeForLiquid(testimonials.title || 'Lo que dicen nuestros clientes')}" }}</h2>
      <div class="nexsell-testimonials-grid">
        {% for block in section.blocks %}
          {% if block.type == 'testimonial' %}
            <div class="nexsell-testimonial-card">
              <div class="nexsell-stars">★★★★★</div>
              <p class="nexsell-testimonial-text">"{{ block.settings.text }}"</p>
              <div class="nexsell-testimonial-author">
                <div class="nexsell-avatar">{{ block.settings.text | truncate: 1, '' | upcase }}</div>
                <span class="nexsell-author-label">Cliente verificado</span>
              </div>
            </div>
          {% endif %}
        {% endfor %}
      </div>
    </div>
  </section>`);
  }

  // OBJECTIONS
  if (objections) {
    sections.push(`
  <!-- Objections -->
  <section class="nexsell-section">
    <div class="nexsell-container-narrow">
      <h2 class="nexsell-h2">{{ section.settings.objections_title | default: "${escapeForLiquid(objections.title || '¿Aún tienes dudas?')}" }}</h2>
      {% for block in section.blocks %}
        {% if block.type == 'objection' %}
          <div class="nexsell-objection-card">
            <span>🛡️</span>
            <p>{{ block.settings.text }}</p>
          </div>
        {% endif %}
      {% endfor %}
    </div>
  </section>`);
  }

  // FAQ
  if (faq && Array.isArray(faq.content)) {
    sections.push(`
  <!-- FAQ -->
  <section class="nexsell-section-alt">
    <div class="nexsell-container-narrow">
      <h2 class="nexsell-h2">{{ section.settings.faq_title | default: "${escapeForLiquid(faq.title || 'Preguntas frecuentes')}" }}</h2>
      {% for block in section.blocks %}
        {% if block.type == 'faq_item' %}
          <details class="nexsell-faq-item">
            <summary>{{ block.settings.question }}</summary>
            {% if block.settings.answer != blank %}
              <div class="nexsell-faq-answer">{{ block.settings.answer }}</div>
            {% endif %}
          </details>
        {% endif %}
      {% endfor %}
    </div>
  </section>`);
  }

  // COMPARISON
  if (comparison && Array.isArray(comparison.content)) {
    const items = comparison.content as string[];
    const half = Math.ceil(items.length / 2);
    sections.push(`
  <!-- Comparison -->
  <section class="nexsell-section">
    <div class="nexsell-container">
      <h2 class="nexsell-h2">{{ section.settings.comparison_title | default: "${escapeForLiquid(comparison.title || '¿Por qué elegirnos?')}" }}</h2>
      <div class="nexsell-comparison-grid">
        <div class="nexsell-comparison-us">
          <h3>✅ {% if product %}{{ product.title }}{% else %}{{ section.settings.hero_title }}{% endif %}</h3>
          {% for block in section.blocks %}
            {% if block.type == 'comparison_pro' %}
              <p>✓ {{ block.settings.text }}</p>
            {% endif %}
          {% endfor %}
        </div>
        <div class="nexsell-comparison-them">
          <h3>Alternativas</h3>
          {% for block in section.blocks %}
            {% if block.type == 'comparison_con' %}
              <p>✗ {{ block.settings.text }}</p>
            {% endif %}
          {% endfor %}
        </div>
      </div>
    </div>
  </section>`);
  }

  // BUNDLES
  if (bundles && Array.isArray(bundles.content)) {
    sections.push(`
  <!-- Bundles -->
  <section class="nexsell-section-alt">
    <div class="nexsell-container">
      <h2 class="nexsell-h2">{{ section.settings.bundles_title | default: "${escapeForLiquid(bundles.title || 'Packs disponibles')}" }}</h2>
      <div class="nexsell-bundles-grid">
        {% for block in section.blocks %}
          {% if block.type == 'bundle' %}
            <div class="nexsell-bundle-card">
              <p>{{ block.settings.text }}</p>
            </div>
          {% endif %}
        {% endfor %}
      </div>
    </div>
  </section>`);
  }

  // OFFER + URGENCY
  if (offer || urgency) {
    sections.push(`
  <!-- Offer / Urgency -->
  <section class="nexsell-offer-section">
    <div class="nexsell-container-narrow">
      {% if section.settings.urgency_text != blank %}
        <span class="nexsell-urgency-badge">⏰ {{ section.settings.urgency_text }}</span>
      {% endif %}
      {% if section.settings.offer_title != blank %}
        <h2 class="nexsell-h2" style="margin-top:20px;">{{ section.settings.offer_title }}</h2>
      {% endif %}
      {% if section.settings.offer_subtitle != blank %}
        <p class="nexsell-offer-subtitle">{{ section.settings.offer_subtitle }}</p>
      {% endif %}
      {% if product %}
        <div class="nexsell-price-compare">
          <span class="nexsell-price-old">{{ product.compare_at_price | money }}</span>
          <span class="nexsell-price-new">{{ product.price | money }}</span>
          {% if product.compare_at_price > product.price %}
            <span class="nexsell-discount-badge">-{{ product.compare_at_price | minus: product.price | times: 100 | divided_by: product.compare_at_price }}%</span>
          {% endif %}
        </div>
      {% endif %}
      ${addToCartForm}
    </div>
  </section>`);
  }

  // GUARANTEE
  if (guarantee) {
    sections.push(`
  <!-- Guarantee -->
  <section class="nexsell-section">
    <div class="nexsell-container-narrow">
      <div class="nexsell-guarantee-card">
        <span class="nexsell-guarantee-icon">🛡️</span>
        <div>
          <h3 class="nexsell-guarantee-title">{{ section.settings.guarantee_title | default: "${escapeForLiquid(guarantee.title || 'Garantía')}" }}</h3>
          <p>{{ section.settings.guarantee_text | default: "${escapeForLiquid(typeof guarantee.content === 'string' ? guarantee.content : '')}" }}</p>
        </div>
      </div>
    </div>
  </section>`);
  }

  // FINAL CTA
  sections.push(`
  <!-- Final CTA -->
  <section class="nexsell-final-cta">
    <div class="nexsell-container-narrow">
      <h2 class="nexsell-h2">{{ section.settings.final_cta_title | default: "${escapeForLiquid(cta?.title || '¿Listo para probarlo?')}" }}</h2>
      {% if section.settings.final_cta_subtitle != blank %}
        <p class="nexsell-offer-subtitle">{{ section.settings.final_cta_subtitle }}</p>
      {% endif %}
      ${addToCartForm}
    </div>
  </section>`);

  // Build schema blocks from actual content
  const schemaBlocks: any[] = [];

  if (benefits && Array.isArray(benefits.content)) {
    (benefits.content as string[]).forEach((item) => {
      schemaBlocks.push({ type: "benefit", settings: { text: item } });
    });
  }
  if (features && Array.isArray(features.content)) {
    (features.content as string[]).forEach((item) => {
      schemaBlocks.push({ type: "feature", settings: { text: item } });
    });
  }
  if (testimonials && Array.isArray(testimonials.content)) {
    (testimonials.content as string[]).forEach((item) => {
      schemaBlocks.push({ type: "testimonial", settings: { text: item } });
    });
  }
  if (objections && Array.isArray(objections.content)) {
    (objections.content as string[]).forEach((item) => {
      schemaBlocks.push({ type: "objection", settings: { text: typeof item === 'string' ? item : '' } });
    });
  }
  if (faq && Array.isArray(faq.content)) {
    (faq.content as any[]).forEach((item) => {
      if (typeof item === 'string') {
        schemaBlocks.push({ type: "faq_item", settings: { question: item, answer: "" } });
      } else if (item?.q) {
        schemaBlocks.push({ type: "faq_item", settings: { question: item.q, answer: item.a || "" } });
      }
    });
  }
  if (comparison && Array.isArray(comparison.content)) {
    const items = comparison.content as string[];
    const half = Math.ceil(items.length / 2);
    items.slice(0, half).forEach((item) => {
      schemaBlocks.push({ type: "comparison_pro", settings: { text: item } });
    });
    items.slice(half).forEach((item) => {
      schemaBlocks.push({ type: "comparison_con", settings: { text: item } });
    });
  }
  if (bundles && Array.isArray(bundles.content)) {
    (bundles.content as string[]).forEach((item) => {
      schemaBlocks.push({ type: "bundle", settings: { text: item } });
    });
  }

  // CSS
  const css = generateShopifyCSS(theme);

  // Schema
  const schema = {
    name: "Nexsell Landing",
    tag: "div",
    class: "nexsell-landing",
    settings: [
      { type: "header", content: "Hero" },
      { type: "text", id: "hero_title", label: "Título principal", default: hero?.title || "" },
      { type: "textarea", id: "hero_subtitle", label: "Subtítulo", default: (typeof hero?.content === 'string' ? hero.content : "") },
      { type: "image_picker", id: "hero_image", label: "Imagen del producto" },
      { type: "header", content: "Call to Action" },
      { type: "product", id: "connected_product", label: "Producto para el botón de compra" },
      { type: "text", id: "cta_label", label: "Texto del botón CTA", default: "Comprar ahora" },
      { type: "url", id: "cta_url", label: "URL del botón (si no hay producto)", default: "#" },
      { type: "header", content: "Secciones" },
      { type: "text", id: "benefits_title", label: "Título de beneficios", default: benefits?.title || "Beneficios" },
      { type: "text", id: "features_title", label: "Título de características", default: features?.title || "Características" },
      { type: "text", id: "testimonials_title", label: "Título de testimonios", default: testimonials?.title || "Lo que dicen nuestros clientes" },
      { type: "text", id: "objections_title", label: "Título de objeciones", default: objections?.title || "¿Aún tienes dudas?" },
      { type: "text", id: "faq_title", label: "Título del FAQ", default: faq?.title || "Preguntas frecuentes" },
      { type: "text", id: "comparison_title", label: "Título de comparación", default: comparison?.title || "¿Por qué elegirnos?" },
      { type: "text", id: "bundles_title", label: "Título de packs", default: bundles?.title || "Packs disponibles" },
      { type: "header", content: "Oferta y urgencia" },
      { type: "text", id: "offer_title", label: "Título de oferta", default: offer?.title || "" },
      { type: "text", id: "offer_subtitle", label: "Subtítulo de oferta", default: (typeof offer?.content === 'string' ? offer.content : "") },
      { type: "text", id: "urgency_text", label: "Texto de urgencia", default: (typeof urgency?.content === 'string' ? urgency.content : urgency?.title || "") },
      { type: "header", content: "Garantía" },
      { type: "text", id: "guarantee_title", label: "Título de garantía", default: guarantee?.title || "Garantía" },
      { type: "textarea", id: "guarantee_text", label: "Texto de garantía", default: (typeof guarantee?.content === 'string' ? guarantee.content : "") },
      { type: "header", content: "CTA Final" },
      { type: "text", id: "final_cta_title", label: "Título CTA final", default: cta?.title || "¿Listo para probarlo?" },
      { type: "text", id: "final_cta_subtitle", label: "Subtítulo CTA final", default: (typeof cta?.content === 'string' ? cta.content : "") },
      { type: "header", content: "Trust Badges" },
      { type: "text", id: "trust_shipping", label: "Envío", default: "Envío seguro" },
      { type: "text", id: "trust_protected", label: "Protección", default: "Compra protegida" },
      { type: "text", id: "trust_secure", label: "Seguridad", default: "Pago 100% seguro" },
      { type: "text", id: "trust_cards", label: "Tarjetas", default: "Tarjetas aceptadas" },
    ],
    blocks: [
      { type: "benefit", name: "Beneficio", settings: [{ type: "text", id: "text", label: "Texto del beneficio" }] },
      { type: "feature", name: "Característica", settings: [{ type: "text", id: "text", label: "Texto de la característica" }] },
      { type: "testimonial", name: "Testimonio", settings: [{ type: "textarea", id: "text", label: "Texto del testimonio" }] },
      { type: "objection", name: "Objeción", settings: [{ type: "text", id: "text", label: "Texto de la objeción" }] },
      { type: "faq_item", name: "Pregunta FAQ", settings: [
        { type: "text", id: "question", label: "Pregunta" },
        { type: "textarea", id: "answer", label: "Respuesta" },
      ]},
      { type: "comparison_pro", name: "Ventaja (nosotros)", settings: [{ type: "text", id: "text", label: "Ventaja" }] },
      { type: "comparison_con", name: "Desventaja (alternativa)", settings: [{ type: "text", id: "text", label: "Desventaja" }] },
      { type: "bundle", name: "Pack", settings: [{ type: "text", id: "text", label: "Descripción del pack" }] },
    ],
    presets: [{
      name: "Nexsell Landing",
      blocks: schemaBlocks,
    }],
  };

  return `${productResolver}

<style>
${css}
</style>

${sections.join("\n")}

{% schema %}
${JSON.stringify(schema, null, 2)}
{% endschema %}`;
}

/**
 * Generate Shopify-scoped CSS for the landing section.
 */
export function generateShopifyCSS(theme: LandingTheme = "clean"): string {
  const t = themeCSS[theme];
  return `
/* Nexsell Landing — Shopify Section Styles */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

.nexsell-landing, .nexsell-landing * { margin: 0; padding: 0; box-sizing: border-box; }
.nexsell-landing { font-family: 'Inter', system-ui, sans-serif; color: ${t.bodyColor}; line-height: 1.6; -webkit-font-smoothing: antialiased; }
.nexsell-landing img { max-width: 100%; height: auto; }
.nexsell-landing a { text-decoration: none; }

.nexsell-container { max-width: 960px; margin: 0 auto; }
.nexsell-container-sm { max-width: 768px; margin: 0 auto; }
.nexsell-container-narrow { max-width: 640px; margin: 0 auto; }

.nexsell-h1 { font-family: 'Space Grotesk', sans-serif; font-size: clamp(36px, 5vw, 60px); font-weight: 800; line-height: 1.1; margin-bottom: 20px; color: ${t.heroText}; }
.nexsell-h2 { font-family: 'Space Grotesk', sans-serif; font-size: 32px; font-weight: 700; text-align: center; margin-bottom: 40px; }
.nexsell-subtitle { font-size: 18px; line-height: 1.7; max-width: 600px; margin-bottom: 32px; opacity: 0.85; }

/* Hero */
.nexsell-hero { padding: 80px 24px; background: ${t.heroBg}; color: ${t.heroText}; }
.nexsell-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
.nexsell-hero-img-wrap { text-align: center; }
.nexsell-hero-img { max-height: 480px; width: 100%; max-width: 400px; object-fit: cover; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }

/* Sections */
.nexsell-section { padding: 64px 24px; background: #ffffff; }
.nexsell-section-alt { padding: 64px 24px; background: ${t.sectionAltBg}; }

/* Benefits */
.nexsell-benefit-card { display: flex; align-items: flex-start; gap: 16px; padding: 24px; background: ${t.sectionAltCardBg}; border: 1px solid ${t.sectionAltCardBorder}; border-radius: 12px; margin-bottom: 12px; }
.nexsell-benefit-card p { color: ${t.bodyColor}; line-height: 1.6; }
.nexsell-check { font-size: 20px; color: #10b981; flex-shrink: 0; }

/* Features */
.nexsell-feature-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; color: ${t.bodyColor}; }

/* Testimonials */
.nexsell-testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
.nexsell-testimonial-card { padding: 24px; background: ${t.sectionAltCardBg}; border: 1px solid ${t.sectionAltCardBorder}; border-radius: 12px; }
.nexsell-stars { color: ${t.starColor}; margin-bottom: 12px; }
.nexsell-testimonial-text { font-style: italic; color: ${t.sectionAltMuted}; line-height: 1.6; font-size: 14px; }
.nexsell-testimonial-author { margin-top: 16px; display: flex; align-items: center; gap: 10px; }
.nexsell-avatar { width: 32px; height: 32px; border-radius: 50%; background: ${t.accentBg}; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: ${t.sectionAltText}; }
.nexsell-author-label { font-size: 12px; color: ${t.sectionAltMuted}; }

/* Objections */
.nexsell-objection-card { display: flex; align-items: flex-start; gap: 16px; padding: 20px; border: 1px solid ${t.cardBorder}; border-radius: 12px; margin-bottom: 12px; background: ${t.cardBg}; }
.nexsell-objection-card p { color: ${t.bodyColor}; line-height: 1.6; }

/* FAQ */
.nexsell-faq-item { margin-bottom: 8px; background: ${t.sectionAltCardBg}; border: 1px solid ${t.sectionAltCardBorder}; border-radius: 12px; overflow: hidden; }
.nexsell-faq-item summary { padding: 20px; cursor: pointer; font-weight: 600; font-size: 14px; color: ${t.sectionAltText}; list-style: none; }
.nexsell-faq-item summary::-webkit-details-marker { display: none; }
.nexsell-faq-answer { padding: 0 20px 20px; font-size: 14px; line-height: 1.6; color: ${t.sectionAltMuted}; }

/* Comparison */
.nexsell-comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.nexsell-comparison-us { padding: 24px; border: 2px solid #10b981; border-radius: 12px; background: ${t.cardBg}; }
.nexsell-comparison-us h3 { font-weight: 700; color: ${t.headingColor}; margin-bottom: 16px; }
.nexsell-comparison-us p { font-size: 14px; color: ${t.bodyColor}; padding: 4px 0; }
.nexsell-comparison-them { padding: 24px; border: 1px solid ${t.cardBorder}; border-radius: 12px; background: ${t.cardBg}; opacity: 0.6; }
.nexsell-comparison-them h3 { font-weight: 700; color: ${t.mutedColor}; margin-bottom: 16px; }
.nexsell-comparison-them p { font-size: 14px; color: ${t.mutedColor}; padding: 4px 0; }

/* Bundles */
.nexsell-bundles-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
.nexsell-bundle-card { padding: 24px; background: ${t.sectionAltCardBg}; border: 1px solid ${t.sectionAltCardBorder}; border-radius: 12px; text-align: center; }
.nexsell-bundle-card p { font-size: 14px; line-height: 1.6; color: ${t.bodyColor}; }

/* Offer / Urgency */
.nexsell-offer-section { padding: 64px 24px; background: ${t.accentBg}; text-align: center; }
.nexsell-urgency-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 700; background: ${t.urgencyBg}; color: ${t.urgencyText}; }
.nexsell-offer-subtitle { color: ${t.bodyColor}; margin-bottom: 16px; font-size: 18px; }
.nexsell-price-compare { margin-bottom: 24px; }
.nexsell-price-old { font-size: 24px; text-decoration: line-through; color: ${t.mutedColor}; margin-right: 16px; }
.nexsell-price-new { font-size: 40px; font-weight: 800; color: #059669; font-family: 'Space Grotesk', sans-serif; }
.nexsell-discount-badge { display: inline-block; background: #ef4444; color: white; font-size: 14px; font-weight: 700; padding: 4px 12px; border-radius: 999px; margin-left: 12px; }

/* Guarantee */
.nexsell-guarantee-card { display: flex; align-items: flex-start; gap: 20px; padding: 24px; background: ${t.guaranteeBg}; border: 1px solid ${t.guaranteeBorder}; border-radius: 16px; }
.nexsell-guarantee-icon { font-size: 28px; }
.nexsell-guarantee-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 18px; margin-bottom: 4px; color: ${t.headingColor}; }
.nexsell-guarantee-card p { color: ${t.bodyColor}; line-height: 1.6; }

/* Final CTA */
.nexsell-final-cta { padding: 80px 24px; background: ${t.sectionAltBg}; text-align: center; }

/* CTA Button */
.nexsell-cta-wrap { text-align: center; }
.nexsell-btn { display: inline-block; background: ${t.ctaBg}; color: ${t.ctaText}; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-size: 18px; font-weight: 700; box-shadow: 0 4px 14px rgba(0,0,0,0.15); border: none; cursor: pointer; transition: background 0.2s; }
.nexsell-btn:hover { background: ${t.ctaHover}; }

/* Trust */
.nexsell-trust { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; font-size: 12px; color: ${t.trustColor}; margin-top: 16px; }

/* Responsive */
@media (max-width: 640px) {
  .nexsell-h1 { font-size: 32px !important; }
  .nexsell-h2 { font-size: 26px !important; }
  .nexsell-hero, .nexsell-section, .nexsell-section-alt, .nexsell-offer-section, .nexsell-final-cta { padding: 48px 16px !important; }
}
@media (max-width: 768px) {
  .nexsell-hero-grid { grid-template-columns: 1fr !important; }
  .nexsell-comparison-grid { grid-template-columns: 1fr !important; }
}
`;
}

/**
 * Generate the Shopify JSON template.
 */
export function generateShopifyTemplate(): string {
  return JSON.stringify({
    sections: {
      "nexsell-landing": {
        type: "nexsell-landing",
        settings: {},
      },
    },
    order: ["nexsell-landing"],
  }, null, 2);
}

/**
 * Generate a README with installation instructions.
 */
function generateReadme(): string {
  return `# Nexsell Landing — Shopify Section

## Instalación

### 1. Subir archivos a tu tema de Shopify

1. Ve a **Shopify Admin → Tienda Online → Temas**
2. Haz clic en **"..." → Editar código**
3. Sube los archivos:
   - \`sections/nexsell-landing.liquid\` → carpeta **sections/**
   - \`templates/page.nexsell.json\` → carpeta **templates/**

### 2. Crear la página

1. Ve a **Tienda Online → Páginas**
2. Crea una nueva página
3. En **"Plantilla"** (template), selecciona \`page.nexsell\`
4. Guarda la página

### 3. Personalizar en el Theme Editor

1. Ve a **Tienda Online → Temas → Personalizar**
2. Navega a tu nueva página
3. Edita títulos, textos, imágenes y CTA desde el panel lateral

### 4. Conectar un producto (opcional)

Si quieres que el botón "Comprar ahora" agregue un producto al carrito:
- En el Theme Editor, selecciona un producto en la configuración de la sección

## Notas

- El CSS está incluido dentro de la sección Liquid
- Las imágenes usan URLs públicas; puedes reemplazarlas desde el Theme Editor
- El formulario Add-to-Cart funciona automáticamente con cualquier producto de tu tienda
- Todos los textos son editables desde el Theme Editor de Shopify

---
Generado por [Nexsell AI](https://nexsellai.lovable.app)
`;
}

/**
 * Export the landing as a Shopify-ready ZIP package.
 */
export async function exportShopifyZip(
  blocks: Block[],
  product: { name: string; price: number } | null,
  theme: LandingTheme = "clean",
  productImage?: string | null,
  allImageUrls: string[] = []
): Promise<Blob> {
  const zip = new JSZip();

  const sectionsFolder = zip.folder("sections")!;
  const templatesFolder = zip.folder("templates")!;

  const liquid = generateShopifyLiquid(blocks, product, theme, productImage, allImageUrls);
  sectionsFolder.file("nexsell-landing.liquid", liquid);

  const template = generateShopifyTemplate();
  templatesFolder.file("page.nexsell.json", template);

  zip.file("README.md", generateReadme());

  return zip.generateAsync({ type: "blob" });
}
