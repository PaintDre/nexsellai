export interface BannerTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  previewBg: string;
  previewLayout: "hook" | "problema" | "solucion" | "beneficio" | "prueba-social" | "oferta" | "cta";
  salesStage: number;
}

export const bannerTemplates: BannerTemplate[] = [
  {
    id: "hook-visual",
    name: "Hook Visual",
    description: "Ideal para captar la atención en los primeros segundos del anuncio. Impacto visual máximo.",
    icon: "🎯",
    previewBg: "bg-gradient-to-br from-violet-600 to-fuchsia-500",
    previewLayout: "hook",
    salesStage: 1,
  },
  {
    id: "problema",
    name: "Problema del Cliente",
    description: "Identifica el dolor o frustración del cliente. Genera empatía y conexión emocional.",
    icon: "😤",
    previewBg: "bg-gradient-to-br from-slate-700 to-slate-900",
    previewLayout: "problema",
    salesStage: 2,
  },
  {
    id: "solucion",
    name: "Solución del Producto",
    description: "Presenta tu producto como la respuesta perfecta al problema. Transición del dolor a la esperanza.",
    icon: "💡",
    previewBg: "bg-gradient-to-br from-sky-500 to-blue-600",
    previewLayout: "solucion",
    salesStage: 3,
  },
  {
    id: "beneficio",
    name: "Beneficio Principal",
    description: "Destaca la ventaja clave que diferencia tu producto. Lo que el cliente realmente gana.",
    icon: "💎",
    previewBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    previewLayout: "beneficio",
    salesStage: 4,
  },
  {
    id: "prueba-social",
    name: "Prueba Social",
    description: "Genera confianza con testimonios, valoraciones y números de clientes satisfechos.",
    icon: "⭐",
    previewBg: "bg-gradient-to-br from-amber-400 to-orange-500",
    previewLayout: "prueba-social",
    salesStage: 5,
  },
  {
    id: "oferta",
    name: "Oferta e Incentivo",
    description: "Motiva la compra con precio visible, envío gratis, garantía y urgencia de tiempo limitado.",
    icon: "🔥",
    previewBg: "bg-gradient-to-br from-red-500 to-orange-400",
    previewLayout: "oferta",
    salesStage: 6,
  },
  {
    id: "cta",
    name: "Llamado a la Acción",
    description: "Cierra la venta con un CTA potente. Último empujón para que el cliente compre ahora.",
    icon: "🚀",
    previewBg: "bg-gradient-to-br from-green-500 to-emerald-600",
    previewLayout: "cta",
    salesStage: 7,
  },
];

export const bannerSizes = [
  { id: "1080x1080", label: "Instagram Cuadrado", width: 1080, height: 1080 },
  { id: "1080x1920", label: "Instagram Stories", width: 1080, height: 1920 },
  { id: "1200x628", label: "Facebook Ad", width: 1200, height: 628 },
  { id: "1920x1080", label: "YouTube / HD", width: 1920, height: 1080 },
];

export const bannerQuantityOptions = [
  { value: 2, label: "2 banners", description: "Secuencia rápida de venta" },
  { value: 3, label: "3 banners", description: "Balance ideal para campañas" },
  { value: 5, label: "5 banners", description: "Secuencia completa de venta" },
];
