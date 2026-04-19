import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

export interface LandingTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  recommended?: boolean;
  premium?: boolean;
}

export const landingTemplates: LandingTemplate[] = [
  {
    id: "shrine-latam",
    name: "Shrine Pro LATAM",
    description: "Plantilla avanzada con timeline de envío, comparativa, resultados y bundles",
    sections: [
      "hero", "emoji_benefits", "benefits", "results_stats",
      "before_after_slider", "comparison_table", "marquee_benefits",
      "testimonials", "shipping_timeline", "bundle_offer", "faq_cod", "cta",
    ],
    recommended: true,
    premium: true,
  },
  {
    id: "completa",
    name: "Completa",
    description: "Todas las secciones para máxima conversión",
    sections: ["hero", "benefits", "features", "testimonials", "objections", "faq", "offer", "guarantee", "cta"],
  },
  {
    id: "rapida",
    name: "Rápida",
    description: "Solo lo esencial: hero, beneficios y CTA",
    sections: ["hero", "benefits", "offer", "cta"],
  },
  {
    id: "social-proof",
    name: "Social Proof",
    description: "Énfasis en testimonios y comparación",
    sections: ["hero", "testimonials", "comparison", "benefits", "offer", "cta"],
  },
  {
    id: "educativa",
    name: "Educativa",
    description: "Contenido extenso con FAQ y objeciones",
    sections: ["hero", "features", "benefits", "objections", "faq", "guarantee", "cta"],
  },
];

interface LandingTemplatePickerProps {
  selected: string;
  onSelect: (templateId: string) => void;
}

const LandingTemplatePicker = ({ selected, onSelect }: LandingTemplatePickerProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {landingTemplates.map((tpl) => {
        const isSelected = selected === tpl.id;
        return (
          <Card
            key={tpl.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isSelected ? "ring-2 ring-primary border-primary" : "hover:border-primary/40"
            } ${tpl.premium ? "bg-gradient-to-br from-primary/5 to-transparent" : ""}`}
            onClick={() => onSelect(tpl.id)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {tpl.premium && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                  <h4 className="font-semibold text-sm">{tpl.name}</h4>
                  {tpl.recommended && (
                    <Badge variant="secondary" className="text-[10px]">Recomendada</Badge>
                  )}
                  {tpl.premium && (
                    <Badge className="text-[10px] bg-primary/15 text-primary hover:bg-primary/20 border-0">PRO</Badge>
                  )}
                </div>
                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{tpl.description}</p>
              <div className="flex flex-wrap gap-1">
                {tpl.sections.slice(0, 6).map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px] capitalize">{s.replace(/_/g, " ")}</Badge>
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
