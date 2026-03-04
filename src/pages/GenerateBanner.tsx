import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { TemplateGallery } from "@/components/banner/TemplateGallery";
import { bannerSizes } from "@/components/banner/templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Download, Loader2, Lock, Image as ImageIcon } from "lucide-react";

type Product = Tables<"products">;

const GenerateBanner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [templateId, setTemplateId] = useState("oferta-directa");
  const [outputSize, setOutputSize] = useState("1080x1080");
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const isPaidPlan = profile?.plan === "starter" || profile?.plan === "pro";

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("products").select("*").eq("id", id).eq("user_id", user.id).single()
      .then(({ data }) => setProduct(data));
  }, [user, id]);

  const handleGenerate = async () => {
    if (!product || !isPaidPlan) return;
    setLoading(true);
    setGeneratedUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-banner", {
        body: {
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            description: product.description,
            target_audience: product.target_audience,
            images: product.images,
          },
          templateId,
          outputSize,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedUrl(data.imageUrl);
      setShowPreview(true);
      toast({ title: "¡Banner generado!", description: "Tu banner está listo para descargar." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo generar el banner", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedUrl) return;
    const response = await fetch(generatedUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banner-${product?.name || "image"}-${outputSize}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Generar Banner</h1>
          <p className="text-sm text-muted-foreground">{product.name}</p>
        </div>
      </div>

      {!isPaidPlan ? (
        <Card className="border-dashed border-2 border-primary/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Lock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Función exclusiva para planes Starter y Pro</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Genera banners profesionales con IA para tus redes sociales y campañas publicitarias.
            </p>
            <Button asChild>
              <Link to="/pricing">Ver planes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Product preview */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="aspect-square rounded-lg bg-muted overflow-hidden">
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-muted-foreground">${product.price.toLocaleString("es-CL")} CLP</p>
              </div>
            </CardContent>
          </Card>

          {/* Right: Controls */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Elige una plantilla</CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateGallery selected={templateId} onSelect={setTemplateId} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tamaño de salida</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={outputSize} onValueChange={setOutputSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bannerSizes.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label} ({s.width}×{s.height})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Generando banner...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generar Banner con IA
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Banner Generado</DialogTitle>
          </DialogHeader>
          {generatedUrl && (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border bg-muted">
                <img src={generatedUrl} alt="Banner generado" className="w-full h-auto" />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowPreview(false)}>Cerrar</Button>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" /> Descargar PNG
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GenerateBanner;
