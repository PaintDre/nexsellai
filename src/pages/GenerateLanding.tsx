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
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Loader2, ImagePlus, Check, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { themes, type LandingTheme } from "@/components/landing/themes";
import LandingTemplatePicker, { landingTemplates } from "@/components/landing/LandingTemplates";
import { useTranslation } from "react-i18next";

import { usePlanLimits } from "@/hooks/usePlanLimits";
import { UpgradeWarningBanner } from "@/components/UpgradeWarningBanner";
import { UpgradeModal } from "@/components/UpgradeModal";

type Product = Tables<"products">;

const GenerateLanding = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  

  const [product, setProduct] = useState<Product | null>(null);
  const [mode, setMode] = useState<string>("aida");
  const [intensity, setIntensity] = useState<string>("medium");
  const [hasOffer, setHasOffer] = useState(false);
  const [guarantee, setGuarantee] = useState("Garantía de satisfacción de 30 días");
  const [generating, setGenerating] = useState(false);
  const [theme, setTheme] = useState<LandingTheme>("clean");
  const [autoImages, setAutoImages] = useState(true);
  const [templateId, setTemplateId] = useState("completa");
  const [generationStep, setGenerationStep] = useState<"idle" | "copy" | "images" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [quickMode, setQuickMode] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isPaidPlan = profile?.plan === "starter" || profile?.plan === "pro";

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("products").select("*").eq("id", id).eq("user_id", user.id).single().then(({ data }) => {
      if (data) setProduct(data);
      else navigate("/products");
    });
  }, [id, user]);

  const { landing: landingLimits } = usePlanLimits();
  const limit = landingLimits[profile?.plan || "free"];
  const used = profile?.landings_used || 0;
  const canGenerate = used < limit;

  const generateBannerForSection = async (
    landingId: string,
    block: any,
    productData: Product,
    allImageUrls: string[]
  ) => {
    try {
      await supabase.functions.invoke("generate-banner", {
        body: {
          product: {
            id: productData.id,
            name: productData.name,
            price: productData.price,
            category: productData.category,
            description: productData.description,
            target_audience: productData.target_audience,
            images: allImageUrls,
          },
          templateId: block.templateOverride || (block.type === "hero" ? "hero-producto" : block.type === "benefits" ? "beneficios-grid" : "oferta-directa"),
          outputSize: "1200x628",
          sectionType: block.type,
          sectionTitle: block.title || block.type,
          landingId,
          blockContent: block.content,
        },
      });
    } catch (err) {
      console.error(`Error generating banner for ${block.type}:`, err);
    }
  };

  const needsTwoImages = templateId === "shrine-latam";
  const productImageCount = product?.images?.length || 0;
  const hasEnoughImagesForTemplate = !needsTwoImages || productImageCount >= 2;

  const handleGenerate = async () => {
    if (!user || !product || !profile) return;

    if (!canGenerate) {
      toast.error(t("generateLanding.limitReached"), { description: t("generateLanding.limitDesc") });
      return;
    }

    if (!hasEnoughImagesForTemplate) {
      toast.error(t("generateLanding.shrineImagesWarningTitle"), { description: t("generateLanding.shrineImagesWarning") });
      return;
    }

    const tStart = Date.now();
    console.log("[handleGenerate] start", { productId: product.id, plan: profile.plan, mode, intensity, hasOffer, autoImages, templateId });

    setGenerating(true);
    setGenerationStep("copy");
    setProgress(10);

    const toastId = toast.loading(t("ai.generatingLanding"), { description: t("ai.queuedDesc") });

    let insertedLanding: { id: string } | null = null;

    try {
      // ── Step A: invoke generate-landing edge function ──
      setProgress(20);
      const selectedTemplate = landingTemplates.find(t => t.id === templateId);
      console.log("[handleGenerate] invoking generate-landing edge function...");
      const tEdge = Date.now();

      const { data, error } = await supabase.functions.invoke("generate-landing", {
        body: {
          product,
          mode,
          intensity,
          hasOffer,
          guarantee,
          plan: profile.plan,
          sections: selectedTemplate?.sections,
          template_id: templateId,
          currency: (profile as any)?.currency || "USD",
          country_code: (profile as any)?.country_code || null,
        },
      });

      if (error) {
        console.error("[handleGenerate] generate-landing edge function failed:", error);
        toast.error(t("ai.errorTitle"), { id: toastId, description: error.message || "Edge function error" });
        setGenerationStep("idle");
        setProgress(0);
        return;
      }

      if (!data || !Array.isArray(data.blocks) || data.blocks.length === 0) {
        console.error("[handleGenerate] generate-landing returned invalid payload:", data);
        toast.error(t("ai.errorTitle"), { id: toastId, description: "Empty AI response" });
        setGenerationStep("idle");
        setProgress(0);
        return;
      }

      console.log(`[handleGenerate] generate-landing OK in ${Date.now() - tEdge}ms — ${data.blocks.length} blocks`);
      setProgress(50);

      // ── Step B: insert landing row ──
      const { data: inserted, error: insertError } = await supabase.from("landings").insert({
        user_id: user.id,
        product_id: product.id,
        name: product.name,
        mode: mode as any,
        intensity: intensity as any,
        has_offer: hasOffer,
        guarantee,
        blocks: data.blocks,
        theme,
      } as any).select().single();

      if (insertError || !inserted) {
        console.error("[handleGenerate] insert into landings failed:", insertError);
        toast.error(t("ai.errorTitle"), { id: toastId, description: insertError?.message || "DB insert failed" });
        setGenerationStep("idle");
        setProgress(0);
        return;
      }

      insertedLanding = inserted;
      console.log(`[handleGenerate] landing inserted id=${inserted.id}`);
      setProgress(60);

      // ── Step C: AI banners (optional) ──
      if (autoImages && isPaidPlan && insertedLanding) {
        setGenerationStep("images");
        setProgress(65);

        const allImageUrls: string[] = [];
        if (product.images && product.images.length > 0) {
          for (const imgPath of product.images) {
            if (imgPath.startsWith("http")) {
              allImageUrls.push(imgPath);
            } else {
              const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(imgPath);
              if (urlData?.publicUrl) allImageUrls.push(urlData.publicUrl);
            }
          }
        }

        const blocks = data.blocks as any[];
        const heroBlock = blocks.find((b: any) => b.type === "hero");
        const benefitsBlock = blocks.find((b: any) => b.type === "benefits");
        const offerBlock = blocks.find((b: any) => b.type === "offer") || blocks.find((b: any) => b.type === "cta");

        const bannerPromises: Promise<void>[] = [];
        if (heroBlock) {
          bannerPromises.push(generateBannerForSection(insertedLanding.id, heroBlock, product, allImageUrls));
        }
        if (benefitsBlock) {
          bannerPromises.push(generateBannerForSection(insertedLanding.id, { ...benefitsBlock, templateOverride: "beneficios-grid" }, product, allImageUrls));
        }
        setProgress(75);

        if (offerBlock && offerBlock.type !== heroBlock?.type) {
          bannerPromises.push(generateBannerForSection(insertedLanding.id, offerBlock, product, allImageUrls));
        }

        console.log(`[handleGenerate] generating ${bannerPromises.length} banners in parallel`);
        await Promise.all(bannerPromises);
        console.log("[handleGenerate] banners done");
        setProgress(90);
      }

      // ── Step D: increment usage counter (non-blocking on error) ──
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ landings_used: used + 1 })
        .eq("user_id", user.id);
      if (updateError) {
        console.error("[handleGenerate] failed to increment landings_used:", updateError);
        // Don't abort — landing is already created.
      }

      setProgress(100);
      setGenerationStep("done");
      console.log(`[handleGenerate] complete in ${Date.now() - tStart}ms`);

      toast.success(t("generateLanding.generated"));

      setTimeout(() => {
        navigate(`/landings/${insertedLanding?.id || ""}`);
      }, 800);
    } catch (err: any) {
      console.error("[handleGenerate] unexpected error:", err);
      toast.error(t("generateLanding.generateError"), { description: err?.message || "Unexpected error" });
      setGenerationStep("idle");
      setProgress(0);
    } finally {
      setGenerating(false);
    }
  };

  if (!product) return null;

  const stepLabels: Record<string, string> = {
    idle: "",
    copy: t("generateLanding.stepCopy"),
    images: t("generateLanding.stepImages"),
    done: t("generateLanding.stepDone"),
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> {t("common.back")}
      </Button>

      <UpgradeWarningBanner resource="landings" used={used} limit={limit} />
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} resource="landings" used={used} limit={limit} />

      {!hasEnoughImagesForTemplate && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-500/40 bg-amber-500/10">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="font-semibold text-sm">{t("generateLanding.shrineImagesWarningTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("generateLanding.shrineImagesWarning")} ({productImageCount}/2)
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate(`/products/${product.id}/edit`)}>
              <ImagePlus className="h-4 w-4 mr-2" />
              {t("generateLanding.uploadMoreImages")}
            </Button>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">{t("generateLanding.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("generateLanding.product")}: <strong>{product.name}</strong></p>
      </div>

      {/* Quick vs Custom Mode Tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setQuickMode(true)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${quickMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          ⚡ {t("generateLanding.quick")}
        </button>
        <button
          onClick={() => setQuickMode(false)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!quickMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          🎛️ {t("generateLanding.custom")}
        </button>
      </div>

      {quickMode ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <Sparkles className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold font-display text-lg">{t("generateLanding.quickTitle")}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {t("generateLanding.quickDesc")}
              </p>
            </div>
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
              <span>{t("generateLanding.landingsUsed")}:</span>
              <Badge variant={canGenerate ? "secondary" : "destructive"}>{used} / {limit}</Badge>
            </div>
            {generationStep !== "idle" && (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/50">
                {generating && generationStep !== "done" && (
                  <div className="flex items-start gap-3 p-3 rounded-md border border-primary/30 bg-primary/5">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-primary">{t("generateLanding.queueTitle")}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t("generateLanding.queueDesc")}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {generationStep === "done" ? <Check className="h-4 w-4 text-emerald-500" /> : <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  <span className="text-sm font-medium">{stepLabels[generationStep]}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            <Button onClick={handleGenerate} disabled={generating || !canGenerate || !hasEnoughImagesForTemplate} className="w-full min-h-[44px]" size="lg">
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("common.generating")}</> : <><Sparkles className="h-4 w-4 mr-2" /> {t("generateLanding.generateButton")}</>}
            </Button>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">{t("generateLanding.config")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t("generateLanding.template")}</Label>
            <LandingTemplatePicker
              selected={templateId}
              onSelect={(id) => {
                setTemplateId(id);
                const tpl = landingTemplates.find((t) => t.id === id);
                if (tpl?.theme) setTheme(tpl.theme);
              }}
              userPlan={profile?.plan as "free" | "starter" | "pro" | undefined}
              onLockedClick={() => setShowUpgradeModal(true)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("generateLanding.intensity")}</Label>
            <Select value={intensity} onValueChange={setIntensity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="soft">{t("generateLanding.softDesc")}</SelectItem>
                <SelectItem value="medium">{t("generateLanding.mediumDesc")}</SelectItem>
                <SelectItem value="hard">{t("generateLanding.hardDesc")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="min-w-0">
              <Label>{t("generateLanding.enableOffer")}</Label>
              <p className="text-sm text-muted-foreground">{t("generateLanding.offerDesc")}</p>
            </div>
            <Switch checked={hasOffer} onCheckedChange={setHasOffer} className="shrink-0" />
          </div>

          <div className="space-y-2">
            <Label>{t("generateLanding.visualTheme")}</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as LandingTheme)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(themes).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.name} — {cfg.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("generateLanding.themeHint")}</p>
          </div>

          {/* Auto-generate images toggle */}
          <div className={`flex items-center justify-between gap-4 rounded-lg border p-4 ${!isPaidPlan ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3 min-w-0">
              <ImagePlus className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <Label>{t("generateLanding.aiImages")}</Label>
                <p className="text-sm text-muted-foreground">
                  {isPaidPlan
                    ? t("generateLanding.aiImagesDesc")
                    : t("generateLanding.aiImagesLocked")
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={autoImages && isPaidPlan}
              onCheckedChange={setAutoImages}
              disabled={!isPaidPlan}
              className="shrink-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="guarantee">{t("generateLanding.guarantee")}</Label>
            <Input id="guarantee" value={guarantee} onChange={(e) => setGuarantee(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t("generateLanding.landingsUsed")}:</span>
            <Badge variant={canGenerate ? "secondary" : "destructive"}>
              {used} / {limit}
            </Badge>
          </div>

          {/* Generation progress */}
          {generationStep !== "idle" && (
            <div className="space-y-3 p-4 rounded-lg border bg-muted/50">
              {generating && generationStep !== "done" && (
                <div className="flex items-start gap-3 p-3 rounded-md border border-primary/30 bg-primary/5">
                  <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{t("generateLanding.queueTitle")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("generateLanding.queueDesc")}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                {generationStep === "done" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                <span className="text-sm font-medium">{stepLabels[generationStep]}</span>
              </div>
              <Progress value={progress} className="h-2" />
              {generationStep === "images" && (
                <p className="text-xs text-muted-foreground">
                  {t("generateLanding.imagesHint")}
                </p>
              )}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating || !canGenerate || !hasEnoughImagesForTemplate} className="w-full min-h-[44px]" size="lg">
            {generating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("common.generating")}</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> {autoImages && isPaidPlan ? t("generateLanding.generateWithImages") : t("generateLanding.generateButton")}</>
            )}
          </Button>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default GenerateLanding;
