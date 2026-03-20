import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileCode, FileArchive, Loader2, Clipboard, Check, Store } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateLandingHTML, exportLandingAsHTML, exportLandingAsZip, generateShopifyHTML } from "@/lib/exportLanding";
import type { LandingTheme } from "@/components/landing/themes";
import { useTranslation } from "react-i18next";

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
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  return (
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
        <DialogFooter className="flex-wrap gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyHTML}>
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Clipboard className="h-4 w-4 mr-1" />}
            {copied ? t("exportDialog.copied") : t("exportDialog.copyHTML")}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportHTML}>
            <FileCode className="h-4 w-4 mr-1" /> {t("exportDialog.htmlOnly")}
          </Button>
          <Button size="sm" onClick={handleExportZip} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileArchive className="h-4 w-4 mr-1" />}
            {t("exportDialog.zipWithImages")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportPreviewDialog;
