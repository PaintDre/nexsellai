import { cn } from "@/lib/utils";
import { bannerTemplates, type BannerTemplate } from "./templates";

interface TemplateGalleryProps {
  selected: string;
  onSelect: (id: string) => void;
}

const OfferPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-between p-2 text-white">
    <span className="text-[7px] font-bold bg-white/20 rounded px-1">🔥 OFERTA LIMITADA</span>
    <div className="bg-white/20 rounded w-8 h-8 flex items-center justify-center text-lg">📦</div>
    <span className="text-[10px] font-extrabold">$29.990</span>
    <span className="text-[6px] bg-white text-red-600 font-bold rounded px-1.5 py-0.5">COMPRAR AHORA</span>
    <div className="flex gap-1">
      <span className="text-[5px] bg-white/20 rounded px-0.5">🚚 Envío Gratis</span>
      <span className="text-[5px] bg-white/20 rounded px-0.5">💰 Contraentrega</span>
    </div>
  </div>
);

const HeroPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-2 text-white gap-1">
    <div className="bg-white/10 rounded w-10 h-10 flex items-center justify-center text-xl">✨</div>
    <span className="text-[9px] font-bold tracking-wide">PRODUCTO PREMIUM</span>
    <span className="text-[7px] text-white/60">Diseño elegante y minimalista</span>
    <span className="text-[8px] font-bold mt-1">$49.990</span>
    <span className="text-[5px] text-white/40">🚚 Envío Gratis</span>
  </div>
);

const SocialPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-between p-2 text-white">
    <span className="text-[9px] font-bold">⭐⭐⭐⭐⭐ 4.9/5</span>
    <span className="text-[6px] font-semibold">+5,000 CLIENTES</span>
    <div className="bg-white/20 rounded w-8 h-8 flex items-center justify-center text-lg">🛍️</div>
    <div className="bg-white/20 rounded p-1 w-full">
      <span className="text-[5px] italic">"¡Excelente producto!"</span>
    </div>
    <div className="flex gap-1">
      <span className="text-[5px] bg-white/20 rounded px-0.5">🔒 Seguro</span>
      <span className="text-[5px] bg-white/20 rounded px-0.5">↩️ Garantía</span>
    </div>
  </div>
);

const GridPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-2 text-white gap-1">
    <span className="text-[7px] font-bold">BENEFICIOS</span>
    <div className="bg-white/20 rounded w-7 h-7 flex items-center justify-center text-sm">💎</div>
    <div className="grid grid-cols-2 gap-0.5 w-full">
      <span className="text-[5px] bg-white/20 rounded text-center py-0.5">🚚 Envío</span>
      <span className="text-[5px] bg-white/20 rounded text-center py-0.5">💰 Contra.</span>
      <span className="text-[5px] bg-white/20 rounded text-center py-0.5">🔄 Garantía</span>
      <span className="text-[5px] bg-white/20 rounded text-center py-0.5">⚡ Rápido</span>
    </div>
  </div>
);

const FlashPreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-between p-2 text-cyan-400">
    <span className="text-[8px] font-extrabold tracking-wider">⚡ VENTA FLASH ⚡</span>
    <div className="border border-cyan-400/50 rounded w-8 h-8 flex items-center justify-center text-lg shadow-[0_0_8px_rgba(0,255,255,0.3)]">
      🎮
    </div>
    <span className="text-[10px] font-extrabold text-white">$19.990</span>
    <span className="text-[5px] text-cyan-300 font-mono">⏱ 02:45:30</span>
    <span className="text-[5px] text-pink-400 font-bold">🔥 ÚLTIMAS UNIDADES</span>
  </div>
);

const LifestylePreview = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-2 text-rose-900 gap-1">
    <span className="text-[7px] font-semibold">Tu estilo de vida</span>
    <div className="bg-white/40 rounded-full w-10 h-10 flex items-center justify-center text-xl">📸</div>
    <span className="text-[8px] font-bold">Producto Premium</span>
    <span className="text-[6px] text-rose-700">⭐ 4.9 — Miles de clientes</span>
    <span className="text-[7px] font-bold">$34.990</span>
  </div>
);

const previewComponents: Record<string, React.FC> = {
  offer: OfferPreview,
  hero: HeroPreview,
  social: SocialPreview,
  grid: GridPreview,
  flash: FlashPreview,
  lifestyle: LifestylePreview,
};

export const TemplateGallery = ({ selected, onSelect }: TemplateGalleryProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {bannerTemplates.map((tpl) => {
        const PreviewComponent = previewComponents[tpl.previewLayout];
        return (
          <button
            key={tpl.id}
            onClick={() => onSelect(tpl.id)}
            className={cn(
              "group relative rounded-xl border-2 p-3 text-left transition-all hover:scale-[1.02]",
              selected === tpl.id
                ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                : "border-border hover:border-primary/40"
            )}
          >
            {/* Mini preview */}
            <div className={cn("h-28 rounded-lg overflow-hidden mb-3", tpl.previewBg)}>
              {PreviewComponent && <PreviewComponent />}
            </div>

            {/* Template info */}
            <h4 className="font-semibold text-base leading-tight">{tpl.name}</h4>
            <p className="text-sm text-muted-foreground mt-1.5 leading-snug">{tpl.description}</p>

            {/* Selected indicator */}
            {selected === tpl.id && (
              <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                <span className="text-primary-foreground text-xs font-bold">✓</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
