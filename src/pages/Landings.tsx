import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateLandingHTML } from "@/lib/exportLanding";

type Landing = Tables<"landings">;

const Landings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [landings, setLandings] = useState<Landing[]>([]);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (landing: Landing) => {
    setExportingId(landing.id);
    try {
      const { data: product } = await supabase.from("products").select("*").eq("id", landing.product_id).single();
      const html = generateLandingHTML(landing.blocks as any[], product, landing.name, "clean");
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${landing.name.replace(/\s+/g, "-").toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Landing exportada correctamente" });
    } catch {
      toast({ title: "Error al exportar", variant: "destructive" });
    } finally {
      setExportingId(null);
    }
  };

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
                    <Link to={`/landings/${landing.id}`}><Eye className="h-3 w-3 mr-1" /> Ver</Link>
                  </Button>
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => handleExport(landing)} disabled={exportingId === landing.id}>
                    {exportingId === landing.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />} Exportar
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
