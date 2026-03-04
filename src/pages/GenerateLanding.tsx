import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Product = Tables<"products">;

const planLimits: Record<string, number> = { free: 1, starter: 10, pro: 999999 };

const GenerateLanding = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [mode, setMode] = useState<string>("aida");
  const [intensity, setIntensity] = useState<string>("medium");
  const [hasOffer, setHasOffer] = useState(false);
  const [guarantee, setGuarantee] = useState("Garantía de satisfacción de 30 días");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("products").select("*").eq("id", id).eq("user_id", user.id).single().then(({ data }) => {
      if (data) setProduct(data);
      else navigate("/products");
    });
  }, [id, user]);

  const limit = planLimits[profile?.plan || "free"];
  const used = profile?.landings_used || 0;
  const canGenerate = used < limit;

  const handleGenerate = async () => {
    if (!user || !product || !profile) return;

    if (!canGenerate) {
      toast({ title: "Límite alcanzado", description: "Actualiza tu plan para generar más landings.", variant: "destructive" });
      return;
    }

    if (!profile.openai_api_key) {
      toast({ title: "Configura tu API Key", description: "Ve a Ajustes y agrega tu API Key de OpenAI.", variant: "destructive" });
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-landing", {
        body: { product, mode, intensity, hasOffer, guarantee, plan: profile.plan },
      });

      if (error) throw error;

      const { error: insertError } = await supabase.from("landings").insert({
        user_id: user.id,
        product_id: product.id,
        name: `${product.name} - ${mode.toUpperCase()}`,
        mode: mode as any,
        intensity: intensity as any,
        has_offer: hasOffer,
        guarantee,
        blocks: data.blocks,
      });

      if (insertError) throw insertError;

      // Increment landings_used
      await supabase.from("profiles").update({ landings_used: used + 1 }).eq("user_id", user.id);

      toast({ title: "¡Landing generada!" });
      navigate("/landings");
    } catch (err: any) {
      toast({ title: "Error al generar", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (!product) return null;

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
      </Button>

      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Generar Landing</h1>
        <p className="text-muted-foreground mt-1">Producto: <strong>{product.name}</strong></p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display">Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Modo de escritura</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aida">AIDA (Atención → Interés → Deseo → Acción)</SelectItem>
                <SelectItem value="standard">Standard (Secciones clásicas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Intensidad comercial</Label>
            <Select value={intensity} onValueChange={setIntensity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="soft">Soft — Tono informativo</SelectItem>
                <SelectItem value="medium">Medium — Persuasivo equilibrado</SelectItem>
                <SelectItem value="hard">Hard — Máxima urgencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Activar oferta</Label>
              <p className="text-sm text-muted-foreground">Agrega precio tachado y descuento</p>
            </div>
            <Switch checked={hasOffer} onCheckedChange={setHasOffer} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guarantee">Garantía</Label>
            <Input id="guarantee" value={guarantee} onChange={(e) => setGuarantee(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Landings usadas:</span>
            <Badge variant={canGenerate ? "secondary" : "destructive"}>
              {used} / {limit === 999999 ? "∞" : limit}
            </Badge>
          </div>

          <Button onClick={handleGenerate} disabled={generating || !canGenerate} className="w-full" size="lg">
            {generating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando con IA...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generar Landing</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateLanding;
