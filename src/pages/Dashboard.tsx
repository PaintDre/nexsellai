import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, Zap, Plus, ArrowRight, ImageIcon, Rocket, Video, Mic2,
  Coins, HelpCircle,
} from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useTranslation } from "react-i18next";
import ProductTour from "@/components/ProductTour";

type Product = Tables<"products">;

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greeting.morning");
    if (h < 19) return t("dashboard.greeting.afternoon");
    return t("dashboard.greeting.evening");
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) console.error("Error loading products:", error);
        setProducts(data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const { balance, allowance } = useCredits();
  const creditsPercent = allowance > 0 ? Math.min(100, (balance / allowance) * 100) : 0;
  const isNewUser = products.length === 0;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-in p-5 md:p-10 lg:p-12 space-y-10 max-w-5xl mx-auto">
      {/* Hero — Apple-style minimal */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide font-semibold">
            {profile?.plan || "free"}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
            <Coins className="h-3 w-3" /> {balance}/{allowance}
          </Badge>
        </div>
        <h1 className="text-3xl md:text-5xl font-semibold font-display tracking-tight leading-[1.05]">
          {getGreeting()},<br />
          <span className="text-muted-foreground/80">
            {profile?.full_name?.split(" ")[0] || t("common.user")}.
          </span>
        </h1>
        <p className="text-base text-muted-foreground max-w-xl">
          {t("dashboard.productCount", { count: products.length })}
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild size="lg" className="rounded-full shadow-sm">
            <Link to="/products/new"><Plus className="h-4 w-4 mr-1.5" /> {t("dashboard.quickActions.newProduct")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full">
            <Link to="/products"><Package className="h-4 w-4 mr-1.5" /> {t("sidebar.products")}</Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => setTourOpen(true)}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="h-4 w-4 mr-1.5" /> {t("tour.replay")}
          </Button>
        </div>
      </section>

      <ProductTour forceOpen={tourOpen} onClose={() => setTourOpen(false)} />

      {/* Productivo */}
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold px-1">
          Productivo
        </h2>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          <QuickActionCard
            to="/products/new"
            icon={Plus}
            title={t("dashboard.quickActions.newProduct")}
            description={t("dashboard.quickActions.newProductDesc")}
            variant="primary"
          />
          <QuickActionCard
            to="/products"
            icon={Package}
            title={t("sidebar.products")}
            description={`${products.length} ${products.length === 1 ? "producto" : "productos"}`}
          />
        </div>
      </section>

      {/* Laboratorio (DEMO) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold">
            Laboratorio
          </h2>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Demo · en desarrollo
          </span>
        </div>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard to="/banners" icon={ImageIcon} title={t("sidebar.banners")} description="Banners IA" demo />
          <QuickActionCard to="/videos" icon={Video} title={t("sidebar.videos")} description="Video del producto" demo />
          <QuickActionCard to="/influencers" icon={Mic2} title={t("sidebar.influencers")} description="Lipsync con avatar" demo />
          <QuickActionCard to="/launcher" icon={Rocket} title="Lanzador" description="Campaña end-to-end" demo />
          <QuickActionCard to="/dropi" icon={Package} title="Dropi" description="Catálogo de productos" demo />
        </div>
      </section>

      {/* Onboarding guide for new users */}
      {isNewUser && (
        <Card className="border-primary/15 bg-accent/30 rounded-2xl">
          <CardContent className="p-6">
            <h2 className="text-base font-semibold font-display mb-2">Crea tu primer producto</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sube nombre, precio e imagen para empezar a usar Nexsell.
            </p>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/products/new"><Plus className="h-3.5 w-3.5 mr-1.5" /> {t("dashboard.quickActions.newProduct")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{t("credits.title", "Créditos")}</span>
              <Coins className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-xl sm:text-2xl font-semibold font-display tabular-nums">
              {balance}<span className="text-xs sm:text-sm text-muted-foreground font-normal ml-0.5">/{allowance}</span>
            </div>
            <Progress value={creditsPercent} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{t("dashboard.stats.products")}</span>
              <Package className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <div className="text-xl sm:text-2xl font-semibold font-display">{products.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{t("dashboard.stats.plan")}</span>
              <Zap className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <div className="text-xl sm:text-2xl font-semibold font-display capitalize">{profile?.plan || "free"}</div>
            {profile?.plan === "free" && (
              <Button variant="link" asChild className="px-0 text-primary text-xs h-auto p-0 mt-1">
                <Link to="/pricing">{t("dashboard.stats.upgrade")}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent products */}
      {products.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold">
              {t("sidebar.products")} · recientes
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-xs h-8 rounded-full">
              <Link to="/products">{t("dashboard.viewAll")} <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid gap-2">
            {products.slice(0, 5).map((p) => (
              <Link key={p.id} to={`/products/${p.id}`} className="block">
                <Card className="lift-on-hover rounded-xl">
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <Package className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{p.category}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const QuickActionCard = ({ to, icon: Icon, title, description, variant, demo }: {
  to: string; icon: React.ComponentType<{ className?: string }>; title: string; description: string;
  variant?: "primary"; demo?: boolean;
}) => (
  <Link to={to} className="group block press-on-active">
    <Card className={`lift-on-hover rounded-2xl ${variant === "primary" ? "border-primary/20 bg-accent/30" : ""}`}>
      <CardContent className="flex items-center gap-3.5 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-colors ${variant === "primary" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          <Icon className="h-4 w-4 icon-pop" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">{title}</p>
            {demo && (
              <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground/80 border border-border/60 shrink-0">
                Demo
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </CardContent>
    </Card>
  </Link>
);

const DashboardSkeleton = () => (
  <div className="p-5 md:p-10 lg:p-12 space-y-10 max-w-5xl mx-auto">
    <div className="space-y-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-14 w-80 max-w-full" />
      <Skeleton className="h-4 w-40" />
    </div>
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
    </div>
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
  </div>
);

export default Dashboard;
