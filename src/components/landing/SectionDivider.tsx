import { type LandingTheme } from "./themes";

interface SectionDividerProps {
  theme: LandingTheme;
  from: "hero" | "main" | "alt" | "accent";
  to: "hero" | "main" | "alt" | "accent" | "cta";
}

// Colores de divisor sincronizados con themes.ts. Deben coincidir EXACTAMENTE con sectionBg/sectionAltBg
// para garantizar transiciones invisibles entre secciones (sin flashes de blanco/negro/amarillo).
const colorMap: Record<LandingTheme, Record<string, string>> = {
  minimal: { hero: "#ffffff", main: "#ffffff", alt: "#f9fafb", accent: "#f9fafb", cta: "#f9fafb" },
  bold: { hero: "#030712", main: "#111827", alt: "#030712", accent: "#111827", cta: "#030712" },
  clean: { hero: "#eff6ff", main: "#ffffff", alt: "#f8fafc", accent: "#eff6ff", cta: "#f8fafc" },
  warm: { hero: "#fffbeb", main: "#ffffff", alt: "#fff7ed", accent: "#fffbeb", cta: "#fff7ed" },
  "saas-mono": { hero: "#fafafa", main: "#ffffff", alt: "#fafafa", accent: "#eef2ff", cta: "#fafafa" },
  "dtc-bold": { hero: "#09090b", main: "#09090b", alt: "#18181b", accent: "#18181b", cta: "#18181b" },
  "editorial-apple": { hero: "#ffffff", main: "#ffffff", alt: "#f5f5f5", accent: "#fafafa", cta: "#f5f5f5" },
  "modern-ecommerce": { hero: "#f5f5f4", main: "#fafaf9", alt: "#ffffff", accent: "#ecfdf5", cta: "#fafaf9" },
  "story-soft": { hero: "#fff1f2", main: "#fffbeb", alt: "#ffffff", accent: "#fff1f2", cta: "#fffbeb" },
};

/**
 * Renderiza una transición SUAVE entre dos secciones.
 * - Si los colores son iguales o muy cercanos: no renderiza nada (transición natural).
 * - Si difieren: renderiza un degradado lineal corto (24-40px) en lugar de una onda SVG abrupta.
 *   Esto evita los "flashes" de color que aparecían cuando el SVG dejaba ver el fondo del body.
 */
const SectionDivider = ({ theme, from, to }: SectionDividerProps) => {
  const colors = colorMap[theme];
  const fromColor = colors[from] || "#ffffff";
  const toColor = colors[to] || "#ffffff";

  // Si los colores son iguales, no necesitamos divisor
  if (fromColor.toLowerCase() === toColor.toLowerCase()) return null;

  return (
    <div
      aria-hidden
      className="w-full h-8 md:h-10 -mt-px -mb-px"
      style={{
        background: `linear-gradient(to bottom, ${fromColor} 0%, ${toColor} 100%)`,
      }}
    />
  );
};

export default SectionDivider;
