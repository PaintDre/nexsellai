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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles, Download, Loader2, Lock, Image as ImageIcon } from "lucide-react";

type Product = Tables<"products">;

interface GeneratedBanner {
  templateId: string;
  imageUrl: string;
}

const GenerateBanner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(["oferta-directa"]);
  const [outputSize, setOutputSize] = useState("1080x1080");
  const [customText, setCustomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedBanners, setGeneratedBanners] = useState<GeneratedBanner[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const isPaidPlan = profile?.plan === "starter" || profile?.plan === "pro";

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("products").select("*").eq("id", id).eq("user_id", user.id).single()
      .then(({ data }) => setProduct(data));
  }, [user, id]);

  const handleToggleTemplate = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.length > 1 ? prev.filter((t) => t !== templateId) : prev
        : [...prev, templateId]
    );
  };

  const handleGenerate = async () => {
    if (!product || !isPaidPlan || selectedTemplates.length === 0) return;
    setLoading(true);
    setGeneratedBanners([]);

    try {
      const results = await Promise.all(
        selectedTemplates.map(async (templateId) => {
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
              customText: customText.trim() || undefined,
            },
          });
          if (error) throw error;
          if (data?.error) throw new Error(data.error);
          return { templateId, imageUrl: data.imageUrl } as GeneratedBanner;
        })
      );

      setGeneratedBanners(results);
      setShowPreview(true);
      toast({
        title: results.length > 1 ? `¡${results.length} banners generados!` : "¡Banner generado!",
        description: "Tus banners están listos para descargar.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo generar el banner", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (banner: GeneratedBanner) => {
    const response = await fetch(banner.imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banner-${product?.name || "image"}-${banner.templateId}-${outputSize}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = async () => {
    for (const banner of generatedBanners) {
      await handleDownload(banner);
    }
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
                <CardTitle className="text-base">
                  Elige plantillas ({selectedTemplates.length} seleccionada{selectedTemplates.length !== 1 ? "s" : ""})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TemplateGallery selectedIds={selectedTemplates} onToggle={handleToggleTemplate} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Texto personalizado (opcional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="customText" className="text-sm text-muted-foreground mb-2 block">
                  Agrega un slogan o texto que aparecerá en el banner
                </Label>
                <Textarea
                  id="customText"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Ej: La mejor calidad al mejor precio • ¡Solo por hoy!"
                  rows={2}
                  maxLength={120}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">{customText.length}/120</p>
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
              disabled={loading || selectedTemplates.length === 0}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Generando {selectedTemplates.length} banner{selectedTemplates.length !== 1 ? "s" : ""}...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generar {selectedTemplates.length} Banner{selectedTemplates.length !== 1 ? "s" : ""} con IA
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Preview dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {generatedBanners.length > 1
                ? `${generatedBanners.length} Banners Generados`
                : "Banner Generado"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className={generatedBanners.length > 1 ? "grid sm:grid-cols-2 gap-4" : ""}>
              {generatedBanners.map((banner) => (
                <div key={banner.templateId} className="space-y-2">
                  <div className="rounded-lg overflow-hidden border bg-muted">
                    <img src={banner.imageUrl} alt={`Banner ${banner.templateId}`} className="w-full h-auto" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground capitalize">
                      {banner.templateId.replace(/-/g, " ")}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(banner)}>
                      <Download className="h-3 w-3 mr-1" /> Descargar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end border-t pt-4">
              <Button variant="outline" onClick={() => setShowPreview(false)}>Cerrar</Button>
              {generatedBanners.length > 1 && (
                <Button onClick={handleDownloadAll}>
                  <Download className="h-4 w-4 mr-2" /> Descargar Todos
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GenerateBanner;
