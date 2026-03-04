export type LandingTheme = "minimal" | "bold" | "clean" | "warm";

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
    sectionBg: "bg-white",
    sectionAltBg: "bg-gray-950",
    sectionAltHeading: "text-white",
    sectionAltBody: "text-gray-300",
    sectionAltMuted: "text-gray-400",
    sectionAltCardBg: "bg-gray-900",
    sectionAltCardBorder: "border-gray-800",
    ctaBg: "bg-emerald-500",
    ctaText: "text-white",
    ctaHover: "hover:bg-emerald-600",
    headingColor: "text-gray-900",
    bodyColor: "text-gray-700",
    mutedColor: "text-gray-500",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    cardBg: "bg-white",
    cardBorder: "border-gray-200",
    guaranteeBg: "bg-emerald-50",
    guaranteeBorder: "border-emerald-300",
    urgencyBg: "bg-red-600",
    urgencyText: "text-white",
    starColor: "text-yellow-400 fill-yellow-400",
    trustColor: "text-gray-400",
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
};
