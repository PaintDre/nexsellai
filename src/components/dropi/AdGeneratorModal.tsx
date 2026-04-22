import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Sparkles, Check, Tag, Heart, Zap, Coins, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  useCredits,
  isInsufficientCreditsError,
  isFreeDropiLimitReachedError,
} from "@/hooks/useCredits";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";
import { FreeBadge } from "@/components/FreeBadge";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";

type StructureKey = "price_urgency" | "lifestyle_benefit" | "direct_response";

const STRUCTURES: { key: StructureKey; icon: typeof Tag }[] = [
  { key: "price_urgency", icon: Tag },
  { key: "lifestyle_benefit", icon: Heart },
  { key: "direct_response", icon: Zap },
];

const BADGE_KEYS = ["offer", "new", "topSales", "recommended", "freeShipping"] as const;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: { id: string; name: string; image_main: string | null };
}

export const AdGeneratorModal = ({ open, onOpenChange, product }: Props) => {
  const { t, i18n } = useTranslation();
  const { profile, session } = useAuth();
  const { balance, costOf, refresh: refreshCredits } = useCredits();
  const navigate = useNavigate();
  const [showName, setShowName] = useState(true);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeKey, setBadgeKey] = useState<(typeof BADGE_KEYS)[number]>("offer");
  const [selected, setSelected] = useState<StructureKey[]>([
    "price_urgency",
    "lifestyle_benefit",
    "direct_response",
  ]);
  const [loading, setLoading] = useState(false);
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // 3 structures = pack of 3, otherwise per-image charge
  const isPack3 = selected.length === 3;
  const totalCost = isPack3
    ? costOf("dropi_ad_pack_3")
    : costOf("dropi_ad_with_image") * selected.length;

  const toggleStructure = (k: StructureKey) => {
    setSelected((prev) =>
      prev.includes(k) ? prev.filter((s) => s !== k) : [...prev, k],
    );
  };

  const handleGenerate = async () => {
    if (!session?.access_token) return;

    if (selected.length === 0) {
      toast.error(t("dropi.selectAtLeastOne"));
      return;
    }

    if (balance < totalCost) {
      setInsufficientOpen(true);
      return;
    }

    setLoading(true);
    setProgress(null);
    const toastId = toast.loading(t("ai.generatingAds"), {
      description: t("ai.queuedDesc"),
    });

    try {
      const badgeText = showBadge
        ? (t(`dropi.badgePresets.${badgeKey}`) as string)
        : null;

      const res = await supabase.functions.invoke("generate-dropi-ads", {
        body: {
          product_id: product.id,
          product_name: product.name,
          image_url: product.image_main,
          show_name: showName,
          badge: badgeText,
          structures: selected,
          language: profile?.language || i18n.language || "es",
        },
      });

      if (res.error) {
        if (isInsufficientCreditsError(res.error)) {
          setInsufficientOpen(true);
          await refreshCredits();
          toast.dismiss(toastId);
          return;
        }
        if (isFreeDropiLimitReachedError(res.error)) {
          toast.dismiss(toastId);
          toast.error(t("dropi.freeLimitTitle", "Límite del plan Free alcanzado"), {
            description: t(
              "dropi.freeLimitDesc",
              "Tu plan Free permite generar anuncios con IA solo 1 vez. Mejora tu plan para seguir creando.",
            ),
          });
          onOpenChange(false);
          navigate("/subscription");
          return;
        }
        throw res.error;
      }

      const { job_id, total } = (res.data || {}) as { job_id?: string; total?: number };
      if (!job_id) throw new Error("No job_id returned");

      setProgress({ done: 0, total: total ?? selected.length * 3 });

      // Poll the job row until it completes or fails.
      // Hard timeout safety: 8 minutes (way more than expected).
      const startedAt = Date.now();
      const HARD_TIMEOUT_MS = 8 * 60 * 1000;
      let finalImages: { format: string; structure: string; variation: number; url: string }[] = [];

      while (true) {
        if (Date.now() - startedAt > HARD_TIMEOUT_MS) {
          throw new Error("Tiempo de espera agotado. Intenta nuevamente.");
        }
        await new Promise((r) => setTimeout(r, 2500));

        const { data: job, error: jobErr } = await supabase
          .from("dropi_ad_jobs")
          .select("status, progress_done, progress_total, result_images, error_message")
          .eq("id", job_id)
          .single();

        if (jobErr) {
          console.error("Job poll error", jobErr);
          continue;
        }

        setProgress({
          done: job.progress_done ?? 0,
          total: job.progress_total ?? total ?? 9,
        });

        toast.loading(t("ai.generatingAds"), {
          id: toastId,
          description: `${job.progress_done ?? 0} / ${job.progress_total ?? total ?? 9}`,
        });

        if (job.status === "completed") {
          finalImages = (job.result_images as typeof finalImages) || [];
          break;
        }
        if (job.status === "failed") {
          throw new Error(job.error_message || "Generation failed");
        }
      }

      if (!finalImages.length) throw new Error("No images generated");

      const zip = new JSZip();
      await Promise.all(
        finalImages.map(async (img) => {
          const resp = await fetch(img.url);
          const blob = await resp.blob();
          zip.file(`${img.structure}_${img.format}.png`, blob);
        }),
      );
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${product.name.replace(/\s+/g, "_")}_ads.zip`);

      toast.success(t("ai.readyTitle"), {
        id: toastId,
        description: t("ai.readyDesc"),
      });
      await refreshCredits();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Ad generation failed:", err);
      toast.error(t("ai.errorTitle"), {
        id: toastId,
        description: err?.message || "Generation failed",
      });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-lg font-bold font-display flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("dropi.generateAds")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("dropi.adStructuresDesc")}
          </DialogDescription>

          <div className="space-y-5 py-2">
            {profile?.plan === "free" && (
              <div className="flex items-start gap-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="text-xs leading-snug">
                  <p className="font-semibold text-foreground">
                    {t("dropi.freeOneShotTitle", "Generación única en plan Free")}
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    {t(
                      "dropi.freeOneShotDesc",
                      "Las descargas de imágenes y videos del catálogo son gratis. Solo puedes generar anuncios con IA 1 vez. Mejora tu plan para uso ilimitado.",
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Structure selector */}
            <div className="space-y-2">
              <div>
                <Label className="text-sm font-semibold">
                  {t("dropi.adStructuresTitle")}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("dropi.adStructuresDesc")}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {STRUCTURES.map(({ key, icon: Icon }) => {
                  const active = selected.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleStructure(key)}
                      className={cn(
                        "relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border bg-card hover:bg-muted/50",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground">
                            {t(`dropi.structures.${key}.name`)}
                          </p>
                          {active && (
                            <Check className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          {t(`dropi.structures.${key}.desc`)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Toggles */}
            <div className="flex items-center justify-between">
              <Label className="text-sm">{t("dropi.showProductName")}</Label>
              <Switch checked={showName} onCheckedChange={setShowName} />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">{t("dropi.showBadge")}</Label>
              <Switch checked={showBadge} onCheckedChange={setShowBadge} />
            </div>

            {showBadge && (
              <div className="flex flex-wrap gap-2">
                {BADGE_KEYS.map((b) => {
                  const text = t(`dropi.badgePresets.${b}`) as string;
                  const active = badgeKey === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBadgeKey(b)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80",
                      )}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("dropi.adFormatsDesc")}
            </p>

            {/* Cost summary */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Coins className="h-3.5 w-3.5 text-primary" />
                <span>{t("credits.cost", "Costo")}</span>
              </div>
              <div className="text-xs">
                <span className="font-semibold tabular-nums">{totalCost}</span>{" "}
                <span className="text-muted-foreground">/ {balance} {t("credits.unit", "créditos")}</span>
              </div>
            </div>

            <Button
              className="w-full h-11"
              onClick={handleGenerate}
              disabled={loading || !product.image_main || selected.length === 0 || balance < totalCost}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {loading
                ? progress
                  ? `${t("dropi.generating")} (${progress.done}/${progress.total})`
                  : t("dropi.generating")
                : t("dropi.generateAndDownload")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <InsufficientCreditsModal
        open={insufficientOpen}
        onOpenChange={setInsufficientOpen}
        required={totalCost}
        action={isPack3 ? "dropi_ad_pack_3" : "dropi_ad_with_image"}
      />
    </>
  );
};
