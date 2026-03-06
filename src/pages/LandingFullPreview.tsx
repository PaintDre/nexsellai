import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Download, Loader2, Palette } from "lucide-react";
import { exportLandingAsHTML } from "@/lib/exportLanding";
import LandingRenderer from "@/components/landing/LandingRenderer";
import { themes, type LandingTheme } from "@/components/landing/themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Landing = Tables<"landings">;
type Product = Tables<"products">;

const LandingFullPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [landing, setLanding] = useState<Landing | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [theme, setTheme] = useState<LandingTheme>("clean");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [toolbarVisible, setToolbarVisible] = useState(true);

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

      if (p && p.images && p.images.length > 0) {
        const img = p.images[0];
        if (img.startsWith("http")) {
          setProductImage(img);
        } else {
          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(img);
          if (urlData?.publicUrl) setProductImage(urlData.publicUrl);
        }
      }
      setLoading(false);
    };
    load();
  }, [id, user]);

  const handleExportHTML = async () => {
    if (!landing) return;
    setExporting(true);
    try {
      const blob = exportLandingAsHTML(
        landing.blocks as any[], product, landing.name, theme, productImage
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${landing.name.replace(/\s+/g, "-").toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("HTML exportado correctamente");
    } catch {
      toast.error("Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !landing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">{error || "Landing no encontrada"}</p>
        <Button variant="outline" asChild>
          <Link to="/landings"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Floating toolbar */}
      {toolbarVisible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-background/95 backdrop-blur-md border rounded-full shadow-xl px-4 py-2 flex items-center gap-3 transition-all">
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link to={`/landings/${landing.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="h-5 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={theme} onValueChange={(v) => setTheme(v as LandingTheme)}>
              <SelectTrigger className="h-7 w-[120px] text-xs border-0 bg-muted/50 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(themes).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-5 w-px bg-border" />

          <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={handleExportHTML} disabled={exporting}>
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          </Button>

          <button
            onClick={() => setToolbarVisible(false)}
            className="text-muted-foreground hover:text-foreground text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Show toolbar toggle if hidden */}
      {!toolbarVisible && (
        <button
          onClick={() => setToolbarVisible(true)}
          className="fixed top-4 right-4 z-[60] bg-background/90 backdrop-blur-sm border rounded-full shadow-lg p-2 hover:shadow-xl transition-all"
        >
          <Palette className="h-4 w-4 text-foreground" />
        </button>
      )}

      <LandingRenderer
        blocks={landing.blocks as any[]}
        product={product ? { name: product.name, price: product.price } : null}
        imagePreview={productImage}
        theme={theme}
      />
    </div>
  );
};

export default LandingFullPreview;
