import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Lock } from "lucide-react";
import type { LandingTheme } from "./themes";

export interface LandingTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  /** Theme automatically applied when this template is picked. */
  theme?: LandingTheme;
  recommended?: boolean;
  premium?: boolean;
  /** Minimum plan required: "free" | "pro". Defaults to "free". */
  requiredPlan?: "free" | "pro";
  /** Style category badge ("Awwwards", "Apple", "DTC"...). */
  styleTag?: string;
}

export const landingTemplates: LandingTemplate[] = [
  // ─── FREE ───────────────────────────────────────────────────
  {
    id: "completa",
    name: "Completa",
    description: "Estructura clásica AIDA — todas las secciones para conversión",
    sections: ["hero", "benefits", "features", "testimonials", "objections", "faq", "offer", "guarantee", "cta"],
    theme: "clean",
    recommended: true,
    requiredPlan: "free",
  },
  {
    id: "rapida",
    name: "Rápida",
    description: "Solo lo esencial — hero, beneficios y CTA",
    sections: ["hero", "benefits", "offer", "cta"],
    theme: "minimal",
    requiredPlan: "free",
  },

  // ─── PREMIUM PRO (Awwwards-inspired) ────────────────────────
  {
    id: "saas-minimal",
    name: "SaaS Minimal",
    description: "Estilo Linear/Vercel — gris respirado, jerarquía perfecta, conversión silenciosa",
    sections: [
      "hero",
      "emoji_benefits",
      "features",
      "results_stats",
      "testimonials",
      "comparison_table",
      "faq",
      "cta",
    ],
    theme: "saas-mono",
    premium: true,
    requiredPlan: "pro",
    styleTag: "Linear",
  },
  {
    id: "dtc-bold",
    name: "DTC Bold",
    description: "Liquid Death/Olipop — negro absoluto + amarillo eléctrico, CTA agresivo",
    sections: [
      "hero",
      "marquee_benefits",
      "benefits",
      "before_after_slider",
      "results_stats",
      "testimonials",
      "bundle_offer",
      "faq_cod",
      "cta",
    ],
    theme: "dtc-bold",
    premium: true,
    requiredPlan: "pro",
    styleTag: "DTC",
  },
  {
    id: "editorial-apple",
    name: "Editorial Apple",
    description: "Apple product page — blanco puro, tipografía editorial, foco en producto",
    sections: [
      "hero",
      "features",
      "emoji_benefits",
      "results_stats",
      "before_after_slider",
      "testimonials",
      "guarantee",
      "cta",
    ],
    theme: "editorial-apple",
    premium: true,
    requiredPlan: "pro",
    styleTag: "Apple",
  },
  {
    id: "modern-ecommerce",
    name: "Modern E-commerce",
    description: "Allbirds/Aesop — tonos tierra, verde sage, storytelling de marca",
    sections: [
      "hero",
      "benefits",
      "features",
      "testimonials",
      "shipping_timeline",
      "guarantee",
      "offer",
      "cta",
    ],
    theme: "modern-ecommerce",
    premium: true,
    requiredPlan: "pro",
    styleTag: "Aesop",
  },
  {
    id: "story-soft",
    name: "Storytelling Soft",
    description: "Editorial cálido — crema y burdeos, narrativa emocional para productos premium",
    sections: [
      "hero",
      "emoji_benefits",
      "benefits",
      "testimonials",
      "before_after_slider",
      "guarantee",
      "faq",
      "cta",
    ],
    theme: "story-soft",
    premium: true,
    requiredPlan: "pro",
    styleTag: "Editorial",
  },

  // ─── Legacy: Shrine (PRO) — kept for backward compatibility
  {
    id: "shrine-latam",
    name: "Shrine Pro LATAM",
    description: "Avanzada con timeline de envío, comparativa, resultados y bundles",
    sections: [
      "hero", "emoji_benefits", "benefits", "results_stats",
      "before_after_slider", "comparison_table", "marquee_benefits",
      "testimonials", "shipping_timeline", "bundle_offer", "faq_cod", "cta",
    ],
    theme: "bold",
    premium: true,
    requiredPlan: "pro",
    styleTag: "LATAM",
  },
];

interface LandingTemplatePickerProps {
  selected: string;
  onSelect: (templateId: string) => void;
  /** Current user plan — used to gate PRO templates. */
  userPlan?: "free" | "starter" | "pro";
  /** Triggered when a locked template is clicked (e.g. open upgrade modal). */
  onLockedClick?: (templateId: string) => void;
}

const LandingTemplatePicker = ({
  selected,
  onSelect,
  userPlan = "free",
  onLockedClick,
}: LandingTemplatePickerProps) => {
  const isPro = userPlan === "pro";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {landingTemplates.map((tpl) => {
        const isSelected = selected === tpl.id;
        const isLocked = tpl.requiredPlan === "pro" && !isPro;

        return (
          <Card
            key={tpl.id}
            className={`relative cursor-pointer transition-all hover:shadow-md overflow-hidden ${
              isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/40"
            } ${tpl.premium ? "bg-gradient-to-br from-primary/5 to-transparent" : ""} ${
              isLocked ? "opacity-75" : ""
            }`}
            onClick={() => {
              if (isLocked) {
                onLockedClick?.(tpl.id);
                return;
              }
              onSelect(tpl.id);
            }}
          >
            {isLocked && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/95 border shadow-sm text-[10px] font-medium">
                <Lock className="h-3 w-3" />
                PRO
              </div>
            )}

            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {tpl.premium && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                  <h4 className="font-semibold text-sm">{tpl.name}</h4>
                  {tpl.recommended && (
                    <Badge variant="secondary" className="text-[10px]">Recomendada</Badge>
                  )}
                  {tpl.styleTag && (
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                      {tpl.styleTag}
                    </Badge>
                  )}
                </div>
                {isSelected && !isLocked && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{tpl.description}</p>
              <div className="flex flex-wrap gap-1">
                {tpl.sections.slice(0, 6).map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px] capitalize">
                    {s.replace(/_/g, " ")}
                  </Badge>
                ))}
                {tpl.sections.length > 6 && (
                  <Badge variant="outline" className="text-[10px]">+{tpl.sections.length - 6}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LandingTemplatePicker;
