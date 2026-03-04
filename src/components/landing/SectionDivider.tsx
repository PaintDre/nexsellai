import { type LandingTheme } from "./themes";

interface SectionDividerProps {
  theme: LandingTheme;
  from: "hero" | "main" | "alt" | "accent";
  to: "hero" | "main" | "alt" | "accent" | "cta";
}

const colorMap: Record<LandingTheme, Record<string, string>> = {
  minimal: { hero: "#ffffff", main: "#ffffff", alt: "#f9fafb", accent: "#f9fafb", cta: "#f9fafb" },
  bold: { hero: "#030712", main: "#ffffff", alt: "#030712", accent: "#ecfdf5", cta: "#030712" },
  clean: { hero: "#eff6ff", main: "#ffffff", alt: "#f8fafc", accent: "#eff6ff", cta: "#f8fafc" },
  warm: { hero: "#fffbeb", main: "#ffffff", alt: "#fff7ed", accent: "#fffbeb", cta: "#fff7ed" },
};

const SectionDivider = ({ theme, from, to }: SectionDividerProps) => {
  const colors = colorMap[theme];
  const fillColor = colors[to] || "#ffffff";

  return (
    <div className="relative -mt-px" style={{ color: fillColor }}>
      <svg
        viewBox="0 0 1440 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-6 md:h-10 block"
        preserveAspectRatio="none"
      >
        <path
          d="M0 48h1440V24C1200 44 960 0 720 24C480 48 240 4 0 24v24z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

export default SectionDivider;
