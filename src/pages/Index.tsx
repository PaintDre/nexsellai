import { useState, lazy, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
const BannerShowcaseGallery = lazy(() => import("@/components/landing/BannerShowcaseGallery").then(m => ({ default: m.BannerShowcaseGallery })));
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Sparkles, Zap, Code2, ShoppingCart, ArrowRight, Loader2,
  CheckCircle2, Upload, Wand2, Download, ChevronDown, ChevronUp,
  ImagePlus, X, XCircle, Image, FileCode, Layers,
} from "lucide-react";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import { useTranslation } from "react-i18next";

const benefitIcons = [Zap, ShoppingCart, Code2, FileCode, Image, Layers];
const stepIcons = [Upload, Wand2, ImagePlus, Download];
const planPrices = [
  { monthlyPrice: 0, annualPrice: 0, popular: false },
  { monthlyPrice: 14990, annualPrice: 149900, popular: true },
  { monthlyPrice: 34990, annualPrice: 349900, popular: false },
];

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [demoName, setDemoName] = useState("");
  const [demoCategory, setDemoCategory] = useState("home");
  const [demoPrice, setDemoPrice] = useState("");
  const [demoDescription, setDemoDescription] = useState("");
  const [demoAudience, setDemoAudience] = useState("");
  const [generating, setGenerating] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [demoImage, setDemoImage] = useState<File | null>(null);
  const [demoImagePreview, setDemoImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const problems = t("indexPage.problems", { returnObjects: true }) as { text: string; detail: string }[];
  const solutions = t("indexPage.solutions", { returnObjects: true }) as { text: string; detail: string }[];
  const benefits = t("indexPage.benefits", { returnObjects: true }) as { title: string; desc: string }[];
  const steps = t("indexPage.steps", { returnObjects: true }) as { title: string; desc: string }[];
  const plans = t("indexPage.plans", { returnObjects: true }) as { name: string; landings: string; features: string[] }[];
  const faqs = t("indexPage.faqs", { returnObjects: true }) as { q: string; a: string }[];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImageError(t("indexPage.imageSizeError"));
      setDemoImage(null);
      setDemoImagePreview(null);
      return;
    }
    setImageError(null);
    setDemoImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setDemoImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setDemoImage(null);
    setDemoImagePreview(null);
    setImageError(null);
  };

  const demoUsed = typeof window !== "undefined" && localStorage.getItem("nexsell_demo_used") === "true";

  const handleDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demoUsed) {
      toast.error(t("indexPage.demoErrorTitle"), { description: t("indexPage.demoErrorDesc") });
      return;
    }
    if (!demoName.trim()) return;
    setGenerating(true);

    try {
      const product = {
        name: demoName,
        category: demoCategory,
        price: parseInt(demoPrice) || 19990,
        target_audience: demoAudience || "Compradores online",
        description: demoDescription || null,
      };

      const { data, error } = await supabase.functions.invoke("generate-landing", {
        body: { product, mode: "aida", intensity: "medium", hasOffer: false, guarantee: "Garantía de satisfacción de 30 días", plan: "free", demo: true },
      });

      if (error) throw error;

      localStorage.setItem("nexsell_demo_used", "true");
      localStorage.setItem("nexsell_preview_data", JSON.stringify({
        blocks: data.blocks || [],
        product,
        imagePreview: demoImagePreview,
      }));

      const sessionId = localStorage.getItem("nexsell_session") || crypto.randomUUID();
      localStorage.setItem("nexsell_session", sessionId);
      await supabase.from("demo_landings" as any).insert({ session_id: sessionId, blocks: data.blocks, product_data: product });

      toast.success(t("indexPage.demoSuccess"));
      navigate("/landing/preview");
    } catch (err: any) {
      toast.error(t("common.error"), { description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Logo size={32} className="rounded-lg" />
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-primary">Nex</span>sell
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/login">{t("indexPage.login")}</Link></Button>
            <Button asChild><Link to="/register">{t("indexPage.createAccount")}</Link></Button>
          </div>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="py-24 lg:py-40 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 text-sm px-4 py-1">
                {t("indexPage.badge")}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight leading-tight">
                {t("indexPage.heroTitle")}
                <span className="text-primary">{t("indexPage.heroTitleHighlight")}</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                {t("indexPage.heroSubtitle")}
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="text-base px-8 w-full sm:w-auto" asChild>
                  <a href="#demo"><Sparkles className="h-5 w-5 mr-2" /> {t("indexPage.tryFree")}</a>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 w-full sm:w-auto" asChild>
                  <a href="#how">{t("indexPage.seeHow")}</a>
                </Button>
              </div>
            </div>

            {/* Mockup */}
            <div className="relative mx-auto lg:mx-0 w-full max-w-md lg:max-w-none">
              <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-accent/60" />
                    <div className="h-3 w-3 rounded-full bg-primary/60" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-6 rounded-md bg-muted flex items-center px-3">
                      <span className="text-xs text-muted-foreground truncate">nexsell.app/landing/mi-producto</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="h-8 w-3/4 rounded bg-gradient-to-r from-primary/20 to-primary/5" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-5/6 rounded bg-muted" />
                  <div className="h-32 rounded-lg bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center">
                    <ImagePlus className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <div className="flex gap-3">
                    <div className="h-10 flex-1 rounded-lg bg-primary/20" />
                    <div className="h-10 w-28 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary-foreground">{t("indexPage.buyButton")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="h-16 rounded bg-muted/80" />
                    <div className="h-16 rounded bg-muted/80" />
                    <div className="h-16 rounded bg-muted/80" />
                  </div>
                </div>
              </div>
              <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                {t("indexPage.aiBadge")}
              </div>
              <div className="absolute -bottom-3 -left-3 bg-card border text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {t("indexPage.timeBadge")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. PROBLEMA / SOLUCIÓN ── */}
      <section className="py-20 lg:py-28 bg-muted/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-4">
            {t("indexPage.problemTitle")}
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            {t("indexPage.problemSubtitle")}
          </p>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-5">
              <h3 className="font-display font-semibold text-lg text-destructive flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5" /> {t("indexPage.withoutNexsell")}
              </h3>
              {problems.map((p) => (
                <div key={p.text} className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{p.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-5">
              <h3 className="font-display font-semibold text-lg text-primary flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5" /> {t("indexPage.withNexsell")}
              </h3>
              {solutions.map((s) => (
                <div key={s.text} className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{s.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. BENEFICIOS ── */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-4">
            {t("indexPage.benefitsTitle")}
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            {t("indexPage.benefitsSubtitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, idx) => {
              const Icon = benefitIcons[idx] || Zap;
              return (
                <Card key={b.title} className="border bg-card hover:shadow-md transition-shadow">
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">{b.title}</h3>
                    <p className="text-muted-foreground text-sm">{b.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. CÓMO FUNCIONA ── */}
      <section id="how" className="py-20 lg:py-28 bg-muted/50">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">{t("indexPage.howTitle")}</h2>
          <p className="text-muted-foreground mb-14 max-w-xl mx-auto">{t("indexPage.howSubtitle")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto relative">
            {steps.map((s, idx) => {
              const Icon = stepIcons[idx] || Upload;
              const stepNum = String(idx + 1);
              return (
                <div key={stepNum} className="relative flex flex-col items-center">
                  {idx < 3 && (
                    <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border z-0">
                      <ArrowRight className="absolute -right-2 -top-[7px] h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-4 text-2xl font-display font-bold relative z-10">
                    {stepNum}
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{s.title}</h3>
                  <p className="text-muted-foreground text-sm">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. EJEMPLOS ── */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-4">
            {t("indexPage.examplesTitle")}
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            {t("indexPage.examplesSubtitle")}
          </p>
          <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">{[1,2,3].map(i=><div key={i} className="aspect-square rounded-xl bg-muted/40" />)}</div>}>
            <BannerShowcaseGallery />
          </Suspense>
        </div>
      </section>

      {/* ── 6. DEMO GENERATOR ── */}
      <section id="demo" className="py-20 lg:py-28 bg-muted/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">{t("indexPage.demoBadge")}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-display">{t("indexPage.demoTitle")}</h2>
            <p className="text-muted-foreground mt-2">{t("indexPage.demoSubtitle")}</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleDemo} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="demo-name">{t("indexPage.productName")}</Label>
                    <Input id="demo-name" value={demoName} onChange={(e) => setDemoName(e.target.value)} placeholder={t("indexPage.productNamePlaceholder")} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("indexPage.category")}</Label>
                    <Select value={demoCategory} onValueChange={setDemoCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRODUCT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="demo-price">{t("indexPage.priceCLP")}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <Input id="demo-price" type="number" value={demoPrice} onChange={(e) => setDemoPrice(e.target.value)} className="pl-7" placeholder="19990" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-audience">{t("indexPage.targetAudience")}</Label>
                    <Input id="demo-audience" value={demoAudience} onChange={(e) => setDemoAudience(e.target.value)} placeholder={t("indexPage.targetAudiencePlaceholder")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-desc">{t("indexPage.descriptionOptional")}</Label>
                  <Textarea id="demo-desc" value={demoDescription} onChange={(e) => setDemoDescription(e.target.value)} placeholder={t("indexPage.descriptionPlaceholder")} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>{t("indexPage.productImage")}</Label>
                  {demoImagePreview ? (
                    <div className="relative inline-block">
                      <img src={demoImagePreview} alt="Preview" className="h-28 w-28 object-cover rounded-lg border" />
                      <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="demo-image" className="flex flex-col items-center justify-center h-28 w-full border-2 border-dashed border-input rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      <ImagePlus className="h-8 w-8 text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">{t("indexPage.uploadHint")}</span>
                      <input id="demo-image" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                    </label>
                  )}
                  {imageError && <p className="text-sm text-destructive">{imageError}</p>}
                  {!demoImage && !imageError && <p className="text-xs text-muted-foreground">{t("indexPage.imageRequired")}</p>}
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={generating || demoUsed || !demoImage}>
                  {generating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("indexPage.generatingAI")}</>
                  ) : demoUsed ? (
                    t("indexPage.demoUsed")
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> {t("indexPage.generateDemo")}</>
                  )}
                </Button>
                {demoUsed && (
                  <p className="text-center text-sm text-muted-foreground">
                    {t("indexPage.demoUsedMsg")}{" "}
                    <Link to="/register" className="text-primary underline">{t("indexPage.createAccountToGenerate")}</Link> {t("indexPage.toGenerateMore")}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 7. PLANES ── */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-4">{t("indexPage.plansTitle")}</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
            {t("indexPage.plansSubtitle")}
          </p>
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-3 bg-muted rounded-lg p-1">
              <button
                className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", billingPeriod === "monthly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                onClick={() => setBillingPeriod("monthly")}
              >
                {t("indexPage.monthly")}
              </button>
              <button
                className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2", billingPeriod === "annual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                onClick={() => setBillingPeriod("annual")}
              >
                {t("indexPage.annual")} <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">{t("indexPage.annualDiscount")}</Badge>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, idx) => {
              const priceData = planPrices[idx];
              const price = billingPeriod === "annual" ? priceData.annualPrice : priceData.monthlyPrice;
              const monthlyEq = billingPeriod === "annual" && priceData.annualPrice > 0 ? Math.round(priceData.annualPrice / 12) : null;
              return (
              <Card key={plan.name} className={priceData.popular ? "border-primary shadow-lg relative" : ""}>
                {priceData.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">{t("indexPage.mostPopular")}</Badge>
                  </div>
                )}
                <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                  <h3 className="font-display font-bold text-xl">{plan.name}</h3>
                  <div>
                    {price === 0 ? (
                      <span className="text-4xl font-bold font-display">{t("indexPage.free")}</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold font-display">${price.toLocaleString("es-CL")}</span>
                        <span className="text-muted-foreground">/{billingPeriod === "annual" ? t("indexPage.perYear") : t("indexPage.perMonth")}</span>
                        {monthlyEq && (
                          <p className="text-sm text-muted-foreground mt-1">${monthlyEq.toLocaleString("es-CL")}/{t("indexPage.perMonth")}</p>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-sm font-medium text-primary">{plan.landings}</p>
                  <ul className="text-left space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={priceData.popular ? "default" : "outline"} asChild>
                    <Link to="/register">{price === 0 ? t("indexPage.startFree") : t("indexPage.subscribe")}</Link>
                  </Button>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 8. FAQ ── */}
      <section className="py-20 lg:py-28 bg-muted/50">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-14">{t("indexPage.faqTitle")}</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Card key={i} className="overflow-hidden">
                <button
                  className="w-full text-left p-5 flex items-center justify-between"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. CTA FINAL ── */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            {t("indexPage.ctaTitle")}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            {t("indexPage.ctaSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-10 w-full sm:w-auto" asChild>
              <Link to="/register"><Sparkles className="h-5 w-5 mr-2" /> {t("indexPage.startFree")}</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-10 w-full sm:w-auto" asChild>
              <a href="#how">{t("indexPage.seeHow")}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-card">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
              <div className="flex items-center gap-2">
                <Logo size={28} className="rounded-lg" />
                <span className="font-display text-lg font-bold tracking-tight">
                  <span className="text-primary">Nex</span>sell
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#pricing" className="hover:text-foreground transition-colors">{t("indexPage.footerPricing")}</a>
                <Link to="/login" className="hover:text-foreground transition-colors">{t("indexPage.login")}</Link>
                <Link to="/register" className="hover:text-foreground transition-colors">{t("indexPage.createAccount")}</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com/nexsellai" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="https://x.com/nexsellai" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors" aria-label="X (Twitter)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://discord.gg/qg5AYq3BE" target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors" aria-label="Discord">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("indexPage.copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
