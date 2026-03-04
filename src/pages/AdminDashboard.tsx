import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, TrendingUp, Settings, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Stats {
  totalUsers: number;
  totalLandings: number;
  byPlan: { free: number; starter: number; pro: number };
  topUsers: { user_id: string; full_name: string | null; landings_used: number; plan: string }[];
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const res = await supabase.functions.invoke("admin-api", {
        method: "GET",
        body: null,
        headers: { "x-action": "stats" },
      });

      // Use custom fetch since functions.invoke doesn't support path routing easily
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/stats`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (response.ok) {
        setStats(await response.json());
      }
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
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">Estadísticas y gestión de la plataforma</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link to="/admin/users"><Users className="h-4 w-4 mr-2" /> Usuarios</Link>
          </Button>
          {isSuperAdmin() && (
            <Button asChild>
              <Link to="/admin/config"><Settings className="h-4 w-4 mr-2" /> Configuración</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsers ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Landings Generadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalLandings ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distribución por Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm">
              <span>Free: <strong>{stats?.byPlan.free ?? 0}</strong></span>
              <span>Starter: <strong>{stats?.byPlan.starter ?? 0}</strong></span>
              <span>Pro: <strong>{stats?.byPlan.pro ?? 0}</strong></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats?.topUsers && stats.topUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" /> Usuarios más activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">Nombre</th>
                    <th className="text-left py-2 pr-4">Plan</th>
                    <th className="text-right py-2">Landings</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topUsers.map((u) => (
                    <tr key={u.user_id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{u.full_name || "Sin nombre"}</td>
                      <td className="py-2 pr-4 capitalize">{u.plan}</td>
                      <td className="py-2 text-right font-medium">{u.landings_used}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
