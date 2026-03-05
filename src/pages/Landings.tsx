import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Download, Loader2, Maximize2, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateLandingHTML } from "@/lib/exportLanding";
import { type LandingTheme } from "@/components/landing/themes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Landing = Tables<"landings">;
type Product = Tables<"products">;

interface LandingWithProduct extends Landing {
  product?: Product | null;
}

const Landings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [landings, setLandings] = useState<LandingWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleExport = async (landing: LandingWithProduct) => {
    setExportingId(landing.id);
    try {
      const product = landing.product;
      const theme = ((landing as any).theme || "clean") as LandingTheme;
      const html = generateLandingHTML(landing.blocks as any[], product ? { name: product.name, price: product.price } : null, landing.name, theme);
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
      setExportingId(null);
    }
  };

  const handleDelete = useCallback(async (landingId: string) => {
    if (!user) return;
    setDeletingId(landingId);
    try {
      const { error } = await supabase
        .from("landings")
        .delete()
        .eq("id", landingId)
        .eq("user_id", user.id);
      if (error) throw error;
      setLandings(prev => prev.filter(l => l.id !== landingId));
      toast({ title: "Landing eliminada" });
    } catch (err: any) {
      toast({ title: "Error al eliminar", description: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }, [user, toast]);

  const handleDuplicate = useCallback(async (landing: LandingWithProduct) => {
    if (!user) return;
    try {
      const { error: insertError } = await supabase
        .from("landings")
        .insert({
          user_id: user.id,
          product_id: landing.product_id,
          name: `${landing.name} (copia)`,
          blocks: landing.blocks,
          mode: landing.mode,
          intensity: landing.intensity,
          theme: (landing as any).theme || "clean",
          has_offer: landing.has_offer,
          guarantee: landing.guarantee,
        });
      if (insertError) throw insertError;
      toast({ title: "Landing duplicada" });
      const { data: landingsData } = await supabase
        .from("landings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (landingsData) {
        const productIds = [...new Set(landingsData.map(l => l.product_id))];
        const { data: products } = await supabase.from("products").select("*").in("id", productIds);
        const productMap = new Map((products || []).map(p => [p.id, p]));
        setLandings(landingsData.map(l => ({ ...l, product: productMap.get(l.product_id) || null })));
      }
    } catch (err: any) {
      toast({ title: "Error al duplicar", description: err.message, variant: "destructive" });
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data: landingsData } = await supabase
        .from("landings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!landingsData) { setLandings([]); setLoading(false); return; }

      const productIds = [...new Set(landingsData.map(l => l.product_id))];
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      const productMap = new Map((products || []).map(p => [p.id, p]));
      const enriched: LandingWithProduct[] = landingsData.map(l => ({
        ...l,
        product: productMap.get(l.product_id) || null,
      }));

      setLandings(enriched);
      setLoading(false);
    };
    load();
  }, [user]);

  const getHeroBlock = (blocks: any) => {
    if (!Array.isArray(blocks)) return null;
    return (blocks as any[]).find((b: any) => b.type === "hero");
  };

  const getProductImage = useCallback((product?: Product | null): string | null => {
    if (!product || !product.images || product.images.length === 0) return null;
    const img = product.images[0];
    if (img.startsWith("http")) return img;
    const { data } = supabase.storage.from("product-images").getPublicUrl(img);
    return data?.publicUrl || null;
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold font-display tracking-tight">Mis Landings</h1>

      {landings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No tienes landings generadas aún</p>
            <Button asChild><Link to="/products">Ver productos para generar</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {landings.map((landing) => {
            const hero = getHeroBlock(landing.blocks);
            const image = getProductImage(landing.product);
            const theme = (landing as any).theme || "clean";

            return (
              <Card key={landing.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <Link to={`/landings/${landing.id}/preview`} className="block">
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50">
                    {image && (
                      <img
                        src={image}
                        alt={landing.name}
                        className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent p-5 flex flex-col justify-end">
                      <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                        {landing.product?.name || "Producto"}
                      </p>
                      <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2">
                        {hero?.title || landing.name}
                      </h3>
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-background/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                        <Maximize2 className="h-3.5 w-3.5 text-foreground" />
                      </div>
                    </div>
                  </div>
                </Link>

                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm truncate">{landing.name}</h3>
                    <div className="flex gap-1 shrink-0">
                      <Badge variant="secondary" className="capitalize text-[10px] px-1.5">{theme}</Badge>
                      <Badge variant="outline" className="capitalize text-[10px] px-1.5">{landing.intensity}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(landing.created_at).toLocaleDateString("es-CL")}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1 text-xs">
                        <Link to={`/landings/${landing.id}`}><Eye className="h-3 w-3 mr-1" /> Editor</Link>
                      </Button>
                      <Button variant="default" size="sm" asChild className="flex-1 text-xs">
                        <Link to={`/landings/${landing.id}/preview`}><Maximize2 className="h-3 w-3 mr-1" /> Preview</Link>
                      </Button>
                      <Button variant="secondary" size="sm" className="text-xs" onClick={() => handleDuplicate(landing)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="secondary" size="sm" className="text-xs" onClick={() => handleExport(landing)} disabled={exportingId === landing.id}>
                        {exportingId === landing.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="text-xs" disabled={deletingId === landing.id}>
                            {deletingId === landing.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar landing?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminarán también las versiones guardadas de "{landing.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(landing.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Landings;
