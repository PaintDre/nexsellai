// Auto-optimiza el orden y la cantidad de bloques de una landing
// para garantizar la mejor jerarquía, conversión y ritmo visual.
//
// Reglas (basadas en mejores prácticas de e-commerce de alta conversión):
// 1. Máx 10 bloques visibles para evitar saturación.
// 2. Comparison se eleva temprano (justo después de benefits/features) para
//    justificar la elección antes de profundizar.
// 3. Testimonials se elevan tras benefits/features para generar confianza
//    temprano (no enterrarlos al final).
// 4. CTAs se distribuyen estratégicamente — el bloque cta principal va al
//    final, pero el renderer inserta micro-CTAs intermedios en hero, después
//    de benefits y después de testimonials.
// 5. Bloques redundantes se filtran (ej: marquee + emoji_benefits).

const OPTIMAL_ORDER: string[] = [
  "hero",
  "marquee_benefits",     // tira social ligera, justo bajo el hero
  "benefits",
  "emoji_benefits",       // grid visual rápido tras benefits
  "features",
  "before_after_slider",  // prueba visual fuerte
  "testimonials",         // ELEVADO: prueba social temprana
  "results_stats",        // datos cuantitativos
  "comparison",           // ELEVADO: justifica la elección
  "comparison_table",     // versión avanzada
  "objections",           // resuelve dudas tras conocer la propuesta
  "shipping_timeline",    // info logística
  "bundles",
  "bundle_offer",
  "offer",
  "urgency",              // se renderiza junto a offer
  "guarantee",
  "faq",
  "faq_cod",
  "microcopy",
  "cta",
];

// Bloques redundantes: si ambos existen, conservar solo el primero listado
const REDUNDANT_GROUPS: Array<[string, string]> = [
  ["benefits", "emoji_benefits"],          // emoji_benefits es complementario, OK ambos
  ["comparison_table", "comparison"],      // si hay tabla avanzada, omitir simple
  ["faq_cod", "faq"],                      // si hay faq COD, omitir genérico
  ["bundle_offer", "bundles"],             // si hay bundle_offer estructurado, omitir genérico
];

const MAX_VISIBLE_BLOCKS = 10;

// Bloques de baja prioridad que se descartan primero si excedemos el máximo
const LOW_PRIORITY = new Set([
  "microcopy",
  "marquee_benefits",
  "emoji_benefits",
  "shipping_timeline",
]);

export interface OptimizableBlock {
  type: string;
  [key: string]: any;
}

export function optimizeBlocks<T extends OptimizableBlock>(blocks: T[]): T[] {
  if (!Array.isArray(blocks) || blocks.length === 0) return blocks;

  // 1. Deduplicar por tipo (conservar la primera ocurrencia)
  const seen = new Set<string>();
  let result = blocks.filter((b) => {
    if (!b?.type) return false;
    if (seen.has(b.type)) return false;
    seen.add(b.type);
    return true;
  });

  // 2. Eliminar redundancias (cuando hay versión avanzada, quitar la simple)
  for (const [keep, drop] of REDUNDANT_GROUPS) {
    const hasKeep = result.some((b) => b.type === keep);
    const hasDrop = result.some((b) => b.type === drop);
    if (hasKeep && hasDrop && keep !== "benefits") {
      // benefits + emoji_benefits siempre conviven (son complementarios)
      result = result.filter((b) => b.type !== drop);
    }
  }

  // 3. Reordenar según OPTIMAL_ORDER
  result.sort((a, b) => {
    const ai = OPTIMAL_ORDER.indexOf(a.type);
    const bi = OPTIMAL_ORDER.indexOf(b.type);
    const av = ai === -1 ? 999 : ai;
    const bv = bi === -1 ? 999 : bi;
    return av - bv;
  });

  // 4. Si hay más de MAX_VISIBLE_BLOCKS, quitar los de baja prioridad primero
  while (result.length > MAX_VISIBLE_BLOCKS) {
    const idx = result.findIndex((b) => LOW_PRIORITY.has(b.type));
    if (idx === -1) break;
    result.splice(idx, 1);
  }

  // 5. Reasignar order para que sea consistente
  return result.map((b, i) => ({ ...b, order: i + 1 }));
}
