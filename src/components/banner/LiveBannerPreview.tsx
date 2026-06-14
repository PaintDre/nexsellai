import { useMemo } from "react";
import { bannerTemplates, bannerSizes } from "./templates";
import { Sparkles, Coins, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface LiveBannerPreviewProps {
  productName?: string;
  productImage?: string;
  formattedPrice?: string;
  slogan?: string;
  description?: string;
  sequence: string[];
  outputSize: string;
  mode: "auto" | "custom";
  totalCost: number;
  balance: number;
  step: number;
}

/**
 * Sticky live preview side-panel for the Banner Wizard.
 * Updates in real time as the user fills each step, so they
 * can see WHAT they're about to generate before spending credits.
 */
export const LiveBannerPreview = ({
  productName,
  productImage,
  formattedPrice,
  slogan,
  description,
  sequence,
  outputSize,
  mode,
  totalCost,
  balance,
  step,
}: LiveBannerPreviewProps) => {
  const { t } = useTranslation();

  const size = useMemo(
    () => bannerSizes.find((s) => s.id === outputSize) || bannerSizes[0],
    [outputSize],
  );

  // Aspect ratio for the mock — clamped so very tall (1080x1920) still fits.
  const aspect = size.width / size.height;
  const mockMaxH = 320;
  const mockMaxW = 260;
  let w = mockMaxW;
  let h = w / aspect;
  if (h > mockMaxH) {
    h = mockMaxH;
    w = h * aspect;
  }

  const firstTpl = bannerTemplates.find((tpl) => tpl.id === sequence[0]);
  const insufficient = balance < totalCost;

  return (
    <aside className="hidden lg:flex sticky top-4 self-start flex-col gap-4 w-full max-w-sm">
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {t("generateBanner.livePreview", "Vista previa")}
          </p>
          <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
            {size.width}×{size.height}
          </span>
        </div>

        {/* Mock banner */}
        <div className="p-5 flex items-center justify-center bg-gradient-to-br from-muted/40 to-muted/10">
          <div
            style={{ width: w, height: h }}
            className={cn(
              "relative rounded-xl overflow-hidden shadow-xl ring-1 ring-black/5 transition-all duration-300",
              firstTpl?.previewBg || "bg-gradient-to-br from-primary/40 to-primary",
            )}
          >
            {productImage ? (
              <img
                src={productImage}
                alt={productName}
                className="absolute inset-0 w-full h-full object-contain p-4"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-white/70">
                <ImageIcon className="h-10 w-10" />
              </div>
            )}
            {/* Bottom gradient overlay with copy */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10">
              {slogan ? (
                <p className="text-white text-[11px] font-bold leading-tight line-clamp-2 drop-shadow">
                  {slogan}
                </p>
              ) : productName ? (
                <p className="text-white text-[11px] font-bold leading-tight line-clamp-2 drop-shadow">
                  {productName}
                </p>
              ) : null}
              {formattedPrice && (
                <p className="text-white/90 text-[10px] font-semibold mt-0.5 drop-shadow">
                  {formattedPrice}
                </p>
              )}
            </div>
            {/* Stage badge */}
            {firstTpl && (
              <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-white/90 text-foreground rounded-full px-2 py-0.5">
                {firstTpl.icon} {firstTpl.name}
              </span>
            )}
          </div>
        </div>

        {/* Sequence dots */}
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {t("generateBanner.sequence")} · {sequence.length}
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {sequence.map((tid, i) => {
              const tpl = bannerTemplates.find((tpl) => tpl.id === tid);
              return (
                <span
                  key={i}
                  className="text-[10px] bg-muted rounded-full px-2 py-0.5 font-medium"
                  title={tpl?.name}
                >
                  {tpl?.icon}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("generateBanner.mode")}</span>
          <span className="font-semibold">
            {mode === "auto" ? t("generateBanner.auto") : t("generateBanner.customMode")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("generateBanner.size")}</span>
          <span className="font-semibold tabular-nums">{size.label}</span>
        </div>
        <div className="h-px bg-border/50 my-1" />
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Coins className="h-3 w-3 text-primary" />
            {t("credits.cost", "Costo")}
          </span>
          <span className="font-bold tabular-nums">{totalCost}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("credits.balance", "Saldo")}</span>
          <span
            className={cn(
              "font-semibold tabular-nums",
              insufficient ? "text-destructive" : "text-foreground",
            )}
          >
            {balance}
          </span>
        </div>
      </div>

      {/* Step hint */}
      <p className="text-[11px] text-muted-foreground text-center px-2">
        {step === 0 && t("generateBanner.hintStep1", "Describe bien tu producto: la IA usa esto para generar copy ganador.")}
        {step === 1 && t("generateBanner.hintStep2", "Elige cuántos banners necesitas. 3 es ideal para empezar.")}
        {step === 2 && t("generateBanner.hintStep3", "Revisa el resumen y genera. Cada banner es único.")}
      </p>
    </aside>
  );
};
