import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Store, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateLandingHTML } from "@/lib/exportLanding";
import { exportShopifyZip, generateShopifyLiquid, generateShopifyProductTemplate } from "@/lib/exportShopify";
import type { LandingTheme } from "@/components/landing/themes";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ShopifyConnectDialog from "@/components/landing/ShopifyConnectDialog";

interface ExportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocks: any[];
  product: { name: string; price: number } | null;
  landingName: string;
  theme: LandingTheme;
  productImage: string | null;
  allImageUrls: string[];
}

const ExportPreviewDialog = ({
  open,
  onOpenChange,
  blocks,
  product,
  landingName,
  theme,
  productImage,
  allImageUrls,
}: ExportPreviewDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [shopifyExporting, setShopifyExporting] = useState(false);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [shopifyUploading, setShopifyUploading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    const check = async () => {
      const { data } = await supabase
        .from("shopify_connections_safe" as any)
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      setShopifyConnected(!!data);
    };
    check();
  }, [open, user]);

  const htmlContent = useMemo(() => {
    if (!open) return "";
    return generateLandingHTML(blocks, product, landingName, theme, productImage);
  }, [open, blocks, product, landingName, theme, productImage]);

  const blobUrl = useMemo(() => {
    if (!htmlContent) return "";
    const blob = new Blob([htmlContent], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [htmlContent]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadShopifySection = async () => {
    setShopifyExporting(true);
    try {
      const blob = await exportShopifyZip(blocks, product, theme, productImage, allImageUrls);
      downloadBlob(blob, `${landingName.replace(/\s+/g, "-").toLowerCase()}-shopify.zip`);
      toast({
        title: t("exportDialog.liquidDownloaded"),
        description: t("exportDialog.liquidInstructions"),
      });
    } catch {
      toast({ title: t("common.error"), variant: "destructive" });
    } finally {
      setShopifyExporting(false);
    }
  };

  const handleExportToShopify = async () => {
    if (!shopifyConnected) {
      setShowConnectDialog(true);
      return;
    }
    setShopifyUploading(true);
    try {
      const liquidContent = generateShopifyLiquid(
        blocks,
        product,
        theme,
        productImage,
        allImageUrls
      );
      const templateContent = generateShopifyProductTemplate();

      const { data, error } = await supabase.functions.invoke("shopify-export", {
        body: {
          action: "export-theme",
          liquidContent,
          templateContent,
        },
      });

      if (error || data?.error) {
        toast({
          title: "Error al exportar",
          description: data?.error || error?.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✅ Landing subida a Shopify",
        description: `Tema: ${data.themeName}. Ahora asigná la plantilla "product.nexsell" a tu producto en Shopify Admin.`,
        duration: 8000,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error al exportar",
        description: err?.message || "Error inesperado",
        variant: "destructive",
      });
    } finally {
      setShopifyUploading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {t("exportDialog.title")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-lg border overflow-hidden bg-background">
            {blobUrl && (
              <iframe
                src={blobUrl}
                className="w-full h-full"
                title="Export Preview"
                sandbox="allow-same-origin"
              />
            )}
          </div>
          <DialogFooter className="flex-col gap-3 sm:flex-col sm:justify-start">
            <div className="w-full rounded-lg border bg-primary/5 p-4 space-y-3">
              <p className="text-sm text-muted-foreground">{t("exportDialog.easyDescription")}</p>
              <Button
                size="lg"
                onClick={handleDownloadShopifySection}
                disabled={shopifyExporting}
                className="w-full"
              >
                {shopifyExporting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                {t("exportDialog.downloadLiquid")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExportPreviewDialog;
