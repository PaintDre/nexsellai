export type LandingTheme =
  | "minimal"
  | "bold"
  | "clean"
  | "warm"
  // Premium curated themes (Awwwards-inspired)
  | "saas-mono"
  | "dtc-bold"
  | "editorial-apple"
  | "modern-ecommerce"
  | "story-soft";

export interface ThemeConfig {
  name: string;
  description: string;
  heroBg: string;
  heroText: string;
  sectionBg: string;
  sectionAltBg: string;
  sectionAltHeading: string;
  sectionAltBody: string;
  sectionAltMuted: string;
  sectionAltCardBg: string;
  sectionAltCardBorder: string;
  ctaBg: string;
  ctaText: string;
  ctaHover: string;
  headingColor: string;
  bodyColor: string;
  mutedColor: string;
  accentBg: string;
  accentBorder: string;
  cardBg: string;
  cardBorder: string;
  guaranteeBg: string;
  guaranteeBorder: string;
  urgencyBg: string;
  urgencyText: string;
  starColor: string;
  trustColor: string;
}

export const themes: Record<LandingTheme, ThemeConfig> = {
  minimal: {
    name: "Minimal",
    description: "Limpio y elegante, estilo Shopify",
    heroBg: "bg-white",
    heroText: "text-gray-900",
    sectionBg: "bg-white",
    sectionAltBg: "bg-gray-50",
    sectionAltHeading: "text-gray-900",
    sectionAltBody: "text-gray-700",
    sectionAltMuted: "text-gray-500",
    sectionAltCardBg: "bg-white",
    sectionAltCardBorder: "border-gray-100",
    ctaBg: "bg-gray-900",
    ctaText: "text-white",
    ctaHover: "hover:bg-gray-800",
    headingColor: "text-gray-900",
    bodyColor: "text-gray-700",
    mutedColor: "text-gray-500",
    accentBg: "bg-gray-50",
    accentBorder: "border-gray-200",
    cardBg: "bg-white",
    cardBorder: "border-gray-100",
    guaranteeBg: "bg-green-50",
    guaranteeBorder: "border-green-200",
    urgencyBg: "bg-red-50",
    urgencyText: "text-red-600",
    starColor: "text-yellow-400 fill-yellow-400",
    trustColor: "text-gray-400",
  },
  bold: {
    name: "Bold",
    description: "Alto contraste, respuesta directa",
    heroBg: "bg-gray-950",
    heroText: "text-white",
    // Tema oscuro consistente: ambas secciones en tonos oscuros cercanos para evitar saltos abruptos blanco↔negro
    sectionBg: "bg-gray-900",
    sectionAltBg: "bg-gray-950",
    sectionAltHeading: "text-white",
    sectionAltBody: "text-gray-300",
    sectionAltMuted: "text-gray-400",
    sectionAltCardBg: "bg-gray-900",
    sectionAltCardBorder: "border-gray-800",
    ctaBg: "bg-emerald-500",
    ctaText: "text-white",
    ctaHover: "hover:bg-emerald-600",
    headingColor: "text-white",
    bodyColor: "text-gray-300",
    mutedColor: "text-gray-500",
    accentBg: "bg-gray-900",
    accentBorder: "border-gray-800",
    cardBg: "bg-gray-900",
    cardBorder: "border-gray-800",
    guaranteeBg: "bg-emerald-950/40",
    guaranteeBorder: "border-emerald-800",
    urgencyBg: "bg-red-600",
    urgencyText: "text-white",
    starColor: "text-yellow-400 fill-yellow-400",
    trustColor: "text-gray-500",
  },
  clean: {
    name: "Clean",
    description: "Moderno y profesional",
    heroBg: "bg-gradient-to-b from-blue-50 to-white",
    heroText: "text-gray-900",
    sectionBg: "bg-white",
    sectionAltBg: "bg-slate-50",
    sectionAltHeading: "text-slate-900",
    sectionAltBody: "text-slate-600",
    sectionAltMuted: "text-slate-400",
    sectionAltCardBg: "bg-white",
    sectionAltCardBorder: "border-slate-100",
    ctaBg: "bg-blue-600",
    ctaText: "text-white",
    ctaHover: "hover:bg-blue-700",
    headingColor: "text-slate-900",
    bodyColor: "text-slate-600",
    mutedColor: "text-slate-400",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-200",
    cardBg: "bg-white",
    cardBorder: "border-slate-100",
    guaranteeBg: "bg-green-50",
    guaranteeBorder: "border-green-200",
    urgencyBg: "bg-red-50",
    urgencyText: "text-red-600",
    starColor: "text-blue-500 fill-blue-500",
    trustColor: "text-slate-400",
  },
  warm: {
    name: "Warm",
    description: "Cálido y amigable, ideal para mascotas",
    heroBg: "bg-gradient-to-b from-amber-50 to-orange-50",
    heroText: "text-amber-950",
    sectionBg: "bg-white",
    sectionAltBg: "bg-orange-50/50",
    sectionAltHeading: "text-amber-950",
    sectionAltBody: "text-amber-900",
    sectionAltMuted: "text-amber-700",
    sectionAltCardBg: "bg-white",
    sectionAltCardBorder: "border-orange-100",
    ctaBg: "bg-orange-500",
    ctaText: "text-white",
    ctaHover: "hover:bg-orange-600",
    headingColor: "text-amber-950",
    bodyColor: "text-amber-900",
    mutedColor: "text-amber-700",
    accentBg: "bg-amber-50",
    accentBorder: "border-amber-200",
    cardBg: "bg-white",
    cardBorder: "border-orange-100",
    guaranteeBg: "bg-green-50",
    guaranteeBorder: "border-green-200",
    urgencyBg: "bg-red-50",
    urgencyText: "text-red-600",
    starColor: "text-orange-400 fill-orange-400",
    trustColor: "text-amber-400",
  },

  // ─── PREMIUM CURATED THEMES (Awwwards-inspired) ───────────────

  // SaaS Minimal — estilo Linear/Vercel: gris claro, tipografía respirada, acento índigo
  "saas-mono": {
    name: "SaaS Mono",
    description: "Linear/Vercel — gris respirado, índigo sutil",
    heroBg: "bg-gradient-to-b from-zinc-50 via-white to-white",
    heroText: "text-zinc-950",
    sectionBg: "bg-white",
    sectionAltBg: "bg-zinc-50",
    sectionAltHeading: "text-zinc-950",
    sectionAltBody: "text-zinc-600",
    sectionAltMuted: "text-zinc-400",
    sectionAltCardBg: "bg-white",
    sectionAltCardBorder: "border-zinc-200",
    ctaBg: "bg-zinc-950",
    ctaText: "text-white",
    ctaHover: "hover:bg-zinc-800",
    headingColor: "text-zinc-950",
    bodyColor: "text-zinc-600",
    mutedColor: "text-zinc-400",
    accentBg: "bg-indigo-50",
    accentBorder: "border-indigo-100",
    cardBg: "bg-white",
    cardBorder: "border-zinc-200",
    guaranteeBg: "bg-indigo-50",
    guaranteeBorder: "border-indigo-200",
    urgencyBg: "bg-zinc-100",
    urgencyText: "text-zinc-700",
    starColor: "text-indigo-500 fill-indigo-500",
    trustColor: "text-zinc-400",
  },

  // DTC Bold — estilo Liquid Death/Olipop: negro absoluto consistente con acento amarillo eléctrico solo en CTA/badges
  "dtc-bold": {
    name: "DTC Bold",
    description: "Liquid Death — negro + amarillo eléctrico",
    heroBg: "bg-zinc-950",
    heroText: "text-yellow-300",
    // Mantenemos todo en negro: el amarillo se reserva para CTA y badges, no para fondos completos (evita el flash visual)
    sectionBg: "bg-zinc-950",
    sectionAltBg: "bg-zinc-900",
    sectionAltHeading: "text-yellow-300",
    sectionAltBody: "text-zinc-200",
    sectionAltMuted: "text-zinc-400",
    sectionAltCardBg: "bg-zinc-900",
    sectionAltCardBorder: "border-zinc-800",
    ctaBg: "bg-yellow-300",
    ctaText: "text-zinc-950",
    ctaHover: "hover:bg-yellow-400",
    headingColor: "text-yellow-300",
    bodyColor: "text-zinc-200",
    mutedColor: "text-zinc-400",
    accentBg: "bg-zinc-900",
    accentBorder: "border-zinc-800",
    cardBg: "bg-zinc-900",
    cardBorder: "border-zinc-800",
    guaranteeBg: "bg-zinc-900",
    guaranteeBorder: "border-yellow-300/40",
    urgencyBg: "bg-red-600",
    urgencyText: "text-white",
    starColor: "text-yellow-400 fill-yellow-400",
    trustColor: "text-zinc-500",
  },

  // Editorial Apple — estilo Apple product page: blanco puro, gris elegante
  "editorial-apple": {
    name: "Editorial Apple",
    description: "Apple product — blanco, gris elegante",
    heroBg: "bg-white",
    heroText: "text-neutral-900",
    sectionBg: "bg-white",
    sectionAltBg: "bg-neutral-100",
    sectionAltHeading: "text-neutral-900",
    sectionAltBody: "text-neutral-600",
    sectionAltMuted: "text-neutral-400",
    sectionAltCardBg: "bg-white",
    sectionAltCardBorder: "border-neutral-200",
    ctaBg: "bg-blue-600",
    ctaText: "text-white",
    ctaHover: "hover:bg-blue-700",
    headingColor: "text-neutral-900",
    bodyColor: "text-neutral-600",
    mutedColor: "text-neutral-400",
    accentBg: "bg-neutral-50",
    accentBorder: "border-neutral-200",
    cardBg: "bg-white",
    cardBorder: "border-neutral-200",
    guaranteeBg: "bg-neutral-50",
    guaranteeBorder: "border-neutral-200",
    urgencyBg: "bg-orange-50",
    urgencyText: "text-orange-600",
    starColor: "text-blue-500 fill-blue-500",
    trustColor: "text-neutral-400",
  },

  // Modern E-commerce — estilo Allbirds/Aesop: tierra clara, verde sage
  "modern-ecommerce": {
    name: "Modern E-commerce",
    description: "Allbirds/Aesop — tierra, verde sage",
    heroBg: "bg-gradient-to-b from-stone-100 to-stone-50",
    heroText: "text-stone-900",
    sectionBg: "bg-stone-50",
    sectionAltBg: "bg-white",
    sectionAltHeading: "text-stone-900",
    sectionAltBody: "text-stone-700",
    sectionAltMuted: "text-stone-500",
    sectionAltCardBg: "bg-stone-50",
    sectionAltCardBorder: "border-stone-200",
    ctaBg: "bg-emerald-800",
    ctaText: "text-stone-50",
    ctaHover: "hover:bg-emerald-900",
    headingColor: "text-stone-900",
    bodyColor: "text-stone-700",
    mutedColor: "text-stone-500",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    cardBg: "bg-white",
    cardBorder: "border-stone-200",
    guaranteeBg: "bg-emerald-50",
    guaranteeBorder: "border-emerald-200",
    urgencyBg: "bg-stone-100",
    urgencyText: "text-stone-700",
    starColor: "text-emerald-700 fill-emerald-700",
    trustColor: "text-stone-400",
  },

  // Storytelling Soft — estilo editorial cálido, tonos crema y burdeos
  "story-soft": {
    name: "Story Soft",
    description: "Editorial cálido — crema y burdeos",
    heroBg: "bg-gradient-to-br from-rose-50 via-orange-50/40 to-amber-50",
    heroText: "text-rose-950",
    sectionBg: "bg-amber-50/30",
    sectionAltBg: "bg-white",
    sectionAltHeading: "text-rose-950",
    sectionAltBody: "text-rose-900/80",
    sectionAltMuted: "text-rose-700/60",
    sectionAltCardBg: "bg-white",
    sectionAltCardBorder: "border-rose-100",
    ctaBg: "bg-rose-900",
    ctaText: "text-rose-50",
    ctaHover: "hover:bg-rose-950",
    headingColor: "text-rose-950",
    bodyColor: "text-rose-900/80",
    mutedColor: "text-rose-700/60",
    accentBg: "bg-rose-50",
    accentBorder: "border-rose-200",
    cardBg: "bg-white",
    cardBorder: "border-rose-100",
    guaranteeBg: "bg-amber-50",
    guaranteeBorder: "border-amber-200",
    urgencyBg: "bg-rose-100",
    urgencyText: "text-rose-800",
    starColor: "text-rose-500 fill-rose-500",
    trustColor: "text-rose-400/70",
  },
};
