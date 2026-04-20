import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  TrendingUp,
  Settings,
  Crown,
  Image as ImageIcon,
  Banknote,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

interface Stats {
  totalUsers: number;
  totalLandings: number;
  totalBanners: number;
  byPlan: { free: number; starter: number; pro: number };
  topUsers: {
    user_id: string;
    full_name: string | null;
    landings_used: number;
    banners_used: number;
    plan: string;
  }[];
}

const planTone: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-primary/10 text-primary",
  pro: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) => (
  <Card>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="text-3xl font-semibold tracking-tight mt-3">{value}</p>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/stats`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (response.ok) setStats(await response.json());
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-in p-4 md:p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          {t("admin.eyebrow")}
        </div>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-foreground">
              {t("admin.title")}
            </h1>
            <p className="text-muted-foreground text-base mt-1.5 max-w-xl">{t("admin.subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/users">
                <Users className="h-4 w-4" />
                {t("admin.users")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/payments">
                <Banknote className="h-4 w-4" />
                {t("sidebar.payments")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/subscriptions">
                <RefreshCw className="h-4 w-4" />
                {t("sidebar.subscriptions")}
              </Link>
            </Button>
            {isSuperAdmin() && (
              <Button asChild size="sm">
                <Link to="/admin/config">
                  <Settings className="h-4 w-4" />
                  {t("admin.config")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label={t("admin.totalUsers")} value={stats?.totalUsers ?? 0} icon={Users} />
        <StatCard label={t("admin.landingsGenerated")} value={stats?.totalLandings ?? 0} icon={FileText} />
        <StatCard label={t("admin.totalBanners")} value={stats?.totalBanners ?? 0} icon={ImageIcon} />
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                {t("admin.planDistribution")}
              </p>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${planTone.free}`}>
                Free · {stats?.byPlan.free ?? 0}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${planTone.starter}`}>
                Starter · {stats?.byPlan.starter ?? 0}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${planTone.pro}`}>
                Pro · {stats?.byPlan.pro ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top users */}
      {stats?.topUsers && stats.topUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Crown className="h-5 w-5 text-primary" />
              {t("admin.topUsers")}
            </CardTitle>
            <CardDescription>{t("admin.topUsersDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">{t("settings.account.name")}</th>
                    <th className="text-left py-2 pr-4 font-medium">{t("settings.plan.currentPlan")}</th>
                    <th className="text-right py-2 pr-4 font-medium">Landings</th>
                    <th className="text-right py-2 font-medium">Banners</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topUsers.map((u) => (
                    <tr key={u.user_id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{u.full_name || t("admin.noName")}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${planTone[u.plan] || planTone.free}`}
                        >
                          {u.plan}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-4 font-medium tabular-nums">{u.landings_used}</td>
                      <td className="py-3 text-right font-medium tabular-nums">{u.banners_used}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-2.5">
              {stats.topUsers.map((u) => (
                <div key={u.user_id} className="rounded-lg border border-border/60 p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm truncate">{u.full_name || t("admin.noName")}</p>
                    <Badge variant="secondary" className="capitalize text-[10px]">
                      {u.plan}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>
                      Landings: <strong className="text-foreground tabular-nums">{u.landings_used}</strong>
                    </span>
                    <span>
                      Banners: <strong className="text-foreground tabular-nums">{u.banners_used}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
