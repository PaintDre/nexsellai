import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Sparkles, ImageIcon, FileText, Eye, Package, ChevronRight, Home, ArrowRight } from "lucide-react";
import { Link as BreadcrumbLink } from "react-router-dom";

type Product = Tables<"products">;
type Landing = Tables<"landings">;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [landings, setLandings] = useState<Landing[]>([]);
  const [bannerCount, setBannerCount] = useState(0);

  useEffect(() => {
    if (!user || !id) return;

    supabase.from("products").select("*").eq("id", id).eq("user_id", user.id).single()
      .then(({ data, error }) => {
        if (error || !data) { navigate("/products"); return; }
        setProduct(data);
      });

    supabase.from("landings").select("*").eq("product_id", id).eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setLandings(data || []));

    supabase.from("banners").select("*", { count: "exact", head: true }).eq("product_id", id).eq("user_id", user.id)
      .then(({ count }) => setBannerCount(count || 0));
  }, [id, user]);

  if (!product) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <BreadcrumbLink to="/products" className="hover:text-foreground transition-colors">Productos</BreadcrumbLink>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      {/* Product Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-48 aspect-square rounded-lg overflow-hidden border bg-muted shrink-0">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-display tracking-tight">{product.name}</h1>
              <p className="text-lg text-muted-foreground">${product.price.toLocaleString("es-CL")}</p>
            </div>
            <Badge variant="secondary" className="capitalize text-xs shrink-0">{product.category}</Badge>
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Audiencia: {product.target_audience}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button size="lg" asChild className="h-auto py-4 flex-col gap-1">
          <Link to={`/products/${id}/generate`}>
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">Generar Landing</span>
            <span className="text-xs opacity-70">Crea una página de venta</span>
          </Link>
        </Button>
        <Button size="lg" variant="secondary" asChild className="h-auto py-4 flex-col gap-1">
          <Link to={`/products/${id}/banner`}>
            <ImageIcon className="h-5 w-5" />
            <span className="font-semibold">Generar Banners</span>
            <span className="text-xs opacity-70">Crea banners para ads</span>
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild className="h-auto py-4 flex-col gap-1">
          <Link to={`/products/${id}/edit`}>
            <Pencil className="h-5 w-5" />
            <span className="font-semibold">Editar Producto</span>
            <span className="text-xs opacity-70">Modifica los datos</span>
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold font-display">{landings.length}</p>
              <p className="text-xs text-muted-foreground">Landings generadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold font-display">{bannerCount}</p>
              <p className="text-xs text-muted-foreground">Banners generados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA when no landings */}
      {landings.length === 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-6">
            <Sparkles className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold">¡Genera tu primera landing!</h3>
              <p className="text-sm text-muted-foreground">La IA creará una página de venta profesional para este producto.</p>
            </div>
            <Button asChild>
              <Link to={`/products/${id}/generate`}>Generar ahora <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Landings List */}
      {landings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold font-display mb-3">Landings de este producto</h2>
          <div className="space-y-3">
            {landings.map((landing) => (
              <Card key={landing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{landing.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(landing.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="capitalize text-xs">{landing.theme}</Badge>
                    <Button variant="outline" size="sm" asChild className="min-h-[44px] sm:min-h-0">
                      <Link to={`/landings/${landing.id}/preview`}>
                        <Eye className="h-3 w-3 mr-1" /> Ver
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
