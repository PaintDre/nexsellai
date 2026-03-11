import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard } from "lucide-react";

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  payment_id: string | null;
  created_at: string;
  full_name: string | null;
  email: string | null;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20",
  expired: "bg-amber-500/15 text-amber-600 border-amber-500/20",
  cancelled: "bg-destructive/15 text-destructive border-destructive/20",
};

const AdminSubscriptions = () => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api/subscriptions`;
      const res = await globalThis.fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (res.ok) setSubs(await res.json());
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-10 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold font-display text-foreground">Suscripciones</h1>
          <p className="text-sm text-muted-foreground mt-1">Estado de las suscripciones de usuarios</p>
        </div>
        <Button asChild variant="outline" className="min-h-[44px] w-full sm:w-auto">
          <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-2" /> Volver</Link>
        </Button>
      </div>

      {subs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No hay suscripciones registradas</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 px-4">Usuario</th>
                        <th className="text-left py-3 px-4">Plan</th>
                        <th className="text-left py-3 px-4">Estado</th>
                        <th className="text-left py-3 px-4">Inicio</th>
                        <th className="text-left py-3 px-4">Expiración</th>
                        <th className="text-left py-3 px-4">Payment ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs.map((s) => (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 px-4">
                            <p className="font-medium">{s.full_name || "Sin nombre"}</p>
                            <p className="text-xs text-muted-foreground">{s.email || "—"}</p>
                          </td>
                          <td className="py-3 px-4 capitalize font-medium">{s.plan_id}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={statusColors[s.status] || ""}>{s.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{new Date(s.started_at).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-muted-foreground">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground font-mono">{s.payment_id?.slice(0, 8) || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {subs.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{s.full_name || "Sin nombre"}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.email || "—"}</p>
                    </div>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${statusColors[s.status] || ""}`}>{s.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground/60">Plan</span>
                      <span className="capitalize font-medium text-foreground">{s.plan_id}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground/60">Inicio</span>
                      <span className="text-foreground">{new Date(s.started_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground/60">Expiración</span>
                      <span className="text-foreground">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground/60">Payment</span>
                      <span className="text-foreground font-mono">{s.payment_id?.slice(0, 8) || "—"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminSubscriptions;
