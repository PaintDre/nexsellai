import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Sparkles, ImageIcon, FileText, Eye, Package, ChevronRight, ArrowRight } from "lucide-react";
import { formatProductPrice } from "@/lib/countries";
import { useTranslation } from "react-i18next";

type Product = Tables<"products">;
type Landing = Tables<"landings">;

const ProductDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
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
    <div className="p-5 md:p-8 lg:p-10 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/products" className="hover:text-foreground transition-colors">{t("products.title")}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      {/* Product Header */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-44 aspect-square rounded-xl overflow-hidden border bg-muted shrink-0">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button size="lg" asChild className="h-auto py-3.5 flex-col gap-0.5">
          <Link to={`/products/${id}/generate`}>
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold text-sm">{t("products.generateLanding")}</span>
            <span className="text-[10px] opacity-70">{t("products.generateLandingDesc")}</span>
          </Link>
        </Button>
        <Button size="lg" variant="secondary" asChild className="h-auto py-3.5 flex-col gap-0.5">
          <Link to={`/products/${id}/banner`}>
            <ImageIcon className="h-4 w-4" />
            <span className="font-semibold text-sm">{t("products.generateBanners")}</span>
            <span className="text-[10px] opacity-70">{t("products.generateBannersDesc")}</span>
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild className="h-auto py-3.5 flex-col gap-0.5">
          <Link to={`/products/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            <span className="font-semibold text-sm">{t("products.editProductAction")}</span>
            <span className="text-[10px] opacity-70">{t("products.editProductDesc")}</span>
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xl font-bold font-display">{landings.length}</p>
              <p className="text-[11px] text-muted-foreground">{t("products.landingsGenerated")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ImageIcon className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xl font-bold font-display">{bannerCount}</p>
              <p className="text-[11px] text-muted-foreground">{t("products.bannersGenerated")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA when no landings */}
      {landings.length === 0 && (
        <Card className="border-primary/15 bg-accent/30">
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-5">
            <Sparkles className="h-7 w-7 text-primary shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-sm">{t("products.generateFirst")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("products.generateFirstDesc")}</p>
            </div>
            <Button asChild size="sm">
              <Link to={`/products/${id}/generate`}>{t("products.generateNow")} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Landings List */}
      {landings.length > 0 && (
        <div>
          <h2 className="text-base font-semibold font-display mb-3">{t("products.productLandings")}</h2>
          <div className="space-y-2">
            {landings.map((landing) => (
              <Card key={landing.id} className="hover:shadow-md transition-all duration-200">
                <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">{landing.name}</h3>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(landing.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="capitalize text-[10px]">{landing.theme}</Badge>
                    <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                      <Link to={`/landings/${landing.id}/preview`}>
                        <Eye className="h-3 w-3 mr-1" /> {t("common.view")}
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
