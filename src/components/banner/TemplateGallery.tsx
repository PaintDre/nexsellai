import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { bannerTemplates } from "./templates";

interface TemplateGalleryProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const HookPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-2 text-white gap-1">
    <span className="text-[9px] font-extrabold tracking-wider">🎯 ATENCIÓN</span>
    <div className="bg-white/20 rounded-lg w-10 h-10 flex items-center justify-center text-xl animate-pulse">👀</div>
    <span className="text-[7px] font-bold">¿Sabías que...?</span>
    <span className="text-[5px] text-white/70">Impacto visual máximo</span>
  </div>
);

const ProblemaPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-2 text-white gap-1">
    <span className="text-[9px] font-bold">😤 ¿Te pasa esto?</span>
    <div className="bg-white/10 rounded w-full p-1.5">
      <span className="text-[5px] block">❌ Problema común #1</span>
      <span className="text-[5px] block">❌ Problema común #2</span>
      <span className="text-[5px] block">❌ Problema común #3</span>
    </div>
    <span className="text-[6px] text-white/60 italic">"Hay una solución..."</span>
  </div>
);

const SolucionPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-2 text-white gap-1">
    <span className="text-[8px] font-bold">💡 LA SOLUCIÓN</span>
    <div className="bg-white/20 rounded w-8 h-8 flex items-center justify-center text-lg">📦</div>
    <span className="text-[7px] font-semibold">Tu Producto</span>
    <div className="flex gap-1">
      <span className="text-[5px] bg-white/20 rounded px-1">✅ Fácil</span>
      <span className="text-[5px] bg-white/20 rounded px-1">✅ Rápido</span>
    </div>
  </div>
);

const BeneficioPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-2 text-white gap-1">
    <span className="text-[7px] font-bold">💎 BENEFICIO CLAVE</span>
    <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center text-lg">🏆</div>
    <span className="text-[8px] font-extrabold text-center leading-tight">Lo que realmente ganas</span>
    <span className="text-[5px] text-white/70">Ventaja competitiva #1</span>
  </div>
);

const PruebaSocialPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-between p-2 text-white">
    <span className="text-[9px] font-bold">⭐⭐⭐⭐⭐ 4.9/5</span>
    <span className="text-[6px] font-semibold">+5,000 CLIENTES</span>
    <div className="bg-white/20 rounded p-1 w-full">
      <span className="text-[5px] italic">"¡Me cambió la vida!"</span>
    </div>
    <div className="bg-white/20 rounded p-1 w-full">
      <span className="text-[5px] italic">"100% recomendado"</span>
    </div>
    <span className="text-[5px] bg-white/20 rounded px-1">🔒 Compra Segura</span>
  </div>
);

const OfertaPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-between p-2 text-white">
    <span className="text-[7px] font-bold bg-white/20 rounded px-1">🔥 OFERTA LIMITADA</span>
    <div className="bg-white/20 rounded w-8 h-8 flex items-center justify-center text-lg">📦</div>
    <span className="text-[10px] font-extrabold">$29.990</span>
    <div className="flex gap-1">
      <span className="text-[5px] bg-white/20 rounded px-0.5">🚚 Envío Gratis</span>
      <span className="text-[5px] bg-white/20 rounded px-0.5">💰 Contraentrega</span>
    </div>
    <span className="text-[5px] text-yellow-200">⏱ Tiempo limitado</span>
  </div>
);

const CtaPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-2 text-white gap-1.5">
    <span className="text-[8px] font-bold">🚀 ¡NO ESPERES MÁS!</span>
    <div className="bg-white text-green-700 font-extrabold text-[8px] rounded px-3 py-1">
      COMPRAR AHORA
    </div>
    <span className="text-[5px] text-white/70">🚚 Envío Gratis • 💰 Contraentrega</span>
    <span className="text-[5px] text-yellow-200 font-bold">⚡ Últimas unidades</span>
  </div>
);

const previewComponents: Record<string, React.FC> = {
  hook: HookPreview,
  problema: ProblemaPreview,
  solucion: SolucionPreview,
  beneficio: BeneficioPreview,
  "prueba-social": PruebaSocialPreview,
  oferta: OfertaPreview,
  cta: CtaPreview,
};

export const TemplateGallery = ({ selectedId, onSelect }: TemplateGalleryProps) => {
  const [filter, setFilter] = useState<"all" | "early" | "mid" | "late">("all");

  const filtered = useMemo(() => {
    if (filter === "all") return bannerTemplates;
    if (filter === "early") return bannerTemplates.filter((t) => t.salesStage <= 2);
    if (filter === "mid") return bannerTemplates.filter((t) => t.salesStage >= 3 && t.salesStage <= 5);
    return bannerTemplates.filter((t) => t.salesStage >= 6);
  }, [filter]);

  const chips: { id: typeof filter; label: string }[] = [
    { id: "all", label: `Todos (${bannerTemplates.length})` },
    { id: "early", label: "🎯 Atención" },
    { id: "mid", label: "💡 Interés" },
    { id: "late", label: "🔥 Conversión" },
  ];

  return (
    <div className="space-y-4">
      {/* Stage filter chips */}
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={cn(
              "text-xs font-medium rounded-full px-3 py-1.5 border transition-all",
              filter === c.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filtered.map((tpl) => {
        const PreviewComponent = previewComponents[tpl.previewLayout];
        const isSelected = selectedId === tpl.id;
        return (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl.id)}
            className={cn(
              "group relative rounded-xl border-2 p-3 text-left transition-all hover:scale-[1.02]",
              isSelected
                ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                : "border-border hover:border-primary/40"
            )}
          >
            {/* Stage badge */}
            <div className="absolute top-2 right-2 z-10">
              <span className={cn(
                "text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {tpl.salesStage}
              </span>
            </div>

            {/* Mini preview */}
            <div className={cn("h-28 rounded-lg overflow-hidden mb-3", tpl.previewBg)}>
              {PreviewComponent && <PreviewComponent />}
            </div>

            {/* Template info */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{tpl.icon}</span>
              <h4 className="font-semibold text-sm leading-tight">{tpl.name}</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">{tpl.description}</p>
          </button>
        );
      })}
      </div>
    </div>
  );
};
