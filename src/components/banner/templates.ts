export interface BannerTemplate {
  id: string;
  name: string;
  description: string;
  gradient: string;
  icon: string;
}

export const bannerTemplates: BannerTemplate[] = [
  {
    id: "oferta-directa",
    name: "Oferta Directa",
    description: "Descuento visible, precio tachado, urgencia de compra",
    gradient: "from-red-500 to-yellow-500",
    icon: "🔥",
  },
  {
    id: "hero-producto",
    name: "Hero Producto",
    description: "Producto protagonista, fondo limpio, elegante",
    gradient: "from-slate-700 to-slate-900",
    icon: "✨",
  },
  {
    id: "social-proof",
    name: "Social Proof",
    description: "Estrellas, testimonios, confianza del comprador",
    gradient: "from-amber-400 to-orange-500",
    icon: "⭐",
  },
  {
    id: "beneficios-grid",
    name: "Beneficios Grid",
    description: "Producto centrado con íconos de beneficios alrededor",
    gradient: "from-emerald-500 to-teal-600",
    icon: "💎",
  },
  {
    id: "flash-sale",
    name: "Flash Sale",
    description: "Fondo oscuro, neón, urgencia máxima, alto contraste",
    gradient: "from-purple-600 to-pink-500",
    icon: "⚡",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    description: "Producto en contexto de uso, tonos cálidos, aspiracional",
    gradient: "from-rose-400 to-orange-300",
    icon: "📸",
  },
];

export const bannerSizes = [
  { id: "1080x1080", label: "Instagram Cuadrado", width: 1080, height: 1080 },
  { id: "1080x1920", label: "Instagram Stories", width: 1080, height: 1920 },
  { id: "1200x628", label: "Facebook Ad", width: 1200, height: 628 },
  { id: "1920x1080", label: "YouTube / HD", width: 1920, height: 1080 },
];
