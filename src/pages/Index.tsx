import { useState, lazy, Suspense, useEffect } from "react";
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
import { useScrollReveal } from "@/hooks/useScrollReveal";
import AnimatedCounter from "@/components/landing/AnimatedCounter";
import {
  Sparkles, Zap, Code2, ShoppingCart, ArrowRight, Loader2,
  CheckCircle2, Upload, Wand2, Download,
  ImagePlus, X, XCircle, Image, FileCode, Layers, Star, Rocket, Menu, Video, Play,
  Users, Store, Briefcase, Minus, Bot, Mic2,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  const revealRef = useScrollReveal();

  const [demoName, setDemoName] = useState("");
  const [demoCategory, setDemoCategory] = useState("home");
  const [demoPrice, setDemoPrice] = useState("");
  const [demoDescription, setDemoDescription] = useState("");
  const [demoAudience, setDemoAudience] = useState("");
  const [generating, setGenerating] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [demoImage, setDemoImage] = useState<File | null>(null);
  const [demoImagePreview, setDemoImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const problems = t("indexPage.problems", { returnObjects: true }) as { text: string; detail: string }[];
  const solutions = t("indexPage.solutions", { returnObjects: true }) as { text: string; detail: string }[];
  const benefits = t("indexPage.benefits", { returnObjects: true }) as { title: string; desc: string }[];
  const steps = t("indexPage.steps", { returnObjects: true }) as { title: string; desc: string }[];
  const plans = t("indexPage.plans", { returnObjects: true }) as { name: string; landings: string; features: string[] }[];
  const faqs = t("indexPage.faqs", { returnObjects: true }) as { q: string; a: string }[];
  const audiences = t("indexPage.audiences", { returnObjects: true }) as { title: string; desc: string; tag: string }[];
  const compareCols = t("indexPage.compareCols", { returnObjects: true }) as string[];
  const compareRows = t("indexPage.compareRows", { returnObjects: true }) as { feature: string; nex: string | boolean; alt1: string | boolean; alt2: string | boolean }[];
  const aiSuiteItems = t("indexPage.aiSuiteItems", { returnObjects: true }) as { tag: string; title: string; desc: string }[];
  const audienceIcons = [Users, Store, Briefcase];
  const aiSuiteIcons = [Video, Mic2, Bot];
  const renderCell = (v: string | boolean) => {
    if (v === true) return <CheckCircle2 className="h-5 w-5 text-primary mx-auto" />;
    if (v === false) return <Minus className="h-5 w-5 text-muted-foreground/50 mx-auto" />;
    return <span className="text-sm font-medium">{v}</span>;
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const navLinks = [
    { href: "#how", label: t("indexPage.seeHow") },
    { href: "#examples", label: t("indexPage.examplesTitle") },
    { href: "#pricing", label: t("indexPage.footerPricing") },
  ];

  return (
    <div ref={revealRef} className="dark min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── NAV ── */}
      <nav
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border/40 bg-background/75 backdrop-blur-xl shadow-sm"
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto flex items-center justify-between h-16 px-4 max-w-7xl">
          <a href="#top" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Logo size={32} className="relative rounded-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-primary">Nex</span>sell
            </span>
          </a>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/login">{t("indexPage.login")}</Link>
            </Button>
            <Button size="sm" asChild className="btn-magnetic shadow-md">
              <Link to="/register">
                <Sparkles className="h-4 w-4" />
                <span className="hidden xs:inline">{t("indexPage.createAccount")}</span>
                <span className="xs:hidden">Empezar</span>
              </Link>
            </Button>
            <button
              className="md:hidden h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted/60 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl animate-fade-in">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1 max-w-7xl">
              {navLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted/60 transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted/60 transition-colors sm:hidden"
              >
                {t("indexPage.login")}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── 1. HERO ── */}
      <section id="top" className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Animated background blobs */}
        <div aria-hidden className="absolute inset-0 -z-20 bg-mesh-hero" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-grid-dark opacity-50" />
        <div aria-hidden className="absolute -top-32 -left-20 h-72 w-72 bg-primary/20 blur-3xl animate-blob" />
        <div aria-hidden className="absolute -top-10 right-0 h-80 w-80 bg-amber/20 blur-3xl animate-blob" style={{ animationDelay: "-5s" }} />
        <div aria-hidden className="absolute bottom-0 left-1/3 h-64 w-64 bg-primary/15 blur-3xl animate-blob" style={{ animationDelay: "-10s" }} />

        <div className="container mx-auto px-4 max-w-7xl relative">
          <div className="grid lg:grid-cols-[1.1fr,1fr] gap-12 lg:gap-16 items-center">
            <div className="text-center lg:text-left page-in">
              <Badge
                variant="secondary"
                className="mb-6 text-xs sm:text-sm px-4 py-1.5 bg-amber/10 text-amber-brand border border-amber/30 hover:bg-amber/15 transition-colors gap-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-amber-brand opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-brand" />
                </span>
                {t("indexPage.badge")}
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-display tracking-tight leading-[1.05]">
                {t("indexPage.heroTitle")}
                <span className="block bg-gradient-to-r from-primary via-emerald-400 to-amber-brand bg-clip-text text-transparent">
                  {t("indexPage.heroTitleHighlight")}
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t("indexPage.heroSubtitle")}
              </p>

              {/* Trust row */}
              <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[0,1,2,3,4].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                  <span className="font-medium text-foreground">4.9</span>
                </div>
                <div className="hidden sm:block h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Sin tarjeta</span>
                </div>
                <div className="hidden sm:block h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>Listo en 60s</span>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button size="lg" className="cta-amber text-base px-8 h-12 group hover:text-amber-foreground" asChild>
                  <a href="#demo">
                    <Sparkles className="h-5 w-5" />
                    {t("indexPage.tryFree")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 h-12 backdrop-blur-sm bg-card/40 border-border/60 hover:bg-card lift-on-hover gap-2" asChild>
                  <a href="#how">
                    <Play className="h-4 w-4 text-primary" />
                    {t("indexPage.seeHow")}
                  </a>
                </Button>
              </div>

              {/* Stats */}
              <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-6 max-w-md mx-auto lg:mx-0">
                {[
                  { value: 10000, suffix: "+", label: "Landings creadas" },
                  { value: 60, suffix: "s", label: "Tiempo medio" },
                  { value: 4, suffix: "x", label: "Más conversión" },
                ].map((s) => (
                  <div key={s.label} className="text-center lg:text-left">
                    <div className="text-2xl sm:text-3xl font-display font-bold text-foreground tnum">
                      <AnimatedCounter to={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mockup */}
            <div className="relative mx-auto lg:mx-0 w-full max-w-md lg:max-w-none">
              <div className="absolute inset-0 -m-6 bg-gradient-to-tr from-primary/25 via-amber/15 to-primary/10 rounded-[2rem] blur-2xl animate-glow-pulse -z-10" />

              <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl shadow-primary/20 overflow-hidden hero-parallax">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/40">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive/60" />
                    <div className="h-3 w-3 rounded-full bg-warning/60" />
                    <div className="h-3 w-3 rounded-full bg-primary/60" />
                  </div>
                  <div className="flex-1 mx-2">
                    <div className="h-6 rounded-md bg-background/80 border border-border/40 flex items-center gap-1.5 px-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">nexsell.app/p/mi-producto</span>
                    </div>
                  </div>
                </div>
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Generating indicator */}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Generando con IA…
                    <div className="flex-1 h-1 rounded-full bg-muted/60 overflow-hidden ml-2">
                      <div className="h-full bg-gradient-to-r from-primary to-amber generating-bar" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-7 w-3/4 rounded bg-gradient-to-r from-primary/30 to-primary/5" />
                    <div className="h-7 w-1/2 rounded bg-gradient-to-r from-primary/20 to-transparent" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-3 w-5/6 rounded bg-muted" />
                  </div>
                  <div className="h-36 rounded-xl bg-gradient-to-br from-primary/15 via-accent/30 to-secondary/30 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-gradient" />
                    <ImagePlus className="h-12 w-12 text-primary/40 relative" />
                  </div>
                  <div className="flex gap-3">
                    <div className="h-11 flex-1 rounded-lg bg-muted/60" />
                    <div className="h-11 px-5 rounded-lg flex items-center justify-center shadow-md" style={{ background: "var(--gradient-cta)", boxShadow: "var(--shadow-amber)" }}>
                      <span className="text-xs font-bold tracking-wide text-amber-foreground">{t("indexPage.buyButton")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="h-14 rounded-lg bg-muted/60" />
                    <div className="h-14 rounded-lg bg-muted/60" />
                    <div className="h-14 rounded-lg bg-muted/60" />
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-3 sm:-right-6 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl shadow-xl shadow-primary/40 flex items-center gap-1.5 animate-float-slow">
                <Sparkles className="h-3.5 w-3.5" />
                {t("indexPage.aiBadge")}
              </div>
              <div className="absolute -bottom-3 -left-3 sm:-left-6 glass-card text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 animate-float-slower">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                {t("indexPage.timeBadge")}
              </div>
              <div className="hidden sm:flex absolute top-1/2 -right-8 lg:-right-10 -translate-y-1/2 glass-card text-xs font-semibold px-3 py-2 rounded-xl items-center gap-1.5 animate-float-slow" style={{ animationDelay: "-2s" }}>
                <Rocket className="h-3.5 w-3.5 text-amber-brand" />
                +127% conversión
              </div>
              {/* Video IA teaser (Fase 3) */}
              <div className="absolute -bottom-6 right-2 sm:right-6 glass-card text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 animate-float-slower border border-amber/30" style={{ animationDelay: "-3s" }}>
                <span className="relative flex h-5 w-5 items-center justify-center rounded-md" style={{ background: "var(--gradient-cta)" }}>
                  <Video className="h-3 w-3 text-amber-foreground" />
                </span>
                <span>Video IA <span className="text-amber-brand">próximamente</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO MARQUEE / Social proof ── */}
      <section className="border-y border-border/40 bg-muted/30 py-6 overflow-hidden">
        <div className="container mx-auto px-4 max-w-7xl">
          <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">
            Compatible con las mejores plataformas
          </p>
          <div className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-muted/60 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-muted/60 to-transparent z-10 pointer-events-none" />
            <div className="flex gap-12 animate-marquee whitespace-nowrap">
              {["Shopify", "WooCommerce", "Tienda Nube", "Mercado Pago", "WhatsApp", "Instagram", "Stripe", "Google Ads", "Shopify", "WooCommerce", "Tienda Nube", "Mercado Pago", "WhatsApp", "Instagram", "Stripe", "Google Ads"].map((brand, i) => (
                <span key={i} className="text-lg sm:text-xl font-display font-semibold text-muted-foreground/60 hover:text-foreground transition-colors">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. PROBLEMA / SOLUCIÓN ── */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14 reveal-on-scroll">
            <Badge variant="secondary" className="mb-4 bg-muted/80">El problema</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight">
              {t("indexPage.problemTitle")}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              {t("indexPage.problemSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-3 reveal-on-scroll">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="h-4 w-4 text-destructive" />
                </div>
                <h3 className="font-display font-semibold text-base text-destructive">{t("indexPage.withoutNexsell")}</h3>
              </div>
              {problems.map((p, i) => (
                <div
                  key={p.text}
                  className="flex items-start gap-3 p-4 rounded-xl bg-destructive/[0.03] border border-destructive/15 hover:border-destructive/30 hover:bg-destructive/[0.06] transition-all duration-300"
                  style={{ transitionDelay: `${i * 30}ms` }}
                >
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-foreground">{p.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 reveal-on-scroll">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-base text-primary">{t("indexPage.withNexsell")}</h3>
              </div>
              {solutions.map((s, i) => (
                <div
                  key={s.text}
                  className="flex items-start gap-3 p-4 rounded-xl bg-primary/[0.04] border border-primary/15 hover:border-primary/40 hover:bg-primary/[0.07] hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-primary/10"
                  style={{ transitionDelay: `${i * 30}ms` }}
                >
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-foreground">{s.text}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. BENEFICIOS ── */}
      <section className="py-20 lg:py-28 bg-muted/30 relative overflow-hidden cv-auto">
        <div aria-hidden className="absolute top-0 right-0 h-96 w-96 bg-primary/5 blur-3xl rounded-full -translate-y-1/2" />
        <div className="container mx-auto px-4 max-w-7xl relative">
          <div className="text-center mb-14 reveal-on-scroll">
            <Badge variant="secondary" className="mb-4">Beneficios</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight">
              {t("indexPage.benefitsTitle")}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              {t("indexPage.benefitsSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {benefits.map((b, idx) => {
              const Icon = benefitIcons[idx] || Zap;
              return (
                <div
                  key={b.title}
                  className="reveal-on-scroll group relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-6 hover:bg-card hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/10"
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300">
                    <Icon className="h-6 w-6 text-primary" />
                    <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2 tracking-tight">{b.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4. CÓMO FUNCIONA ── */}
      <section id="how" className="py-20 lg:py-28 cv-auto">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16 reveal-on-scroll">
            <Badge variant="secondary" className="mb-4">¿Cómo funciona?</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight">{t("indexPage.howTitle")}</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">{t("indexPage.howSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 max-w-6xl mx-auto relative">
            {steps.map((s, idx) => {
              const Icon = stepIcons[idx] || Upload;
              const stepNum = String(idx + 1).padStart(2, "0");
              return (
                <div
                  key={stepNum}
                  className="reveal-on-scroll relative group"
                  style={{ transitionDelay: `${idx * 80}ms` }}
                >
                  {idx < 3 && (
                    <div aria-hidden className="hidden lg:block absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-px z-0">
                      <div className="h-full bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
                      <ArrowRight className="absolute -right-1 -top-[7px] h-3.5 w-3.5 text-primary/40 group-hover:animate-arrow" />
                    </div>
                  )}
                  <div className="relative flex flex-col items-center text-center px-2">
                    <div className="relative mb-5">
                      <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex flex-col items-center justify-center shadow-xl shadow-primary/30 group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-300">
                        <Icon className="h-7 w-7 mb-0.5" />
                        <span className="text-[10px] font-display font-bold tracking-wider opacity-80">{stepNum}</span>
                      </div>
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2 tracking-tight">{s.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-[220px]">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. EJEMPLOS ── */}
      <section id="examples" className="py-20 lg:py-28 bg-muted/30 cv-auto">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12 reveal-on-scroll">
            <Badge variant="secondary" className="mb-4">Galería</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight">
              {t("indexPage.examplesTitle")}
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              {t("indexPage.examplesSubtitle")}
            </p>
          </div>
          <div className="reveal-on-scroll">
            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {[1,2,3].map(i=><div key={i} className="aspect-square rounded-xl shimmer" />)}
              </div>
            }>
              <BannerShowcaseGallery />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── 6. DEMO GENERATOR ── */}
      <section id="demo" className="py-20 lg:py-28 relative overflow-hidden cv-auto">
        <div aria-hidden className="absolute inset-0 -z-10 bg-mesh-glow opacity-60" />
        <div className="container mx-auto px-4 max-w-3xl relative">
          <div className="text-center mb-10 reveal-on-scroll">
            <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border border-primary/20 gap-2">
              <Sparkles className="h-3 w-3" />
              {t("indexPage.demoBadge")}
            </Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight">{t("indexPage.demoTitle")}</h2>
            <p className="text-muted-foreground mt-3">{t("indexPage.demoSubtitle")}</p>
          </div>

          <Card className="reveal-on-scroll glass-card border-primary/10 shadow-2xl shadow-primary/5">
            <CardContent className="p-6 sm:p-8">
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
                    <div className="relative inline-block group">
                      <img src={demoImagePreview} alt="Preview" className="h-28 w-28 object-cover rounded-lg border-2 border-primary/30" loading="lazy" />
                      <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="demo-image" className="flex flex-col items-center justify-center h-28 w-full border-2 border-dashed border-input rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/[0.03] transition-colors press-on-active">
                      <ImagePlus className="h-8 w-8 text-muted-foreground mb-1" />
                      <span className="text-sm text-muted-foreground">{t("indexPage.uploadHint")}</span>
                      <input id="demo-image" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                    </label>
                  )}
                  {imageError && <p className="text-sm text-destructive">{imageError}</p>}
                  {!demoImage && !imageError && <p className="text-xs text-muted-foreground">{t("indexPage.imageRequired")}</p>}
                </div>
                <Button type="submit" className="btn-magnetic w-full h-12 text-base shadow-lg shadow-primary/20" size="lg" disabled={generating || demoUsed || !demoImage}>
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t("indexPage.generatingAI")}</>
                  ) : demoUsed ? (
                    t("indexPage.demoUsed")
                  ) : (
                    <><Sparkles className="h-4 w-4" /> {t("indexPage.generateDemo")}</>
                  )}
                </Button>
                {demoUsed && (
                  <p className="text-center text-sm text-muted-foreground">
                    {t("indexPage.demoUsedMsg")}{" "}
                    <Link to="/register" className="text-primary underline font-medium">{t("indexPage.createAccountToGenerate")}</Link> {t("indexPage.toGenerateMore")}
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 7. PLANES ── */}
      <section id="pricing" className="py-20 lg:py-28 bg-muted/30 cv-auto">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-10 reveal-on-scroll">
            <Badge variant="secondary" className="mb-4">Precios</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight">{t("indexPage.plansTitle")}</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              {t("indexPage.plansSubtitle")}
            </p>
          </div>
          <div className="flex justify-center mb-10 reveal-on-scroll">
            <div className="inline-flex items-center gap-1 bg-card/80 backdrop-blur-md border border-border/40 rounded-xl p-1 shadow-sm">
              <button
                className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all", billingPeriod === "monthly" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground")}
                onClick={() => setBillingPeriod("monthly")}
              >
                {t("indexPage.monthly")}
              </button>
              <button
                className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", billingPeriod === "annual" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground")}
                onClick={() => setBillingPeriod("annual")}
              >
                {t("indexPage.annual")}
                <Badge className={cn("text-[10px] py-0 px-1.5 transition-colors", billingPeriod === "annual" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary")}>
                  {t("indexPage.annualDiscount")}
                </Badge>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, idx) => {
              const priceData = planPrices[idx];
              const price = billingPeriod === "annual" ? priceData.annualPrice : priceData.monthlyPrice;
              const monthlyEq = billingPeriod === "annual" && priceData.annualPrice > 0 ? Math.round(priceData.annualPrice / 12) : null;
              return (
              <div
                key={plan.name}
                className={cn(
                  "reveal-on-scroll relative rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1",
                  priceData.popular
                    ? "bg-card border-2 border-primary shadow-2xl shadow-primary/20 scale-100 lg:scale-105"
                    : "bg-card/60 backdrop-blur-md border border-border/40 hover:border-primary/30 hover:shadow-lg"
                )}
                style={{ transitionDelay: `${idx * 60}ms` }}
              >
                {priceData.popular && (
                  <>
                    <div aria-hidden className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/30 via-transparent to-primary/30 opacity-30 blur-md -z-10" />
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/30 gap-1.5 px-3 py-1">
                        <Star className="h-3 w-3 fill-current" />
                        {t("indexPage.mostPopular")}
                      </Badge>
                    </div>
                  </>
                )}
                <div className="text-center space-y-4">
                  <h3 className="font-display font-bold text-xl tracking-tight">{plan.name}</h3>
                  <div className="min-h-[80px] flex flex-col justify-center">
                    {price === 0 ? (
                      <span className="text-5xl font-bold font-display tracking-tight">{t("indexPage.free")}</span>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-5xl font-bold font-display tnum tracking-tight">${price.toLocaleString("es-CL")}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">/{billingPeriod === "annual" ? t("indexPage.perYear") : t("indexPage.perMonth")}</span>
                        {monthlyEq && (
                          <p className="text-xs text-primary font-medium mt-1">${monthlyEq.toLocaleString("es-CL")}/{t("indexPage.perMonth")}</p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="py-2 px-3 rounded-lg bg-primary/8 border border-primary/15">
                    <p className="text-sm font-semibold text-primary">{plan.landings}</p>
                  </div>
                </div>
                <ul className="text-left space-y-2.5 mt-6 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn("w-full h-11", priceData.popular && "btn-magnetic shadow-lg shadow-primary/20")}
                  variant={priceData.popular ? "default" : "outline"}
                  asChild
                >
                  <Link to="/register">{price === 0 ? t("indexPage.startFree") : t("indexPage.subscribe")}</Link>
                </Button>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 8. FAQ ── */}
      <section className="py-20 lg:py-28 cv-auto">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12 reveal-on-scroll">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight">{t("indexPage.faqTitle")}</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="group reveal-on-scroll overflow-hidden rounded-xl border border-border/40 bg-card/40 px-0 transition-all duration-300 hover:border-border hover:bg-card/70 data-[state=open]:border-primary/30 data-[state=open]:bg-card data-[state=open]:shadow-md data-[state=open]:shadow-primary/5"
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                <AccordionTrigger className="w-full px-5 py-5 text-left text-sm font-medium no-underline hover:no-underline sm:text-base [&>svg]:hidden">
                  <div className="flex w-full items-center justify-between gap-4">
                    <span>{faq.q}</span>
                    <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground transition-all duration-300 shrink-0 flex items-center justify-center group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground">
                      <span className="text-base leading-none transition-transform duration-300 group-data-[state=open]:rotate-180">⌄</span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 pt-0 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── 9. CTA FINAL ── */}
      <section className="py-20 lg:py-28 relative overflow-hidden cv-auto">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-accent/30" />
        <div aria-hidden className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-primary/20 blur-3xl rounded-full animate-glow-pulse" />

        <div className="container mx-auto px-4 max-w-4xl relative">
          <div className="reveal-on-scroll text-center glass-panel rounded-3xl border border-primary/20 px-6 py-12 sm:px-12 sm:py-16 shadow-2xl shadow-primary/10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 border border-primary/20">
              <Rocket className="h-3.5 w-3.5" />
              Empieza hoy
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-display tracking-tight mb-4 leading-tight">
              {t("indexPage.ctaTitle")}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto">
              {t("indexPage.ctaSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="btn-magnetic text-base px-10 h-12 group shadow-xl shadow-primary/30" asChild>
                <Link to="/register">
                  <Sparkles className="h-5 w-5" />
                  {t("indexPage.startFree")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-10 h-12 backdrop-blur-sm bg-card/50 border-border/60 lift-on-hover" asChild>
                <a href="#how">{t("indexPage.seeHow")}</a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-6 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Sin tarjeta de crédito · Cancela cuando quieras
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/40 py-12 bg-card/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
              <div className="flex items-center gap-2">
                <Logo size={28} className="rounded-lg" />
                <span className="font-display text-lg font-bold tracking-tight">
                  <span className="text-primary">Nex</span>sell
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <a href="#pricing" className="hover:text-foreground transition-colors">{t("indexPage.footerPricing")}</a>
                <a href="#how" className="hover:text-foreground transition-colors">Cómo funciona</a>
                <Link to="/login" className="hover:text-foreground transition-colors">{t("indexPage.login")}</Link>
                <Link to="/register" className="hover:text-foreground transition-colors">{t("indexPage.createAccount")}</Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://instagram.com/nexsellai" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 transition-all" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="https://x.com/nexsellai" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 transition-all" aria-label="X (Twitter)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://discord.gg/qg5AYq3BE" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 hover:scale-110 transition-all" aria-label="Discord">
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
