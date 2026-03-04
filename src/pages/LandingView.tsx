import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { generateLandingHTML } from "@/lib/exportLanding";
import LandingRenderer from "@/components/landing/LandingRenderer";
import { themes, type LandingTheme } from "@/components/landing/themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  useEffect(() => {
    if (!user || !id) return;
    const load = async () => {
      setLoading(true);
      const { data: l, error: le } = await supabase
        .from("landings").select("*").eq("id", id).eq("user_id", user.id).single();
      if (le || !l) { setError("No se encontró la landing."); setLoading(false); return; }
      setLanding(l);
      const { data: p } = await supabase
        .from("products").select("*").eq("id", l.product_id).single();
      setProduct(p);

      // Get first product image if available
      if (p && p.images && p.images.length > 0) {
        const imgPath = p.images[0];
        if (imgPath.startsWith("http")) {
          setProductImage(imgPath);
        } else {
          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(imgPath);
          if (urlData?.publicUrl) setProductImage(urlData.publicUrl);
        }
      }

      setLoading(false);
    };
    load();
  }, [id, user]);

  const handleExport = async () => {
    if (!landing) return;
    setExporting(true);
    try {
      const html = generateLandingHTML(landing.blocks as any[], product, landing.name, theme);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${landing.name.replace(/\s+/g, "-").toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Landing exportada correctamente" });
    } catch {
      toast({ title: "Error al exportar", variant: "destructive" });
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
            <Badge variant="secondary" className="text-xs">{landing.name}</Badge>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
              Exportar HTML
            </Button>
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
