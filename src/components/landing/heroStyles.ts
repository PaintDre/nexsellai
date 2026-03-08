export interface HeroStyle {
  bgClass: string;
  textClass: string;
  subtextClass: string;
  overlayClass: string;
  accentClass: string;
  imageRingClass: string;
}

const categoryStyles: Record<string, HeroStyle> = {
  beauty: {
    bgClass: "bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50",
    textClass: "text-rose-950",
    subtextClass: "text-rose-800",
    overlayClass: "bg-gradient-to-r from-rose-950/75 via-rose-900/55 to-pink-900/30",
    accentClass: "from-rose-200/30 to-transparent",
    imageRingClass: "ring-rose-200/50 shadow-rose-200/20",
  },
  health: {
    bgClass: "bg-gradient-to-br from-sky-50 via-blue-50 to-white",
    textClass: "text-sky-950",
    subtextClass: "text-sky-800",
    overlayClass: "bg-gradient-to-r from-sky-950/75 via-blue-900/55 to-sky-800/25",
    accentClass: "from-sky-200/30 to-transparent",
    imageRingClass: "ring-sky-200/50 shadow-sky-200/20",
  },
  gadget: {
    bgClass: "bg-gradient-to-br from-gray-950 via-slate-900 to-indigo-950",
    textClass: "text-white",
    subtextClass: "text-gray-300",
    overlayClass: "bg-gradient-to-r from-gray-950/85 via-indigo-950/65 to-purple-950/35",
    accentClass: "from-indigo-500/10 to-transparent",
    imageRingClass: "ring-indigo-400/30 shadow-indigo-500/20",
  },
  pets: {
    bgClass: "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50",
    textClass: "text-amber-950",
    subtextClass: "text-amber-800",
    overlayClass: "bg-gradient-to-r from-amber-950/75 via-orange-900/55 to-amber-800/25",
    accentClass: "from-amber-200/30 to-transparent",
    imageRingClass: "ring-amber-200/50 shadow-amber-200/20",
  },
  home: {
    bgClass: "bg-gradient-to-br from-stone-50 via-amber-50/50 to-neutral-50",
    textClass: "text-stone-900",
    subtextClass: "text-stone-700",
    overlayClass: "bg-gradient-to-r from-stone-900/75 via-stone-800/55 to-stone-700/25",
    accentClass: "from-stone-200/30 to-transparent",
    imageRingClass: "ring-stone-200/50 shadow-stone-200/20",
  },
  fitness: {
    bgClass: "bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50",
    textClass: "text-emerald-950",
    subtextClass: "text-emerald-800",
    overlayClass: "bg-gradient-to-r from-emerald-950/80 via-green-900/60 to-teal-900/30",
    accentClass: "from-emerald-200/30 to-transparent",
    imageRingClass: "ring-emerald-200/50 shadow-emerald-200/20",
  },
  automotive: {
    bgClass: "bg-gradient-to-br from-gray-950 via-zinc-900 to-gray-900",
    textClass: "text-white",
    subtextClass: "text-gray-300",
    overlayClass: "bg-gradient-to-r from-gray-950/85 via-zinc-900/65 to-gray-800/35",
    accentClass: "from-zinc-400/10 to-transparent",
    imageRingClass: "ring-zinc-400/30 shadow-zinc-500/20",
  },
};

// Keywords that map to each category key
const categoryKeywords: Record<string, string[]> = {
  beauty: ["beauty", "skincare", "belleza", "cosmetic", "makeup", "maquillaje", "skin", "piel"],
  health: ["health", "wellness", "salud", "bienestar", "medical", "clinical", "nasal", "pharma"],
  gadget: ["gadget", "electronics", "tech", "tecnología", "led", "smart", "device", "electrónica"],
  pets: ["pets", "mascotas", "pet", "mascota", "dog", "cat", "perro", "gato", "animal"],
  home: ["home", "kitchen", "hogar", "cocina", "casa", "household", "limpieza", "cleaning"],
  fitness: ["fitness", "sport", "gym", "ejercicio", "deporte", "training", "workout"],
  automotive: ["automotive", "auto", "car", "carro", "coche", "vehicle", "vehiculo", "moto"],
};

const defaultStyle: HeroStyle = {
  bgClass: "bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100",
  textClass: "text-gray-900",
  subtextClass: "text-gray-600",
  overlayClass: "bg-gradient-to-r from-black/80 via-black/60 to-black/30",
  accentClass: "from-gray-200/20 to-transparent",
  imageRingClass: "ring-black/5",
};

export function getHeroStyle(category?: string | null): HeroStyle {
  if (!category) return defaultStyle;

  const normalized = category.toLowerCase().trim();

  // Direct match against known category keys (e.g. from product_category enum)
  if (categoryStyles[normalized]) return categoryStyles[normalized];

  // Keyword search
  for (const [key, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return categoryStyles[key];
    }
  }

  return defaultStyle;
}
