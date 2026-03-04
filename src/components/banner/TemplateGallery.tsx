import { cn } from "@/lib/utils";
import { bannerTemplates, type BannerTemplate } from "./templates";

interface TemplateGalleryProps {
  selected: string;
  onSelect: (id: string) => void;
}

export const TemplateGallery = ({ selected, onSelect }: TemplateGalleryProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {bannerTemplates.map((tpl) => (
        <button
          key={tpl.id}
          onClick={() => onSelect(tpl.id)}
          className={cn(
            "group relative rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02]",
            selected === tpl.id
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border hover:border-primary/40"
          )}
        >
          <div className={cn("h-16 rounded-lg bg-gradient-to-br mb-3 flex items-center justify-center text-2xl", tpl.gradient)}>
            {tpl.icon}
          </div>
          <h4 className="font-semibold text-sm">{tpl.name}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tpl.description}</p>
          {selected === tpl.id && (
            <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs">✓</span>
            </div>
          )}
        </button>
      ))}
    </div>
  );
};
