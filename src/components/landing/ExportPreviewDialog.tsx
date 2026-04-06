import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileCode, FileArchive, Loader2, Clipboard, Check, Store, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateLandingHTML, exportLandingAsHTML, exportLandingAsZip, generateShopifyHTML } from "@/lib/exportLanding";
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
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyExporting, setShopifyExporting] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [shopifyCopied, setShopifyCopied] = useState(false);

  // Check if user has a Shopify connection
  useEffect(() => {
    if (!open || !user) return;
    const checkConnection = async () => {
      const { data } = await supabase
        .from("shopify_connections" as any)
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setShopifyConnected(!!data);
    };
    checkConnection();
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

  const handleExportHTML = () => {
    const blob = exportLandingAsHTML(blocks, product, landingName, theme, productImage);
    downloadBlob(blob, `${landingName.replace(/\s+/g, "-").toLowerCase()}.html`);
    toast({ title: t("exportDialog.htmlExported") });
    onOpenChange(false);
  };

  const handleExportZip = async () => {
    setExporting(true);
    try {
      const blob = await exportLandingAsZip(blocks, product, landingName, theme, allImageUrls);
      downloadBlob(blob, `${landingName.replace(/\s+/g, "-").toLowerCase()}.zip`);
      toast({ title: t("exportDialog.zipExported") });
      onOpenChange(false);
    } catch {
      toast({ title: t("exportDialog.zipError"), variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleCopyHTML = async () => {
    await navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    toast({ title: t("exportDialog.htmlCopied") });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyShopify = () => {
    const shopifyHTML = generateShopifyHTML(blocks, product, landingName, theme, productImage, allImageUrls);
    navigator.clipboard.writeText(shopifyHTML);
    setShopifyCopied(true);
    toast({
      title: t("exportDialog.shopifyCopied"),
      description: t("exportDialog.shopifyInstructions"),
    });
    setTimeout(() => setShopifyCopied(false), 2000);
  };

  const handleExportToShopify = async () => {
    if (!shopifyConnected) {
      setShowConnectDialog(true);
      return;
    }
    setShopifyExporting(true);
    try {
      const shopifyHTML = generateShopifyHTML(blocks, product, landingName, theme, productImage, allImageUrls);
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyShopify}
                className="border-[#96bf48]/40 text-[#5e8e22] hover:bg-[#96bf48]/10"
              >
                {shopifyCopied ? <Check className="h-4 w-4 mr-1" /> : <Clipboard className="h-4 w-4 mr-1" />}
                {shopifyCopied ? t("exportDialog.copied") : t("exportDialog.copyShopify")}
              </Button>
            </div>
            {/* Secondary: Standard exports */}
            <div className="flex flex-wrap gap-2 w-full">
              <Button variant="outline" size="sm" onClick={handleCopyHTML}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Clipboard className="h-4 w-4 mr-1" />}
                {copied ? t("exportDialog.copied") : t("exportDialog.copyHTML")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportHTML}>
                <FileCode className="h-4 w-4 mr-1" /> {t("exportDialog.htmlOnly")}
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportZip} disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileArchive className="h-4 w-4 mr-1" />}
                {t("exportDialog.zipWithImages")}
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
