import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { TemplateGallery } from "@/components/banner/TemplateGallery";
import { bannerSizes, bannerQuantityOptions } from "@/components/banner/templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Sparkles, Download, Loader2, Lock, Image as ImageIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Product = Tables<"products">;

interface GeneratedBanner {
  templateId: string;
  variation: number;
  imageUrl: string;
}

const STEPS = [
  { label: "Plantilla", icon: "🎨" },
  { label: "Descripción", icon: "✍️" },
  { label: "Cantidad", icon: "📊" },
  { label: "Generar", icon: "🚀" },
];

const GenerateBanner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("hook-visual");
  const [description, setDescription] = useState("");
  const [bannerCount, setBannerCount] = useState(2);
  const [outputSize, setOutputSize] = useState("1080x1080");
  const [loading, setLoading] = useState(false);
  const [generatedBanners, setGeneratedBanners] = useState<GeneratedBanner[]>([]);

  const isPaidPlan = profile?.plan === "starter" || profile?.plan === "pro";

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("products").select("*").eq("id", id).eq("user_id", user.id).single()
      .then(({ data }) => {
        setProduct(data);
        if (data?.description) setDescription(data.description);
      });
  }, [user, id]);

  const canGoNext = () => {
    if (step === 0) return !!selectedTemplate;
    if (step === 1) return description.length >= 120;
    if (step === 2) return bannerCount > 0;
    return true;
  };

  const handleGenerate = async () => {
    if (!product || !isPaidPlan) return;
    setLoading(true);
    setGeneratedBanners([]);

    try {
      const calls: Promise<GeneratedBanner>[] = [];

      for (let i = 0; i < bannerCount; i++) {
        for (let variation = 1; variation <= 2; variation++) {
          calls.push(
            (async () => {
              const { data, error } = await supabase.functions.invoke("generate-banner", {
                body: {
                  product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category,
                    description: description,
                    target_audience: product.target_audience,
                    images: product.images,
                  },
                  templateId: selectedTemplate,
                  outputSize,
                  variation,
                  bannerIndex: i + 1,
                },
              });
              if (error) throw error;
              if (data?.error) throw new Error(data.error);
              return { templateId: selectedTemplate, variation, imageUrl: data.imageUrl };
            })()
          );
        }
      }

      const results = await Promise.all(calls);
      setGeneratedBanners(results);
      toast({
        title: `¡${results.length} banners generados!`,
        description: "Tus banners están listos para descargar.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo generar los banners", variant: "destructive" });
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
    a.download = `banner-${product?.name || "image"}-${banner.templateId}-v${banner.variation}-${outputSize}.png`;
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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Generar Banners</h1>
          <p className="text-sm text-muted-foreground">{product.name} — ${product.price.toLocaleString("es-CL")} CLP</p>
        </div>
      </div>

      {!isPaidPlan ? (
        <Card className="border-dashed border-2 border-primary/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Lock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Función exclusiva para planes Starter y Pro</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Genera banners profesionales con IA para tus campañas publicitarias.
            </p>
            <Button asChild>
              <Link to="/pricing">Ver planes</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Step indicator */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => i < step && setStep(i)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  i === step
                    ? "bg-primary text-primary-foreground"
                    : i < step
                    ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : <span>{s.icon}</span>}
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {/* Step 1: Template */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Selecciona una plantilla</h2>
                <p className="text-sm text-muted-foreground">
                  Cada plantilla representa una etapa del proceso de venta. Elige la que mejor se adapte a tu campaña.
                </p>
              </div>
              <TemplateGallery selectedId={selectedTemplate} onSelect={setSelectedTemplate} />
            </div>
          )}

          {/* Step 2: Description */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Describe tu producto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  {product.images[0] && (
                    <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <Label htmlFor="description" className="text-sm text-muted-foreground">
                      Describe tu producto en detalle para generar banners más efectivos (mín. 120 caracteres)
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe los beneficios, características principales y por qué tu producto es especial. Cuanto más detalle, mejores banners generará la IA..."
                      rows={5}
                      maxLength={400}
                    />
                    <div className="flex justify-between text-xs">
                      <span className={cn(
                        "transition-colors",
                        description.length < 120 ? "text-destructive" : "text-green-600"
                      )}>
                        {description.length < 120
                          ? `Faltan ${120 - description.length} caracteres (mínimo 120)`
                          : "✓ Descripción suficiente"}
                      </span>
                      <span className="text-muted-foreground">{description.length}/400</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Quantity & Size */}
          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Cuántos banners quieres generar?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Por cada banner se generarán 2 variaciones visuales para que puedas comparar y elegir la mejor.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {bannerQuantityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setBannerCount(opt.value)}
                        className={cn(
                          "rounded-xl border-2 p-4 text-center transition-all hover:scale-[1.02]",
                          bannerCount === opt.value
                            ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <span className="text-2xl font-bold">{opt.value}</span>
                        <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          ({opt.value * 2} imágenes total)
                        </p>
                      </button>
                    ))}
                  </div>
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
            </div>
          )}

          {/* Step 4: Generate & Preview */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Plantilla</p>
                      <p className="font-semibold text-sm capitalize">{selectedTemplate.replace(/-/g, " ")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Banners</p>
                      <p className="font-semibold text-sm">{bannerCount} × 2 variaciones</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tamaño</p>
                      <p className="font-semibold text-sm">{outputSize}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold text-sm">{bannerCount * 2} imágenes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {generatedBanners.length === 0 && (
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Generando {bannerCount * 2} banners...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generar {bannerCount * 2} Banners con IA
                    </>
                  )}
                </Button>
              )}

              {/* Results */}
              {generatedBanners.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {generatedBanners.length} Banners Generados
                    </h3>
                    <Button onClick={handleDownloadAll} size="sm">
                      <Download className="h-4 w-4 mr-2" /> Descargar Todos
                    </Button>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedBanners.map((banner, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="rounded-lg overflow-hidden border bg-muted">
                          <img src={banner.imageUrl} alt={`Banner ${idx + 1}`} className="w-full h-auto" />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Variación {banner.variation} — Banner {Math.ceil((idx + 1) / 2)}
                          </span>
                          <Button variant="outline" size="sm" onClick={() => handleDownload(banner)}>
                            <Download className="h-3 w-3 mr-1" /> Descargar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => { setGeneratedBanners([]); handleGenerate(); }}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Regenerar Banners
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          {!loading && (
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
              </Button>
              {step < 3 && (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canGoNext()}
                >
                  Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GenerateBanner;
