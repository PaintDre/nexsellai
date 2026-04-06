import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Store, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateLandingHTML } from "@/lib/exportLanding";
import { exportShopifyZip } from "@/lib/exportShopify";
import type { LandingTheme } from "@/components/landing/themes";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ShopifyConnectDialog from "./ShopifyConnectDialog";

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
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyExporting, setShopifyExporting] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [liquidExporting, setLiquidExporting] = useState(false);

  // Check if user has a Shopify connection
  useEffect(() => {
    if (!open || !user) return;
    const checkConnection = async () => {
      const { data } = await supabase
        .from("shopify_connections")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setShopifyConnected(!!data);
    };
    checkConnection();
  }, [open, user]);

  // Preview HTML (only for iframe, NOT for export)
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

  const handleDownloadLiquid = async () => {
    setLiquidExporting(true);
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
      setLiquidExporting(false);
    }
  };

  const handleExportToShopify = async () => {
    if (!shopifyConnected) {
      setShowConnectDialog(true);
      return;
    }
    setShopifyExporting(true);
    try {
      // For direct Shopify export, we use the edge function which creates a page
      // with normalized image URLs
      const { normalizeImageUrl } = await import("@/lib/exportLanding");
      const heroSrc = normalizeImageUrl(productImage || (allImageUrls.length > 0 ? allImageUrls[0] : "") || "");
      const normalizedBlocks = blocks.map((block: any) => {
        if (!block.image_url) return block;
        return { ...block, image_url: normalizeImageUrl(block.image_url) };
      });
      const fullHTML = generateLandingHTML(normalizedBlocks, product, landingName, theme, heroSrc || null);
      const bodyMatch = fullHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1].trim() : "";

      const shopifyHTML = `<div class="nexsell-landing">
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
.nexsell-landing, .nexsell-landing * { margin: 0; padding: 0; box-sizing: border-box; }
.nexsell-landing { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; line-height: 1.6; }
.nexsell-landing img { max-width: 100%; height: auto; }
</style>
${bodyContent}
</div>`;

      const { data, error } = await supabase.functions.invoke("shopify-export", {
        body: {
          action: "create-page",
          pageTitle: landingName,
          pageHtml: shopifyHTML,
        },
      });
      if (error || data?.error) {
        toast({
          title: t("shopify.exportError"),
          description: data?.error || error?.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("shopify.exportSuccess"),
          description: data?.pageUrl ? `${t("shopify.viewPage")}: ${data.pageUrl}` : undefined,
        });
        onOpenChange(false);
      }
    } catch {
      toast({ title: t("shopify.exportError"), variant: "destructive" });
    } finally {
      setShopifyExporting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t("exportDialog.title")}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 rounded-lg border overflow-hidden bg-white">
            {blobUrl && (
              <iframe
                src={blobUrl}
                className="w-full h-full"
                title="Export Preview"
                sandbox="allow-same-origin"
              />
            )}
          </div>
          <DialogFooter className="flex-col gap-3 sm:flex-col">
            {/* Primary: Export to Shopify */}
            <div className="flex flex-wrap gap-2 w-full">
              <Button
                size="sm"
                onClick={handleExportToShopify}
                disabled={shopifyExporting}
                className="bg-[#96bf48] hover:bg-[#7ea63d] text-white flex-1 sm:flex-none"
              >
                {shopifyExporting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Store className="h-4 w-4 mr-1" />
                )}
                {shopifyConnected
                  ? t("shopify.exportToShopify")
                  : t("shopify.connectAndExport")}
              </Button>
            </div>
            {/* Secondary: Download Liquid Template */}
            <div className="flex flex-wrap gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadLiquid}
                disabled={liquidExporting}
              >
                {liquidExporting ? (
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

      <ShopifyConnectDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        onConnected={() => {
          setShopifyConnected(true);
          setShowConnectDialog(false);
        }}
      />
    </>
  );
};

export default ExportPreviewDialog;
