import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, FileText, Plus, Zap, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Product = Tables<"products">;
type Landing = Tables<"landings">;

const planLimits: Record<string, number> = { free: 1, starter: 10, pro: 100 };

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [landings, setLandings] = useState<Landing[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("products").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setProducts(data || []));
    supabase.from("landings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setLandings(data || []));
  }, [user]);

  const limit = planLimits[profile?.plan || "free"];
  const used = profile?.landings_used || 0;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Bienvenido de vuelta, {profile?.full_name || "usuario"}</p>
        </div>
        <Button asChild>
          <Link to="/products/new">
            <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Landings Usadas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">
              {used} <span className="text-lg text-muted-foreground font-normal">/ {limit}</span>
            </div>
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
              <Button variant="link" asChild className="px-0 text-primary">
                <Link to="/pricing">Actualizar plan →</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Landings */}
      <div>
        <h2 className="text-xl font-semibold font-display mb-4">Landings Recientes</h2>
        {landings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No tienes landings aún</p>
              <p className="text-sm text-muted-foreground">Ve a Productos para crear tu primera landing</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {landings.slice(0, 10).map((landing) => (
              <Card key={landing.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{landing.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(landing.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="capitalize text-xs">{landing.theme}</Badge>
                    <Button variant="outline" size="sm" asChild>
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
    </div>
  );
};

export default Dashboard;
