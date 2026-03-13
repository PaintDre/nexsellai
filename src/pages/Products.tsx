import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Plus, Pencil, Sparkles, ImageIcon } from "lucide-react";
import { formatProductPrice } from "@/lib/countries";
import { useTranslation } from "react-i18next";

type Product = Tables<"products">;

const Products = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setProducts(data || []); setLoading(false); });
  }, [user]);

  return (
    <div className="p-5 md:p-8 lg:p-10 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold font-display">{t("products.title")}</h1>
        <Button asChild size="sm">
          <Link to="/products/new"><Plus className="h-3.5 w-3.5 mr-1.5" /> {t("products.new")}</Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <Skeleton className="aspect-video rounded-t-xl" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">{t("products.empty")}</p>
            <Button asChild size="sm"><Link to="/products/new"><Plus className="h-3.5 w-3.5 mr-1.5" /> {t("products.createProduct")}</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="group overflow-hidden hover:shadow-md transition-all duration-200">
              <Link to={`/products/${product.id}`} className="block">
                <div className="aspect-video overflow-hidden bg-muted">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground/20" /></div>
                  )}
                </div>
              </Link>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  <Badge variant="secondary" className="capitalize text-[10px] shrink-0">{product.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{formatProductPrice(product.price, profile?.country_code)}</p>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="flex-1 h-9 text-xs">
                      <Link to={`/products/${product.id}/edit`}><Pencil className="h-3 w-3 mr-1" /> {t("common.edit")}</Link>
                    </Button>
                    <Button size="sm" asChild className="flex-1 h-9 text-xs">
                      <Link to={`/products/${product.id}/generate`}><Sparkles className="h-3 w-3 mr-1" /> Landing</Link>
                    </Button>
                  </div>
                  <Button variant="secondary" size="sm" asChild className="w-full h-9 text-xs">
                    <Link to={`/products/${product.id}/banner`}><ImageIcon className="h-3 w-3 mr-1" /> {t("products.generateBanners")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;
