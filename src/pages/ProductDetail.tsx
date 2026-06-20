import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, ImageIcon, Package, ChevronRight } from "lucide-react";
import { formatProductPrice } from "@/lib/countries";
import { useTranslation } from "react-i18next";

type Product = Tables<"products">;

const ProductDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [bannerCount, setBannerCount] = useState(0);

  useEffect(() => {
    if (!user || !id) return;

    supabase.from("products").select("*").eq("id", id).eq("user_id", user.id).single()
      .then(({ data, error }) => {
        if (error || !data) { navigate("/products"); return; }
        setProduct(data);
      });

    supabase.from("banners").select("*", { count: "exact", head: true }).eq("product_id", id).eq("user_id", user.id)
      .then(({ count }) => setBannerCount(count || 0));
  }, [id, user]);

  if (!product) return null;

  return (
    <div className="page-in p-5 md:p-8 lg:p-10 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/products" className="hover:text-primary transition-colors">{t("products.title")}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      {/* Product Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-44 aspect-square rounded-xl overflow-hidden border border-border/60 bg-muted/60 shrink-0 lift-on-hover">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" loading="eager" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground/20" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold font-display">{product.name}</h1>
              <p className="text-base text-muted-foreground">{formatProductPrice(product.price, profile?.country_code)}</p>
            </div>
            <Badge variant="secondary" className="capitalize text-[10px] shrink-0">{product.category}</Badge>
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {t("products.audience")}: {product.target_audience}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button size="lg" variant="secondary" asChild className="h-auto py-3.5 flex-col gap-0.5 press-on-active relative">
          <Link to={`/products/${id}/banner`}>
            <span className="absolute top-2 right-2 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground/80 border border-border/60">
              Demo
            </span>
            <ImageIcon className="h-4 w-4" />
            <span className="font-semibold text-sm">{t("products.generateBanners")}</span>
            <span className="text-[10px] opacity-70">{t("products.generateBannersDesc")}</span>
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild className="h-auto py-3.5 flex-col gap-0.5 press-on-active">
          <Link to={`/products/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            <span className="font-semibold text-sm">{t("products.editProductAction")}</span>
            <span className="text-[10px] opacity-70">{t("products.editProductDesc")}</span>
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="lift-on-hover">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold font-display tabular-nums">{bannerCount}</p>
              <p className="text-[11px] text-muted-foreground">{t("products.bannersGenerated")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetail;
