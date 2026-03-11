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
import { ArrowLeft, Sparkles, Loader2, ImagePlus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { themes, type LandingTheme } from "@/components/landing/themes";
import LandingTemplatePicker, { landingTemplates } from "@/components/landing/LandingTemplates";

import { usePlanLimits } from "@/hooks/usePlanLimits";
import { UpgradeWarningBanner } from "@/components/UpgradeWarningBanner";
import { UpgradeModal } from "@/components/UpgradeModal";

type Product = Tables<"products">;

const GenerateLanding = () => {
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

  const isPaidPlan = profile?.plan === "starter" || profile?.plan === "pro";

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("products").select("*").eq("id", id).eq("user_id", user.id).single().then(({ data }) => {
      if (data) setProduct(data);
      else navigate("/products");
    });
  }, [id, user]);

  const limit = LANDING_LIMITS[profile?.plan || "free"];
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

  const handleGenerate = async () => {
    if (!user || !product || !profile) return;

    if (!canGenerate) {
      toast.error("Límite alcanzado", { description: "Actualiza tu plan para generar más landings." });
      return;
    }

    setGenerating(true);
    setGenerationStep("copy");
    setProgress(10);

    try {
      // Step 1: Generate copy
      setProgress(20);
      const selectedTemplate = landingTemplates.find(t => t.id === templateId);
      const { data, error } = await supabase.functions.invoke("generate-landing", {
        body: {
          product,
          mode,
          intensity,
          hasOffer,
          guarantee,
          plan: profile.plan,
          sections: selectedTemplate?.sections,
          currency: (profile as any)?.currency || "USD",
          country_code: (profile as any)?.country_code || null,
        },
      });

      if (error) throw error;
      setProgress(50);

      // Step 2: Insert landing
      const { data: insertedLanding, error: insertError } = await supabase.from("landings").insert({
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

      if (insertError) throw insertError;
      setProgress(60);

      // Step 3: Auto-generate banners if enabled and paid plan
      if (autoImages && isPaidPlan && insertedLanding) {
        setGenerationStep("images");
        setProgress(65);

        // Get product images
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

        // Generate banners for hero, benefits and offer/cta sections
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

        await Promise.all(bannerPromises);
        setProgress(90);
      }

      // Step 4: Increment landings_used
      await supabase.from("profiles").update({ landings_used: used + 1 }).eq("user_id", user.id);

      setProgress(100);
      setGenerationStep("done");

      toast.success("¡Landing generada!");

      // Navigate after a brief moment to show completion
      setTimeout(() => {
        navigate(`/landings/${insertedLanding?.id || ""}`);
      }, 800);
    } catch (err: any) {
      toast.error("Error al generar", { description: err.message });
      setGenerationStep("idle");
      setProgress(0);
    } finally {
      setGenerating(false);
    }
  };

  if (!product) return null;

  const stepLabels: Record<string, string> = {
    idle: "",
    copy: "Paso 1/2 — Generando copy con IA...",
    images: "Paso 2/2 — Generando imágenes con IA (Hero + Beneficios + Oferta)...",
    done: "¡Listo! Redirigiendo...",
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
      </Button>

      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">Generar Landing</h1>
        <p className="text-muted-foreground mt-1">Producto: <strong>{product.name}</strong></p>
      </div>

      {/* Quick vs Custom Mode Tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setQuickMode(true)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${quickMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          ⚡ Rápido
        </button>
        <button
          onClick={() => setQuickMode(false)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!quickMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          🎛️ Personalizado
        </button>
      </div>

      {quickMode ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-2">
              <Sparkles className="h-8 w-8 text-primary mx-auto" />
              <h3 className="font-semibold font-display text-lg">Generación rápida</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Usaremos la configuración recomendada: plantilla completa, intensidad media, tema clean.
              </p>
            </div>
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
              <span>Landings usadas:</span>
              <Badge variant={canGenerate ? "secondary" : "destructive"}>{used} / {limit}</Badge>
            </div>
            {generationStep !== "idle" && (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2">
                  {generationStep === "done" ? <Check className="h-4 w-4 text-emerald-500" /> : <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  <span className="text-sm font-medium">{stepLabels[generationStep]}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            <Button onClick={handleGenerate} disabled={generating || !canGenerate} className="w-full min-h-[44px]" size="lg">
              {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando...</> : <><Sparkles className="h-4 w-4 mr-2" /> Generar Landing</>}
            </Button>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Plantilla de landing</Label>
            <LandingTemplatePicker selected={templateId} onSelect={setTemplateId} />
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

          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="min-w-0">
              <Label>Activar oferta</Label>
              <p className="text-sm text-muted-foreground">Agrega precio tachado y descuento</p>
            </div>
            <Switch checked={hasOffer} onCheckedChange={setHasOffer} className="shrink-0" />
          </div>

          <div className="space-y-2">
            <Label>Tema visual</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as LandingTheme)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(themes).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.name} — {cfg.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Puedes cambiar el tema después en la vista previa</p>
          </div>

          {/* Auto-generate images toggle */}
          <div className={`flex items-center justify-between gap-4 rounded-lg border p-4 ${!isPaidPlan ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3 min-w-0">
              <ImagePlus className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <Label>Incluir imágenes IA</Label>
                <p className="text-sm text-muted-foreground">
                  {isPaidPlan
                    ? "Genera banners automáticos para Hero y Oferta"
                    : "Disponible en plan Starter o superior"
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
            <Label htmlFor="guarantee">Garantía</Label>
            <Input id="guarantee" value={guarantee} onChange={(e) => setGuarantee(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Landings usadas:</span>
            <Badge variant={canGenerate ? "secondary" : "destructive"}>
              {used} / {limit}
            </Badge>
          </div>

          {/* Generation progress */}
          {generationStep !== "idle" && (
            <div className="space-y-3 p-4 rounded-lg border bg-muted/50">
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
                  Generando banners con IA para las secciones principales...
                </p>
              )}
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generating || !canGenerate} className="w-full min-h-[44px]" size="lg">
            {generating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generar Landing{autoImages && isPaidPlan ? " + Imágenes" : ""}</>
            )}
          </Button>
        </CardContent>
      </Card>
      )}
    </div>
  );
};

export default GenerateLanding;
