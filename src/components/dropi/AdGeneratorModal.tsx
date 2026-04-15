import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useTranslation } from "react-i18next";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const BADGES = ["OFERTA", "NUEVO", "TOP VENTAS", "RECOMENDADO"] as const;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: { id: string; name: string; image_main: string | null };
}

export const AdGeneratorModal = ({ open, onOpenChange, product }: Props) => {
  const { t } = useTranslation();
  const { profile, session } = useAuth();
  const [showName, setShowName] = useState(true);
  const [showBadge, setShowBadge] = useState(true);
  const [badge, setBadge] = useState<string>("OFERTA");
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleGenerate = async () => {
    if (!session?.access_token) return;

    // Check free plan limit
    if (profile?.plan === "free") {
      const { count } = await supabase
        .from("dropi_ad_generations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if ((count ?? 0) >= 1) {
        setUpgradeOpen(true);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await supabase.functions.invoke("generate-dropi-ads", {
        body: {
          product_id: product.id,
          product_name: product.name,
          image_url: product.image_main,
          show_name: showName,
          badge: showBadge ? badge : null,
        },
      });

      if (res.error) throw res.error;
      const { images } = res.data as { images: { format: string; variation: number; url: string }[] };

      // Bundle into ZIP
      const zip = new JSZip();
      await Promise.all(
        images.map(async (img, i) => {
          const resp = await fetch(img.url);
          const blob = await resp.blob();
          zip.file(`${img.format}_v${img.variation}.png`, blob);
        })
      );
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${product.name.replace(/\s+/g, "_")}_ads.zip`);

      onOpenChange(false);
    } catch (err) {
      console.error("Ad generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-lg font-bold font-display flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("dropi.generateAds")}
          </DialogTitle>

          <div className="space-y-5 py-2">
            <div className="flex items-center justify-between">
              <Label>{t("dropi.showProductName")}</Label>
              <Switch checked={showName} onCheckedChange={setShowName} />
            </div>

            <div className="flex items-center justify-between">
              <Label>{t("dropi.showBadge")}</Label>
              <Switch checked={showBadge} onCheckedChange={setShowBadge} />
            </div>

            {showBadge && (
              <div className="flex flex-wrap gap-2">
                {BADGES.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBadge(b)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                      badge === b
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {t("dropi.adFormatsDesc")}
            </p>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={loading || !product.image_main}
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
