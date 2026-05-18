import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Store, Upload, ExternalLink, Globe, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateLandingHTML } from "@/lib/exportLanding";
import { exportShopifyZip, generateShopifyLiquid, generateShopifyProductTemplate, generateShopifyPageTemplate } from "@/lib/exportShopify";
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
  landingId?: string;
  existingShopifyPageId?: string | null;
  existingShopifyHandle?: string | null;
  onPublished?: (info: { pageId: string; handle: string; pageUrl: string }) => void;
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
  landingId,
  existingShopifyPageId,
  existingShopifyHandle,
  onPublished,
}: ExportPreviewDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [shopifyExporting, setShopifyExporting] = useState(false);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState<string | null>(null);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [shopifyUploading, setShopifyUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const checkConnection = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("shopify_connections")
        .select("id, store_domain, shop_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        console.error("[checkConnection] error:", error);
        return;
      }
      setShopifyConnected(!!data);
      setShopifyDomain(data ? ((data as any).shop_name || (data as any).store_domain) : null);
    } catch (err) {
      console.error("[checkConnection] unexpected error:", err);
    }
  };

  useEffect(() => {
    if (!open || !user) return;
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

  const handlePublishPage = async () => {
    if (!shopifyConnected) {
      setShowConnectDialog(true);
      return;
    }
    if (!landingId) {
      toast({ title: "Falta landingId", variant: "destructive" });
      return;
    }
    setPublishing(true);
    try {
      const liquidContent = generateShopifyLiquid(blocks, product, theme, productImage, allImageUrls);
      const templateContent = generateShopifyPageTemplate(blocks, product, productImage, allImageUrls);

      const { data, error } = await supabase.functions.invoke("shopify-export", {
        body: {
          action: "publish-page",
          landingId,
          pageTitle: landingName,
          handle: existingShopifyHandle || landingName,
          liquidContent,
          templateContent,
          existingPageId: existingShopifyPageId || null,
        },
      });

      if (error || data?.error) {
        toast({
          title: "Error al publicar",
          description: data?.error || error?.message,
          variant: "destructive",
        });
        return;
      }

      setPublishedUrl(data.pageUrl);
      onPublished?.({ pageId: String(data.pageId), handle: data.handle, pageUrl: data.pageUrl });
      toast({
        title: data.isUpdate ? "✅ Página actualizada en Shopify" : "✅ Página publicada en Shopify",
        description: `Live en ${data.pageUrl}`,
        duration: 8000,
      });
    } catch (err: any) {
      toast({
        title: "Error al publicar",
        description: err?.message || "Error inesperado",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const copyUrl = async () => {
    if (!publishedUrl) return;
    await navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <div className="flex items-start gap-2">
                <Globe className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Publicar como página en Shopify</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Crea una página real en tu tienda. Editable desde el Theme Editor.
                    {shopifyDomain && ` Conectado a ${shopifyDomain}.`}
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                variant="default"
                onClick={handlePublishPage}
                disabled={publishing || !landingId}
                className="w-full"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-1" />
                )}
                {existingShopifyPageId ? "Actualizar página en Shopify" : "Publicar página en Shopify"}
              </Button>
              {publishedUrl && (
                <div className="rounded-md border bg-background p-3 flex items-center gap-2">
                  <a
                    href={publishedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate flex-1 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{publishedUrl}</span>
                  </a>
                  <Button size="sm" variant="ghost" onClick={copyUrl} className="h-7 px-2 shrink-0">
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              )}
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs text-muted-foreground">Otras opciones:</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportToShopify}
                  disabled={shopifyUploading}
                  className="w-full"
                >
                  {shopifyUploading ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5 mr-1" />
                  )}
                  Instalar template de producto (product.nexsell)
                </Button>
              <Button
                  size="sm"
                variant="outline"
                onClick={handleDownloadShopifySection}
                disabled={shopifyExporting}
                className="w-full"
              >
                {shopifyExporting ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                    <Download className="h-3.5 w-3.5 mr-1" />
                )}
                {t("exportDialog.downloadLiquid")}
              </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ShopifyConnectDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        onConnected={async () => {
          setShopifyConnected(true);
          setShowConnectDialog(false);
          setTimeout(() => handlePublishPage(), 300);
        }}
      />
    </>
  );
};

export default ExportPreviewDialog;
