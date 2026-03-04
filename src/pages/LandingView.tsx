import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Loader2, FileArchive, FileCode, Maximize2 } from "lucide-react";
import { exportLandingAsHTML, exportLandingAsZip } from "@/lib/exportLanding";
import LandingRenderer from "@/components/landing/LandingRenderer";
import { themes, type LandingTheme } from "@/components/landing/themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Landing = Tables<"landings">;
type Product = Tables<"products">;

const LandingView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [landing, setLanding] = useState<Landing | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [theme, setTheme] = useState<LandingTheme>("clean");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [allImageUrls, setAllImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      setLoading(true);
      const { data: l, error: le } = await supabase
        .from("landings").select("*").eq("id", id).eq("user_id", user.id).single();
      if (le || !l) { setError("No se encontró la landing."); setLoading(false); return; }
      setLanding(l);
      setTheme(((l as any).theme || "clean") as LandingTheme);
      const { data: p } = await supabase
        .from("products").select("*").eq("id", l.product_id).single();
      setProduct(p);

      // Get all product images
      if (p && p.images && p.images.length > 0) {
        const urls: string[] = [];
        for (const imgPath of p.images) {
          if (imgPath.startsWith("http")) {
            urls.push(imgPath);
          } else {
            const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(imgPath);
            if (urlData?.publicUrl) urls.push(urlData.publicUrl);
          }
        }
        setAllImageUrls(urls);
        if (urls.length > 0) setProductImage(urls[0]);
      }

      setLoading(false);
    };
    load();
  }, [id, user]);

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

  const handleExportHTML = async () => {
    if (!landing) return;
    setExporting(true);
    try {
      const blob = exportLandingAsHTML(
        landing.blocks as any[], product, landing.name, theme, productImage
      );
      downloadBlob(blob, `${landing.name.replace(/\s+/g, "-").toLowerCase()}.html`);
      toast({ title: "HTML exportado correctamente" });
    } catch {
      toast({ title: "Error al exportar", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleExportZip = async () => {
    if (!landing) return;
    setExporting(true);
    try {
      const blob = await exportLandingAsZip(
        landing.blocks as any[], product, landing.name, theme, allImageUrls
      );
      downloadBlob(blob, `${landing.name.replace(/\s+/g, "-").toLowerCase()}.zip`);
      toast({ title: "ZIP exportado con imágenes" });
    } catch {
      toast({ title: "Error al exportar ZIP", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !landing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || "Landing no encontrada"}</p>
        <Button variant="outline" asChild>
          <Link to="/landings"><ArrowLeft className="h-4 w-4 mr-2" /> Volver a mis landings</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-muted/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-12 px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/landings"><ArrowLeft className="h-4 w-4 mr-2" /> Mis landings</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Select value={theme} onValueChange={(v) => setTheme(v as LandingTheme)}>
              <SelectTrigger className="h-8 w-[140px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(themes).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="text-xs hidden sm:inline-flex">{landing.name}</Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={exporting}>
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportHTML}>
                  <FileCode className="h-4 w-4 mr-2" />
                  Solo HTML
                  <span className="text-xs text-muted-foreground ml-2">(imágenes URL)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportZip}>
                  <FileArchive className="h-4 w-4 mr-2" />
                  ZIP con imágenes
                  <span className="text-xs text-muted-foreground ml-2">(HTML + archivos)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <LandingRenderer
        blocks={landing.blocks as any[]}
        product={product ? { name: product.name, price: product.price } : null}
        imagePreview={productImage}
        theme={theme}
      />
    </div>
  );
};

export default LandingView;
