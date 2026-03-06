import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { TemplateGallery } from "@/components/banner/TemplateGallery";
import { bannerSizes, bannerQuantityOptions, bannerTemplates } from "@/components/banner/templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles, Download, Loader2, Lock, Check, Eye, X } from "lucide-react";
import { cn } from "@/lib/utils";

const BANNER_LIMITS: Record<string, number> = { free: 2, starter: 30, pro: 150 };

type Product = Tables<"products">;

interface GeneratedBanner {
  templateId: string;
  templateName: string;
  imageUrl: string;
  sequencePosition: number;
  totalInSequence: number;
}

const STEPS = [
  { label: "Plantilla", icon: "🎨" },
  { label: "Descripción", icon: "✍️" },
  { label: "Cantidad", icon: "📊" },
  { label: "Generar", icon: "🚀" },
];

// Sales funnel sequences by quantity
const SEQUENCES: Record<number, string[]> = {
  2: ["hook-visual", "oferta"],
  3: ["hook-visual", "beneficio", "oferta"],
  5: ["hook-visual", "problema", "solucion", "beneficio", "oferta"],
};

const getTemplateName = (id: string) =>
  bannerTemplates.find((t) => t.id === id)?.name || id;

const GenerateBanner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  

  const [product, setProduct] = useState<Product | null>(null);
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState("hook-visual");
  const [description, setDescription] = useState("");
  const [bannerCount, setBannerCount] = useState(2);
  const [outputSize, setOutputSize] = useState("1080x1080");
  const [loading, setLoading] = useState(false);
  const [generatedBanners, setGeneratedBanners] = useState<GeneratedBanner[]>([]);
  const [previewBanner, setPreviewBanner] = useState<GeneratedBanner | null>(null);
  const [bannersUsed, setBannersUsed] = useState(0);

  const plan = profile?.plan || "free";
  const bannerLimit = BANNER_LIMITS[plan] || 2;

  // Calculate effective usage with monthly reset
  useEffect(() => {
    if (!profile) return;
    const resetAt = profile.banners_reset_at ? new Date(profile.banners_reset_at) : null;
    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (!resetAt || (now.getTime() - resetAt.getTime()) >= thirtyDaysMs) {
      setBannersUsed(0);
    } else {
      setBannersUsed(profile.banners_used || 0);
    }
  }, [profile]);

  const bannersRemaining = Math.max(0, bannerLimit - bannersUsed);
  const hasReachedLimit = bannersRemaining <= 0;

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

  const getSequence = (): string[] => {
    return SEQUENCES[bannerCount] || SEQUENCES[2];
  };

  const handleGenerate = async () => {
    if (!product || hasReachedLimit) return;
    setLoading(true);
    setGeneratedBanners([]);

    try {
      const sequence = getSequence();
      const calls: Promise<GeneratedBanner>[] = [];

      for (let i = 0; i < sequence.length; i++) {
        const templateId = sequence[i];
        const templateName = getTemplateName(templateId);

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
                templateId,
                outputSize,
                bannerIndex: i + 1,
                sequencePosition: i + 1,
                totalInSequence: sequence.length,
              },
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            return {
              templateId,
              templateName,
              imageUrl: data.imageUrl,
              sequencePosition: i + 1,
              totalInSequence: sequence.length,
            };
          })()
        );
      }

      const results = await Promise.all(calls);
      results.sort((a, b) => a.sequencePosition - b.sequencePosition);
      setGeneratedBanners(results);
      setBannersUsed(prev => prev + results.length);
      toast({
        title: `¡${results.length} banners generados!`,
        description: "Tu secuencia de venta está lista.",
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

  const sequence = getSequence();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
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

      {hasReachedLimit ? (
        <Card className="border-dashed border-2 border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Lock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Has alcanzado el límite de banners de tu plan</h3>
            <p className="text-muted-foreground mb-2 max-w-md">
              Has usado {bannersUsed} de {bannerLimit} banners este mes.
            </p>
            <p className="text-muted-foreground mb-6 max-w-md">
              Actualiza tu plan para seguir generando banners.
            </p>
            <Button asChild>
              <Link to="/pricing">Actualizar plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Step indicator */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
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
                <h2 className="text-lg font-semibold mb-1">Selecciona una plantilla base</h2>
                <p className="text-sm text-muted-foreground">
                  La IA generará automáticamente una secuencia de venta completa basada en tu selección y la cantidad de banners.
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
                <div className="flex flex-col sm:flex-row gap-4">
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
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Se generará una secuencia de venta automática — 1 banner por etapa del embudo.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      </button>
                    ))}
                  </div>

                  {/* Sequence preview */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Secuencia de venta que se generará:</p>
                    <div className="flex flex-wrap gap-2">
                      {SEQUENCES[bannerCount]?.map((tid, i) => {
                        const tpl = bannerTemplates.find((t) => t.id === tid);
                        return (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-background border rounded-full px-3 py-1">
                            <span>{tpl?.icon}</span>
                            <span className="font-medium">{i + 1}. {tpl?.name}</span>
                          </span>
                        );
                      })}
                    </div>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Secuencia</p>
                      <p className="font-semibold text-sm">{sequence.length} etapas</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tamaño</p>
                      <p className="font-semibold text-sm">{outputSize}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold text-sm">{sequence.length} banners</p>
                    </div>
                  </div>
                  {/* Sequence chips */}
                  <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
                    {sequence.map((tid, i) => {
                      const tpl = bannerTemplates.find((t) => t.id === tid);
                      return (
                        <span key={i} className="text-[11px] bg-muted rounded-full px-2.5 py-0.5">
                          {tpl?.icon} {tpl?.name}
                        </span>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Usage indicator */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Banners usados este mes</span>
                  <span className="font-semibold">{bannersUsed} / {bannerLimit}</span>
                </div>
                <Progress value={(bannersUsed / bannerLimit) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {bannersRemaining} banners restantes · Plan {plan}
                </p>
              </div>

              {generatedBanners.length === 0 && (
                <Button
                  onClick={handleGenerate}
                  disabled={loading || sequence.length > bannersRemaining}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Generando {sequence.length} banners...
                    </>
                  ) : sequence.length > bannersRemaining ? (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      No tienes suficientes banners ({bannersRemaining} restantes)
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Generar Secuencia de Venta ({sequence.length} banners)
                    </>
                  )}
                </Button>
              )}

              {/* Results */}
              {generatedBanners.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Secuencia de Venta — {generatedBanners.length} Banners
                    </h3>
                    <Button onClick={handleDownloadAll} size="sm">
                      <Download className="h-4 w-4 mr-2" /> Descargar Todos
                    </Button>
                  </div>

                  {/* Each banner as its own stage */}
                  {generatedBanners.map((banner, idx) => {
                    const tpl = bannerTemplates.find((t) => t.id === banner.templateId);
                    return (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold bg-primary/10 text-primary rounded-full px-3 py-1">
                            {tpl?.icon} {banner.sequencePosition}/{banner.totalInSequence} — {tpl?.name}
                          </span>
                        </div>
                        <div className="max-w-lg mx-auto space-y-2 group">
                          <div
                            className="rounded-lg overflow-hidden border bg-muted cursor-pointer relative"
                            onClick={() => setPreviewBanner(banner)}
                          >
                            <img src={banner.imageUrl} alt={banner.templateName} className="w-full h-auto" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <Eye className="h-8 w-8 text-white" />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleDownload(banner)}>
                              <Download className="h-3 w-3 mr-1" /> Descargar
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    onClick={() => { setGeneratedBanners([]); handleGenerate(); }}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    Regenerar Secuencia
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
                className="min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
              </Button>
              {step < 3 && (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canGoNext()}
                  className="min-h-[44px]"
                >
                  Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewBanner} onOpenChange={(open) => !open && setPreviewBanner(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {previewBanner && (
            <div className="flex flex-col">
              <div className="bg-muted flex items-center justify-center max-h-[70vh] overflow-auto">
                <img
                  src={previewBanner.imageUrl}
                  alt={previewBanner.templateName}
                  className="w-full h-auto"
                />
              </div>
              <div className="p-4 flex items-center justify-between">
                <p className="font-semibold text-sm">
                  {previewBanner.sequencePosition}/{previewBanner.totalInSequence} — {previewBanner.templateName}
                </p>
                <Button size="sm" onClick={() => handleDownload(previewBanner)}>
                  <Download className="h-4 w-4 mr-2" /> Descargar
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
