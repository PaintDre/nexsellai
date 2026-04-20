import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Sparkles, Check, Tag, Heart, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UpgradeModal } from "@/components/UpgradeModal";
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
  const [showName, setShowName] = useState(true);
  const [showBadge, setShowBadge] = useState(true);
  const [badgeKey, setBadgeKey] = useState<(typeof BADGE_KEYS)[number]>("offer");
  const [selected, setSelected] = useState<StructureKey[]>([
    "price_urgency",
    "lifestyle_benefit",
    "direct_response",
  ]);
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

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

    // Read plan limits from system_config (managed in /admin/config)
    const plan = (profile?.plan ?? "free") as "free" | "starter" | "pro";
    const { data: limitsRow } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "dropi_ads_limits")
      .maybeSingle();
    const limits = (limitsRow?.value ?? { free: 1, starter: 30, pro: 150 }) as Record<string, number>;
    const planLimit = limits[plan] ?? 1;

    // 30-day rolling usage window
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("dropi_ad_generations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .gte("created_at", since);

    if ((count ?? 0) >= planLimit) {
      setUpgradeOpen(true);
      return;
    }

    setLoading(true);
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

      if (res.error) throw res.error;
      const { images } = res.data as {
        images: { format: string; structure: string; variation: number; url: string }[];
      };

      if (!images?.length) throw new Error("No images generated");

      const zip = new JSZip();
      await Promise.all(
        images.map(async (img) => {
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
      onOpenChange(false);
    } catch (err: any) {
      console.error("Ad generation failed:", err);
      toast.error(t("ai.errorTitle"), {
        id: toastId,
        description: err?.message || "Generation failed",
      });
    } finally {
      setLoading(false);
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

            <Button
              className="w-full h-11"
              onClick={handleGenerate}
              disabled={loading || !product.image_main || selected.length === 0}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {loading ? t("dropi.generating") : t("dropi.generateAndDownload")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        resource={t("dropi.adGenerations")}
        used={1}
        limit={1}
      />
    </>
  );
};
