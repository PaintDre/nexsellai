import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { bannerSizes, bannerQuantityOptions, bannerTemplates } from "@/components/banner/templates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles, Download, Loader2, Lock, Check, Eye, AlertTriangle, Zap, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

import { BANNER_LIMITS } from "@/lib/constants";
import { computeBannersUsed } from "@/lib/planUsage";

const STEPS = [
  { label: "Descripción", icon: "✍️" },
  { label: "Cantidad", icon: "📊" },
  { label: "Generar", icon: "🚀" },
];

const SEQUENCES: Record<number, string[]> = {
  2: ["hook-visual", "oferta"],
  3: ["hook-visual", "beneficio", "oferta"],
  5: ["hook-visual", "problema", "solucion", "beneficio", "oferta"],
};

// ─── Types ───────────────────────────────────────────────────────────────────

type Product = Tables<"products">;

interface GeneratedBanner {
  templateId: string;
  templateName: string;
  imageUrl: string;
  sequencePosition: number;
  totalInSequence: number;
}

type GenerationMode = "auto" | "custom";
type BannerGoal = "sale" | "offer" | "awareness" | "benefit";
type Tone = "premium" | "direct" | "minimal" | "bold";
type VisualStyle = "auto" | "clean" | "premium" | "ecommerce" | "bold";

interface FormState {
  description: string;
  customText: string;
  bannerCount: number;
  outputSize: string;
  generationMode: GenerationMode;
  bannerGoal: BannerGoal;
  tone: Tone;
  visualStyle: VisualStyle;
}

const GOAL_LABELS: Record<BannerGoal, string> = { sale: "Venta", offer: "Oferta", awareness: "Awareness", benefit: "Beneficio" };
const TONE_LABELS: Record<Tone, string> = { premium: "Premium", direct: "Directo", minimal: "Minimalista", bold: "Llamativo" };
const VISUAL_LABELS: Record<VisualStyle, string> = { auto: "Automático", clean: "Limpio", premium: "Premium", ecommerce: "Ecommerce", bold: "Llamativo" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getTemplateName = (id: string): string =>
  bannerTemplates.find((t) => t.id === id)?.name || id;

const getSequence = (count: number): string[] =>
  SEQUENCES[count] || SEQUENCES[3];

const computeBannersUsed = (profile: Tables<"profiles"> | null): number => {
  if (!profile) return 0;
  const resetAt = profile.banners_reset_at ? new Date(profile.banners_reset_at) : null;
  const now = new Date();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (!resetAt || now.getTime() - resetAt.getTime() >= thirtyDaysMs) {
    return 0;
  }
  return profile.banners_used || 0;
};

const buildBannerPayload = (
  product: Product,
  form: FormState,
  templateId: string,
  index: number,
  total: number,
) => {
  const base = {
    product: {
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      description: form.description,
      target_audience: product.target_audience,
      images: product.images ?? [],
    },
    templateId,
    outputSize: form.outputSize,
    customText: form.customText || undefined,
    bannerIndex: index + 1,
    sequencePosition: index + 1,
    totalInSequence: total,
    generationMode: form.generationMode,
  };
  if (form.generationMode === "custom") {
    return { ...base, bannerGoal: form.bannerGoal, tone: form.tone, visualStyle: form.visualStyle };
  }
  return base;
};

const downloadBanner = async (banner: GeneratedBanner, productName: string, outputSize: string) => {
  try {
    const response = await fetch(banner.imageUrl);
    if (!response.ok) throw new Error("Fetch failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banner-${productName || "image"}-${banner.templateId}-${outputSize}.png`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error("Error al descargar", { description: "No se pudo descargar el banner. Intenta de nuevo." });
  }
};

// ─── Component ───────────────────────────────────────────────────────────────

const GenerateBanner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [productError, setProductError] = useState(false);
  const [step, setStep] = useState(0);
  const [formState, setFormState] = useState<FormState>({
    description: "",
    customText: "",
    bannerCount: 3,
    outputSize: "1080x1080",
    generationMode: "auto",
    bannerGoal: "sale",
    tone: "direct",
    visualStyle: "auto",
  });
  const [loading, setLoading] = useState(false);
  const [generatedBanners, setGeneratedBanners] = useState<GeneratedBanner[]>([]);
  const [previewBanner, setPreviewBanner] = useState<GeneratedBanner | null>(null);

  const updateForm = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const plan = profile?.plan || "free";
  const bannerLimit = BANNER_LIMITS[plan] || 2;
  const bannersUsed = useMemo(() => computeBannersUsed(profile), [profile]);
  const bannersRemaining = useMemo(() => Math.max(0, bannerLimit - bannersUsed), [bannerLimit, bannersUsed]);
  const hasReachedLimit = bannersRemaining <= 0;
  const sequence = useMemo(() => getSequence(formState.bannerCount), [formState.bannerCount]);

  const canGoNext = useMemo(() => {
    if (step === 0) return formState.description.length >= 120;
    if (step === 1) return formState.bannerCount > 0;
    return true;
  }, [step, formState.description.length, formState.bannerCount]);

  // ─── Product loading ────────────────────────────────────────────────────

  useEffect(() => {
    if (!user || !id) return;
    setProductError(false);
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setProductError(true);
          return;
        }
        setProduct(data);
        if (data.description) {
          updateForm("description", data.description);
        }
      });
  }, [user, id, updateForm]);

  // ─── Generation ─────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!product || hasReachedLimit) return;
    setLoading(true);
    setGeneratedBanners([]);

    try {
      const results = await Promise.allSettled(
        sequence.map((templateId, i) =>
          (async (): Promise<GeneratedBanner> => {
            const { data, error } = await supabase.functions.invoke("generate-banner", {
              body: buildBannerPayload(
                product,
                formState,
                templateId,
                i,
                sequence.length,
              ),
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            return {
              templateId,
              templateName: getTemplateName(templateId),
              imageUrl: data.imageUrl,
              sequencePosition: i + 1,
              totalInSequence: sequence.length,
            };
          })()
        )
      );

      const fulfilled = results
        .filter((r): r is PromiseFulfilledResult<GeneratedBanner> => r.status === "fulfilled")
        .map((r) => r.value)
        .sort((a, b) => a.sequencePosition - b.sequencePosition);

      const failedCount = results.filter((r) => r.status === "rejected").length;

      if (fulfilled.length > 0) {
        setGeneratedBanners(fulfilled);
        if (failedCount > 0) {
          toast.warning(`${fulfilled.length} banners generados`, {
            description: `${failedCount} banner(s) fallaron. Puedes regenerar la secuencia.`,
          });
        } else {
          toast.success(`¡${fulfilled.length} banners generados!`, {
            description: "Tu secuencia de venta está lista.",
          });
        }
      } else {
        toast.error("Error", { description: "No se pudo generar ningún banner. Intenta de nuevo." });
      }
    } catch (err: any) {
      toast.error("Error", { description: err.message || "No se pudo generar los banners" });
    } finally {
      setLoading(false);
    }
  }, [product, hasReachedLimit, sequence, formState]);

  const handleDownload = useCallback(
    (banner: GeneratedBanner) => downloadBanner(banner, product?.name || "", formState.outputSize),
    [product?.name, formState.outputSize]
  );

  const handleDownloadAll = useCallback(async () => {
    for (const banner of generatedBanners) {
      await downloadBanner(banner, product?.name || "", formState.outputSize);
    }
  }, [generatedBanners, product?.name, formState.outputSize]);

  // ─── Error / Loading states ─────────────────────────────────────────────

  if (productError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground font-medium">Producto no encontrado o sin acceso.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  const productImage = product.images?.[0];
  const formattedPrice = product.price != null ? `$${product.price.toLocaleString("es-CL")} CLP` : "";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Generar Banners</h1>
          <p className="text-sm text-muted-foreground">
            {product.name}
            {formattedPrice && ` — ${formattedPrice}`}
          </p>
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

          {/* Step 1: Description */}
          {step === 0 && (
            <div className="space-y-6">
              {/* Mode Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => updateForm("generationMode", "auto")}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.01]",
                    formState.generationMode === "auto"
                      ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Automático</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rápido y simple — la IA decide el mejor enfoque para tu producto.</p>
                </button>
                <button
                  onClick={() => updateForm("generationMode", "custom")}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.01]",
                    formState.generationMode === "custom"
                      ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Personalizado</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Más control — define el objetivo, tono y estilo visual del banner.</p>
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Incluso en modo automático, la IA analiza tu producto y crea una secuencia de banners optimizada para ventas.
              </p>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Describe tu producto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {productImage && (
                      <div className="w-24 h-24 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        <img src={productImage} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 space-y-3">
                      <Label htmlFor="description" className="text-sm text-muted-foreground">
                        Describe los beneficios y características de tu producto (mín. 120 caracteres)
                      </Label>
                      <Textarea
                        id="description"
                        value={formState.description}
                        onChange={(e) => updateForm("description", e.target.value)}
                        placeholder="Describe los beneficios, características principales y por qué tu producto es especial. La IA analizará tu imagen y creará el diseño perfecto..."
                        rows={5}
                        maxLength={400}
                      />
                      <div className="flex justify-between text-xs">
                        <span className={cn(
                          "transition-colors",
                          formState.description.length < 120 ? "text-destructive" : "text-green-600"
                        )}>
                          {formState.description.length < 120
                            ? `Faltan ${120 - formState.description.length} caracteres (mínimo 120)`
                            : "✓ Descripción suficiente"}
                        </span>
                        <span className="text-muted-foreground">{formState.description.length}/400</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customText" className="text-sm text-muted-foreground">
                      Slogan o texto personalizado (opcional)
                    </Label>
                    <Input
                      id="customText"
                      value={formState.customText}
                      onChange={(e) => updateForm("customText", e.target.value)}
                      placeholder="Ej: ¡Transforma tu hogar!, La mejor calidad al mejor precio..."
                      maxLength={80}
                    />
                    <p className="text-xs text-muted-foreground">
                      Si lo incluyes, aparecerá de forma prominente en tus banners.
                    </p>
                  </div>

                  {/* Custom mode fields */}
                  {formState.generationMode === "custom" && (
                    <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-primary" /> Configuración avanzada
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Objetivo</Label>
                          <Select value={formState.bannerGoal} onValueChange={(v) => updateForm("bannerGoal", v as BannerGoal)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.entries(GOAL_LABELS) as [BannerGoal, string][]).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Tono</Label>
                          <Select value={formState.tone} onValueChange={(v) => updateForm("tone", v as Tone)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.entries(TONE_LABELS) as [Tone, string][]).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Estilo visual</Label>
                          <Select value={formState.visualStyle} onValueChange={(v) => updateForm("visualStyle", v as VisualStyle)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.entries(VISUAL_LABELS) as [VisualStyle, string][]).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {formState.generationMode === "auto" && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1">
                      <p className="text-sm font-medium text-primary flex items-center gap-2">
                        <Sparkles className="h-4 w-4" /> Diseño profesional automático
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Nuestra IA analiza la imagen de tu producto para extraer colores, estilo y composición.
                        Genera banners de nivel agencia con tipografía profesional, colores armónicos y composición perfecta.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Quantity & Size */}
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">¿Cuántos banners quieres generar?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Se generará una secuencia de venta automática — cada banner con un ángulo de marketing único.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {bannerQuantityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateForm("bannerCount", opt.value)}
                        className={cn(
                          "rounded-xl border-2 p-4 text-center transition-all hover:scale-[1.02]",
                          formState.bannerCount === opt.value
                            ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <span className="text-2xl font-bold">{opt.value}</span>
                        <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                      </button>
                    ))}
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Secuencia de venta que se generará:</p>
                    <div className="flex flex-wrap gap-2">
                      {sequence.map((tid, i) => {
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
                  <Select value={formState.outputSize} onValueChange={(v) => updateForm("outputSize", v)}>
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

          {/* Step 3: Generate & Preview */}
          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className={cn(
                    "grid gap-4 text-center",
                    formState.generationMode === "custom" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3"
                  )}>
                    <div>
                      <p className="text-xs text-muted-foreground">Modo</p>
                      <p className="font-semibold text-sm">{formState.generationMode === "auto" ? "Automático" : "Personalizado"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Secuencia</p>
                      <p className="font-semibold text-sm">{sequence.length} etapas</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tamaño</p>
                      <p className="font-semibold text-sm">{formState.outputSize}</p>
                    </div>
                    {formState.generationMode === "custom" && (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Objetivo</p>
                          <p className="font-semibold text-sm">{GOAL_LABELS[formState.bannerGoal]}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tono</p>
                          <p className="font-semibold text-sm">{TONE_LABELS[formState.tone]}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Estilo visual</p>
                          <p className="font-semibold text-sm">{VISUAL_LABELS[formState.visualStyle]}</p>
                        </div>
                      </>
                    )}
                  </div>
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
                      Analizando tu producto y creando tu secuencia de banners...
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
              {step < 2 && (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canGoNext}
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
        <DialogContent className="max-w-3xl p-0 overflow-hidden" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Vista previa del banner</DialogTitle>
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
