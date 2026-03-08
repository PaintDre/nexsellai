import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, FileText, Zap, Eye, History, Plus, Image,
  ArrowRight, Sparkles, Download, ImageIcon,
} from "lucide-react";
import { LANDING_LIMITS, BANNER_LIMITS } from "@/lib/constants";
import { computeBannersUsed } from "@/lib/planUsage";

type Product = Tables<"products">;
type Landing = Tables<"landings">;

interface RecentVersion {
  id: string;
  created_at: string;
  version_number: number;
  landing_name: string;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [landings, setLandings] = useState<Landing[]>([]);
  const [versionsCount, setVersionsCount] = useState(0);
  const [recentVersions, setRecentVersions] = useState<RecentVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [prodRes, landRes, verCountRes] = await Promise.all([
        supabase.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("landings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("landing_versions").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setProducts(prodRes.data || []);
      setLandings(landRes.data || []);
      setVersionsCount(verCountRes.count || 0);

      // Recent versions
      const { data: versions } = await supabase
        .from("landing_versions")
        .select("id, created_at, version_number, landing_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (versions && versions.length > 0) {
        const landingIds = [...new Set(versions.map(v => v.landing_id))];
        const { data: landingsData } = await supabase.from("landings").select("id, name").in("id", landingIds);
        const nameMap = new Map((landingsData || []).map(l => [l.id, l.name]));
        setRecentVersions(versions.map(v => ({
          id: v.id, created_at: v.created_at, version_number: v.version_number,
          landing_name: nameMap.get(v.landing_id) || "Landing eliminada",
        })));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const limit = planLimits[profile?.plan || "free"];
  const used = profile?.landings_used || 0;
  const usagePercent = Math.min((used / limit) * 100, 100);
  const bannerLimit = bannerLimits[profile?.plan || "free"];
  const bannerResetAt = profile?.banners_reset_at ? new Date(profile.banners_reset_at) : null;
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const bannersUsed = (!bannerResetAt || (now.getTime() - bannerResetAt.getTime()) >= thirtyDaysMs) ? 0 : (profile?.banners_used || 0);
  const bannerUsagePercent = Math.min((bannersUsed / bannerLimit) * 100, 100);
  const isNewUser = products.length === 0;
  const hasNoLandings = products.length > 0 && landings.length === 0;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">
          {getGreeting()}, {profile?.full_name?.split(" ")[0] || "usuario"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Tienes {products.length} producto{products.length !== 1 ? "s" : ""} y {landings.length} landing{landings.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <QuickActionCard
          to="/products/new"
          icon={Plus}
          title="Nuevo Producto"
          description="Agrega un producto para generar contenido"
          variant="primary"
        />
        <QuickActionCard
          to="/landings"
          icon={FileText}
          title="Mis Landings"
          description={`${landings.length} landing${landings.length !== 1 ? "s" : ""} generada${landings.length !== 1 ? "s" : ""}`}
        />
        <QuickActionCard
          to="/banners"
          icon={ImageIcon}
          title="Mis Banners"
          description="Banners generados para ads"
        />
      </div>

      {/* Onboarding guide for new users */}
      {isNewUser && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold font-display mb-4">🚀 Comienza en 3 pasos</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { step: 1, title: "Crea un producto", desc: "Agrega nombre, precio e imágenes", icon: Package, active: true },
                { step: 2, title: "Genera una landing", desc: "La IA crea tu página de venta", icon: Sparkles, active: false },
                { step: 3, title: "Exporta y vende", desc: "Descarga o publica tu landing", icon: Download, active: false },
              ].map(s => (
                <div key={s.step} className={`flex items-start gap-3 p-3 rounded-lg ${s.active ? "bg-primary/10" : "bg-muted/50"}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${s.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {s.step}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild className="mt-4">
              <Link to="/products/new"><Plus className="h-4 w-4 mr-2" /> Crear mi primer producto</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasNoLandings && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-6">
            <Sparkles className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold">¡Genera tu primera landing!</h3>
              <p className="text-sm text-muted-foreground">Selecciona un producto y la IA creará una página de venta profesional.</p>
            </div>
            <Button asChild>
              <Link to="/products">Ver productos <ArrowRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Landings Usadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">
              {used} <span className="text-lg text-muted-foreground font-normal">/ {limit}</span>
            </div>
            <Progress value={usagePercent} className="h-2 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Banners Usados</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">
              {bannersUsed} <span className="text-lg text-muted-foreground font-normal">/ {bannerLimit}</span>
            </div>
            <Progress value={bannerUsagePercent} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plan Actual</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display capitalize">{profile?.plan || "free"}</div>
            {profile?.plan === "free" && (
              <Button variant="link" asChild className="px-0 text-primary text-sm">
                <Link to="/pricing">Actualizar plan →</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Landings + Activity in 2-column layout on desktop */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Landings (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold font-display">Landings Recientes</h2>
            {landings.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/landings">Ver todas <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            )}
          </div>
          {landings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">No tienes landings aún</p>
                <p className="text-sm text-muted-foreground">Crea tu primer producto para empezar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {landings.slice(0, 8).map((landing) => (
                <Card key={landing.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{landing.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(landing.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={landing.published ? "default" : "secondary"} className="text-[10px]">
                        {landing.published ? "Publicada" : "Borrador"}
                      </Badge>
                      <Badge variant="outline" className="capitalize text-[10px]">{landing.theme}</Badge>
                      <Button variant="outline" size="sm" asChild className="min-h-[36px]">
                        <Link to={`/landings/${landing.id}/preview`}>
                          <Eye className="h-3 w-3 mr-1" /> Ver
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Activity (1/3 width) */}
        {recentVersions.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold font-display mb-4">Actividad</h2>
            <div className="space-y-2">
              {recentVersions.map((v) => (
                <Card key={v.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted shrink-0">
                      <History className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Versión guardada de {v.landing_name}</p>
                      <p className="text-xs text-muted-foreground">
                        v{v.version_number} · {new Date(v.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* Quick Action Card */
const QuickActionCard = ({ to, icon: Icon, title, description, variant }: {
  to: string; icon: any; title: string; description: string; variant?: "primary";
}) => (
  <Card className={`hover:shadow-md transition-all group cursor-pointer ${variant === "primary" ? "border-primary/30 bg-primary/5" : ""}`}>
    <Link to={to}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${variant === "primary" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm group-hover:text-primary transition-colors">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </CardContent>
    </Link>
  </Card>
);

/* Skeleton */
const DashboardSkeleton = () => (
  <div className="p-4 md:p-6 lg:p-8 space-y-8">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
    </div>
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
    </div>
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {[1, 2].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
    </div>
  </div>
);

export default Dashboard;
