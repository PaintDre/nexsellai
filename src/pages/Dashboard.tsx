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
import { computeBannersUsed } from "@/lib/planUsage";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { UpgradeWarningBanner } from "@/components/UpgradeWarningBanner";
import { useTranslation } from "react-i18next";

type Product = Tables<"products">;
type Landing = Tables<"landings">;

interface RecentVersion {
  id: string;
  created_at: string;
  version_number: number;
  landing_name: string;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [landings, setLandings] = useState<Landing[]>([]);
  const [versionsCount, setVersionsCount] = useState(0);
  const [recentVersions, setRecentVersions] = useState<RecentVersion[]>([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard.greeting.morning");
    if (h < 19) return t("dashboard.greeting.afternoon");
    return t("dashboard.greeting.evening");
  };

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
          landing_name: nameMap.get(v.landing_id) || t("dashboard.deletedLanding"),
        })));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const { landing: landingLimits, banner: bannerLimits } = usePlanLimits();
  const limit = landingLimits[profile?.plan || "free"];
  const used = profile?.landings_used || 0;
  const usagePercent = Math.min((used / limit) * 100, 100);
  const bannerLimit = bannerLimits[profile?.plan || "free"];
  const bannersUsed = computeBannersUsed(profile);
  const bannerUsagePercent = Math.min((bannersUsed / bannerLimit) * 100, 100);
  const isNewUser = products.length === 0;
  const hasNoLandings = products.length > 0 && landings.length === 0;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-8 lg:p-10 space-y-6 md:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold font-display">
          {getGreeting()}, {profile?.full_name?.split(" ")[0] || t("common.user")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.productCount", { count: products.length })} · {t("dashboard.landingCount", { count: landings.length })}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <QuickActionCard
          to="/products/new"
          icon={Plus}
          title={t("dashboard.quickActions.newProduct")}
          description={t("dashboard.quickActions.newProductDesc")}
          variant="primary"
        />
        <QuickActionCard
          to="/landings"
          icon={FileText}
          title={t("dashboard.quickActions.myLandings")}
          description={t("dashboard.quickActions.landingsCount", { count: landings.length })}
        />
        <QuickActionCard
          to="/banners"
          icon={ImageIcon}
          title={t("dashboard.quickActions.myBanners")}
          description={t("dashboard.quickActions.bannersDesc")}
        />
      </div>

      {/* Onboarding guide for new users */}
      {isNewUser && (
        <Card className="border-primary/15 bg-accent/30">
          <CardContent className="p-6">
            <h2 className="text-base font-semibold font-display mb-4">{t("dashboard.onboarding.title")}</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { step: 1, title: t("dashboard.onboarding.step1Title"), desc: t("dashboard.onboarding.step1Desc"), icon: Package, active: true },
                { step: 2, title: t("dashboard.onboarding.step2Title"), desc: t("dashboard.onboarding.step2Desc"), icon: Sparkles, active: false },
                { step: 3, title: t("dashboard.onboarding.step3Title"), desc: t("dashboard.onboarding.step3Desc"), icon: Download, active: false },
              ].map(s => (
                <div key={s.step} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${s.active ? "bg-primary/8" : "bg-muted/40"}`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {s.step}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild size="sm" className="mt-4">
              <Link to="/products/new"><Plus className="h-3.5 w-3.5 mr-1.5" /> {t("dashboard.onboarding.createFirst")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasNoLandings && (
        <Card className="border-primary/15 bg-accent/30">
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-5">
            <Sparkles className="h-7 w-7 text-primary shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-sm">{t("dashboard.noLandings.title")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.noLandings.description")}</p>
            </div>
            <Button asChild size="sm">
              <Link to="/products">{t("dashboard.noLandings.viewProducts")} <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upgrade warnings */}
      <UpgradeWarningBanner resource="landings" used={used} limit={limit} />
      <UpgradeWarningBanner resource="banners" used={bannersUsed} limit={bannerLimit} />

      {/* Usage Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{t("dashboard.stats.landings")}</span>
              <FileText className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display">
              {used}<span className="text-xs sm:text-sm text-muted-foreground font-normal ml-0.5">/{limit}</span>
            </div>
            <Progress value={usagePercent} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{t("dashboard.stats.banners")}</span>
              <Image className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display">
              {bannersUsed}<span className="text-xs sm:text-sm text-muted-foreground font-normal ml-0.5">/{bannerLimit}</span>
            </div>
            <Progress value={bannerUsagePercent} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{t("dashboard.stats.products")}</span>
              <Package className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{t("dashboard.stats.plan")}</span>
              <Zap className="h-3.5 w-3.5 text-muted-foreground/60" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-display capitalize">{profile?.plan || "free"}</div>
            {profile?.plan === "free" && (
              <Button variant="link" asChild className="px-0 text-primary text-xs h-auto p-0 mt-1">
                <Link to="/pricing">{t("dashboard.stats.upgrade")}</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Landings + Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold font-display">{t("dashboard.recentLandings")}</h2>
            {landings.length > 0 && (
              <Button variant="ghost" size="sm" asChild className="text-xs h-8">
                <Link to="/landings">{t("dashboard.viewAll")} <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            )}
          </div>
          {landings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">{t("dashboard.noLandingsYet")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("dashboard.noLandingsHint")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {landings.slice(0, 8).map((landing) => (
                <Card key={landing.id} className="hover:shadow-md transition-all duration-200">
                  <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent shrink-0">
                        <FileText className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm truncate">{landing.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(landing.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Badge variant={landing.published ? "default" : "secondary"} className="text-[10px]">
                        {landing.published ? t("dashboard.published") : t("dashboard.draft")}
                      </Badge>
                      <Badge variant="outline" className="capitalize text-[10px]">{landing.theme}</Badge>
                      <Button variant="outline" size="sm" asChild className="h-8 min-h-[44px] sm:min-h-0 text-xs">
                        <Link to={`/landings/${landing.id}/preview`}>
                          <Eye className="h-3 w-3 mr-1" /> {t("common.view")}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {recentVersions.length > 0 && (
          <div>
            <h2 className="text-base font-semibold font-display mb-3">{t("dashboard.activity")}</h2>
            <div className="space-y-2">
              {recentVersions.map((v) => (
                <Card key={v.id}>
                  <CardContent className="flex items-center gap-3 p-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted shrink-0">
                      <History className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{v.landing_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        v{v.version_number} · {new Date(v.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
  to: string; icon: React.ComponentType<{ className?: string }>; title: string; description: string; variant?: "primary";
}) => (
  <Link to={to} className="group block">
    <Card className={`transition-all duration-200 group-hover:shadow-md ${variant === "primary" ? "border-primary/20 bg-accent/20" : ""}`}>
      <CardContent className="flex items-center gap-3.5 p-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors ${variant === "primary" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm group-hover:text-primary transition-colors">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </CardContent>
    </Card>
  </Link>
);

/* Skeleton */
const DashboardSkeleton = () => (
  <div className="p-5 md:p-8 lg:p-10 space-y-8 max-w-6xl mx-auto">
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-40" />
    </div>
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
    </div>
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
    </div>
    <div className="space-y-2">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
    </div>
  </div>
);

export default Dashboard;
