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
import { ArrowLeft, ArrowRight, Sparkles, Download, Loader2, Lock, Check, Eye, AlertTriangle, Zap, SlidersHorizontal, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

import { UpgradeModal } from "@/components/UpgradeModal";
import { useCredits, isInsufficientCreditsError } from "@/hooks/useCredits";
import { InsufficientCreditsModal } from "@/components/credits/InsufficientCreditsModal";

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
  currency: string;
  country_code: string;
}

const SEQUENCES: Record<number, string[]> = {
  2: ["hook-visual", "oferta"],
  3: ["hook-visual", "beneficio", "oferta"],
  5: ["hook-visual", "problema", "solucion", "beneficio", "oferta"],
  7: ["hook-visual", "problema", "solucion", "beneficio", "prueba-social", "oferta", "cta"],
};

const getTemplateName = (id: string): string =>
  bannerTemplates.find((t) => t.id === id)?.name || id;

const getSequence = (count: number): string[] =>
  SEQUENCES[count] || SEQUENCES[3];

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
    currency: form.currency,
    country_code: form.country_code,
  };
  if (form.generationMode === "custom") {
    return { ...base, bannerGoal: form.bannerGoal, tone: form.tone, visualStyle: form.visualStyle };
  }
  return base;
};

const downloadBanner = async (banner: GeneratedBanner, productName: string, outputSize: string, t: any) => {
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
    toast.error(t("generateBanner.downloadError"), { description: t("generateBanner.downloadErrorDesc") });
  }
};

const GenerateBanner = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const STEPS = [
    { label: t("generateBanner.steps.description"), icon: "✍️" },
    { label: t("generateBanner.steps.quantity"), icon: "📊" },
    { label: t("generateBanner.steps.generate"), icon: "🚀" },
  ];

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
    currency: (profile as any)?.currency || "USD",
    country_code: (profile as any)?.country_code || "",
  });
  const [loading, setLoading] = useState(false);
  const [generatedBanners, setGeneratedBanners] = useState<GeneratedBanner[]>([]);
  const [previewBanner, setPreviewBanner] = useState<GeneratedBanner | null>(null);

  const updateForm = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const plan = profile?.plan || "free";
  const { balance, costOf, refresh: refreshCredits } = useCredits();
  const sequenceLength = formState.bannerCount;
  const isPack = sequenceLength >= 5;
  const totalCost = useMemo(() => {
    if (isPack) return costOf("banner_aida_pack");
    return costOf("banner_single") * sequenceLength;
  }, [isPack, sequenceLength, costOf]);
  const hasReachedLimit = balance < totalCost;
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showInsufficient, setShowInsufficient] = useState(false);
  const sequence = useMemo(() => getSequence(formState.bannerCount), [formState.bannerCount]);

  const canGoNext = useMemo(() => {
    if (step === 0) return formState.description.length >= 120;
    if (step === 1) return formState.bannerCount > 0;
    return true;
  }, [step, formState.description.length, formState.bannerCount]);

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

  const handleGenerate = useCallback(async () => {
    if (!product || hasReachedLimit) return;
    setLoading(true);
    setGeneratedBanners([]);

    const toastId = toast.loading(t("ai.generatingBanners"), { description: t("ai.queuedDesc") });

    try {
      const results = await Promise.allSettled(
        sequence.map((templateId, i) =>
          (async (): Promise<GeneratedBanner> => {
            const { data, error } = await supabase.functions.invoke("generate-banner", {
              body: buildBannerPayload(product, formState, templateId, i, sequence.length),
            });
            if (error) {
              if (isInsufficientCreditsError(error)) {
                setShowInsufficient(true);
              }
              throw error;
            }
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
          toast.warning(t("generateBanner.partialSuccess", { count: fulfilled.length }), {
            id: toastId,
            description: t("generateBanner.partialFailed", { count: failedCount }),
          });
        } else {
          toast.success(t("ai.readyTitle"), {
            id: toastId,
            description: t("generateBanner.allSuccessDesc"),
          });
        }
      } else {
        toast.error(t("ai.errorTitle"), { id: toastId, description: t("generateBanner.generateError") });
      }
      await refreshCredits();
    } catch (err: any) {
      toast.error(t("ai.errorTitle"), { id: toastId, description: err.message || t("generateBanner.generateError") });
    } finally {
      setLoading(false);
    }
  }, [product, hasReachedLimit, sequence, formState, t, refreshCredits]);

  const handleDownload = useCallback(
    (banner: GeneratedBanner) => downloadBanner(banner, product?.name || "", formState.outputSize, t),
    [product?.name, formState.outputSize, t]
  );

  const handleDownloadAll = useCallback(async () => {
    for (const banner of generatedBanners) {
      await downloadBanner(banner, product?.name || "", formState.outputSize, t);
    }
  }, [generatedBanners, product?.name, formState.outputSize, t]);

  if (productError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground font-medium">{t("generateBanner.productNotFound")}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("common.back")}
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

  const productImage = product.images?.[0];
  const formattedPrice = product.price != null ? `$${product.price.toLocaleString()} ${formState.currency}` : "";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight">{t("generateBanner.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {product.name}
            {formattedPrice && ` — ${formattedPrice}`}
          </p>
        </div>
      </div>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} resource="banners" used={0} limit={0} />
      <InsufficientCreditsModal
        open={showInsufficient}
        onOpenChange={setShowInsufficient}
        required={totalCost}
        action={isPack ? "banner_aida_pack" : "banner_single"}
      />

      {hasReachedLimit ? (
        <Card className="border-dashed border-2 border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Lock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("credits.insufficientTitle", "No tienes suficientes créditos")}</h3>
            <p className="text-muted-foreground mb-2 max-w-md">
              {t("credits.needed", "Necesitas {{required}} créditos y tienes {{balance}} disponibles.", { required: totalCost, balance })}
            </p>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t("credits.upgradeHint", "Mejora tu plan para obtener más créditos cada mes.")}
            </p>
            <Button asChild>
              <Link to="/pricing">{t("generateBanner.upgradePlan")}</Link>
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
                    <span className="font-semibold text-sm">{t("generateBanner.auto")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("generateBanner.autoDesc")}</p>
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
                    <span className="font-semibold text-sm">{t("generateBanner.customMode")}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("generateBanner.customDesc")}</p>
                </button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {t("generateBanner.autoHint")}
              </p>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("generateBanner.describeProduct")}</CardTitle>
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
                        {t("generateBanner.describeHint")}
                      </Label>
                      <Textarea
                        id="description"
                        value={formState.description}
                        onChange={(e) => updateForm("description", e.target.value)}
                        placeholder={t("generateBanner.describePlaceholder")}
                        rows={5}
                        maxLength={400}
                      />
                      <div className="flex justify-between text-xs">
                        <span className={cn(
                          "transition-colors",
                          formState.description.length < 120 ? "text-destructive" : "text-green-600"
                        )}>
                          {formState.description.length < 120
                            ? t("generateBanner.charsMissing", { count: 120 - formState.description.length })
                            : t("generateBanner.charsOk")}
                        </span>
                        <span className="text-muted-foreground">{formState.description.length}/400</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customText" className="text-sm text-muted-foreground">
                      {t("generateBanner.sloganLabel")}
                    </Label>
                    <Input
                      id="customText"
                      value={formState.customText}
                      onChange={(e) => updateForm("customText", e.target.value)}
                      placeholder={t("generateBanner.sloganPlaceholder")}
                      maxLength={80}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("generateBanner.sloganHint")}
                    </p>
                  </div>

                  {/* Custom mode fields */}
                  {formState.generationMode === "custom" && (
                    <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-primary" /> {t("generateBanner.advancedConfig")}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">{t("generateBanner.goal")}</Label>
                          <Select value={formState.bannerGoal} onValueChange={(v) => updateForm("bannerGoal", v as BannerGoal)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["sale", "offer", "awareness", "benefit"] as BannerGoal[]).map((k) => (
                                <SelectItem key={k} value={k}>{t(`generateBanner.goalLabels.${k}`)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">{t("generateBanner.tone")}</Label>
                          <Select value={formState.tone} onValueChange={(v) => updateForm("tone", v as Tone)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["premium", "direct", "minimal", "bold"] as Tone[]).map((k) => (
                                <SelectItem key={k} value={k}>{t(`generateBanner.toneLabels.${k}`)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">{t("generateBanner.visualStyle")}</Label>
                          <Select value={formState.visualStyle} onValueChange={(v) => updateForm("visualStyle", v as VisualStyle)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(["auto", "clean", "premium", "ecommerce", "bold"] as VisualStyle[]).map((k) => (
                                <SelectItem key={k} value={k}>{t(`generateBanner.visualLabels.${k}`)}</SelectItem>
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
                        <Sparkles className="h-4 w-4" /> {t("generateBanner.autoDesign")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("generateBanner.autoDesignDesc")}
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
                  <CardTitle className="text-lg">{t("generateBanner.howMany")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("generateBanner.sequenceDesc")}
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
                    <p className="text-xs font-medium text-muted-foreground">{t("generateBanner.sequenceLabel")}</p>
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
                  <CardTitle className="text-base">{t("generateBanner.outputSize")}</CardTitle>
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
                      <p className="text-xs text-muted-foreground">{t("generateBanner.mode")}</p>
                      <p className="font-semibold text-sm">{formState.generationMode === "auto" ? t("generateBanner.auto") : t("generateBanner.customMode")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("generateBanner.sequence")}</p>
                      <p className="font-semibold text-sm">{sequence.length} {t("generateBanner.stages")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("generateBanner.size")}</p>
                      <p className="font-semibold text-sm">{formState.outputSize}</p>
                    </div>
                    {formState.generationMode === "custom" && (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("generateBanner.goal")}</p>
                          <p className="font-semibold text-sm">{t(`generateBanner.goalLabels.${formState.bannerGoal}`)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("generateBanner.tone")}</p>
                          <p className="font-semibold text-sm">{t(`generateBanner.toneLabels.${formState.tone}`)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">{t("generateBanner.visualStyle")}</p>
                          <p className="font-semibold text-sm">{t(`generateBanner.visualLabels.${formState.visualStyle}`)}</p>
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
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-primary" />
                    {t("credits.cost", "Costo")}
                  </span>
                  <span className="font-semibold tabular-nums">{totalCost} {t("credits.unit", "créditos")}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("credits.balance", "Saldo")}</span>
                  <span className="tabular-nums">{balance}</span>
                </div>
              </div>

              {generatedBanners.length === 0 && (
                <Button
                  onClick={handleGenerate}
                  disabled={loading || balance < totalCost}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {t("generateBanner.analyzingProduct")}
                    </>
                  ) : balance < totalCost ? (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      {t("credits.insufficientShort", "Créditos insuficientes")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      {t("generateBanner.generateSequence", { count: sequence.length })}
                    </>
                  )}
                </Button>
              )}

              {generatedBanners.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {t("generateBanner.salesSequence", { count: generatedBanners.length })}
                    </h3>
                    <Button onClick={handleDownloadAll} size="sm">
                      <Download className="h-4 w-4 mr-2" /> {t("common.downloadAll")}
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
                              <Download className="h-3 w-3 mr-1" /> {t("common.download")}
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
                    {t("generateBanner.regenerateSequence")}
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
                <ArrowLeft className="h-4 w-4 mr-2" /> {t("common.previous")}
              </Button>
              {step < 2 && (
                <Button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canGoNext}
                  className="min-h-[44px]"
                >
                  {t("common.next")} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewBanner} onOpenChange={(open) => !open && setPreviewBanner(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden" aria-describedby={undefined}>
          <DialogTitle className="sr-only">{t("generateBanner.bannerPreview")}</DialogTitle>
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
                  <Download className="h-4 w-4 mr-2" /> {t("common.download")}
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
