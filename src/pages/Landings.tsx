import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Pencil, Download } from "lucide-react";

type Landing = Tables<"landings">;

const Landings = () => {
  const { user } = useAuth();
  const [landings, setLandings] = useState<Landing[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("landings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setLandings(data || []));
  }, [user]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="text-3xl font-bold font-display tracking-tight">Mis Landings</h1>

      {landings.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">No tienes landings generadas aún</p>
            <Button asChild><Link to="/products">Ver productos para generar</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {landings.map((landing) => (
            <Card key={landing.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{landing.name}</h3>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="capitalize text-xs">{landing.mode}</Badge>
                    <Badge variant="outline" className="capitalize text-xs">{landing.intensity}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(landing.created_at).toLocaleDateString("es-CL")}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1">
                    <Link to={`/landings/${landing.id}/edit`}><Pencil className="h-3 w-3 mr-1" /> Editar</Link>
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1">
                    <Download className="h-3 w-3 mr-1" /> Exportar
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

export default Landings;
