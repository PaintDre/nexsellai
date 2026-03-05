import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BannerShowcaseGallery } from "@/components/landing/BannerShowcaseGallery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Zap, Code2, ShoppingCart, ArrowRight, Loader2,
  CheckCircle2, Upload, Wand2, Download, ChevronDown, ChevronUp,
  ImagePlus, X, XCircle, Image, FileCode, Layers,
} from "lucide-react";

const categories = ["home", "fitness", "beauty", "gadget", "pets"];

const faqs = [
  { q: "¿Necesito saber programar?", a: "No. Nexsell genera todo el contenido listo para usar. Solo describe tu producto y la IA hace el resto." },
  { q: "¿En qué idioma se generan las landings?", a: "Todas las landings se generan en español optimizado para ecommerce chileno, con precios en CLP." },
  { q: "¿Puedo probar sin crear una cuenta?", a: "Sí. Puedes generar 1 landing demo sin registrarte. Para exportar o descargar necesitas crear una cuenta." },
  { q: "¿Cuántas landings puedo generar?", a: "Depende de tu plan: Free (1), Starter (10), Pro (100). Cada plan tiene características adicionales de persuasión." },
  { q: "¿Puedo editar la landing después?", a: "Sí. Una vez generada puedes editar los bloques de texto y ajustar el contenido a tu gusto." },
  { q: "¿Cómo subo mi landing a Shopify?", a: "Exporta el HTML generado, ve a tu panel de Shopify → Online Store → Pages → Add page, pega el código y publica. ¡Listo en 2 minutos!" },
];

const problems = [
  { text: "Crear páginas de venta y banners toma horas", detail: "Escribir copy, armar estructura, buscar plantillas..." },
  { text: "Contratar un diseñador o copywriter es caro", detail: "Un freelancer cobra $50-200 USD por página" },
  { text: "Las plantillas genéricas no convierten visitas en ventas", detail: "Sin copy persuasivo ni estructura de conversión" },
];

const solutions = [
  { text: "Genera landings y banners en segundos con IA", detail: "Landing completa con IA en un clic" },
  { text: "Sin costos extras de diseño ni redacción", detail: "Todo incluido en tu plan desde $0" },
  { text: "Copy y estructura optimizados para conversión", detail: "Estructura AIDA y técnicas de persuasión" },
];

const benefits = [
  { icon: Zap, title: "Landings de alta conversión", desc: "Genera páginas de venta con estructura optimizada para que tus visitantes compren." },
  { icon: ShoppingCart, title: "Banners listos para anuncios", desc: "Crea banners promocionales para Facebook, Instagram y Google Ads." },
  { icon: Code2, title: "Prueba diferentes ángulos", desc: "Genera múltiples versiones con distintos hooks y enfoques de venta." },
  { icon: FileCode, title: "Exporta listo para tu tienda", desc: "Descarga HTML listo para Shopify, WooCommerce o cualquier plataforma." },
  { icon: Image, title: "Sin código ni diseño", desc: "Solo describe tu producto. La IA escribe el copy y arma la página." },
  { icon: Layers, title: "Multi-producto", desc: "Administra todos tus productos y genera contenido para cada uno." },
];

const steps = [
  { icon: Upload, step: "1", title: "Sube tu producto", desc: "Agrega imágenes, nombre, precio y descripción de tu producto." },
  { icon: Wand2, step: "2", title: "La IA analiza todo", desc: "Nuestro motor identifica los mejores ángulos de venta para tu producto." },
  { icon: ImagePlus, step: "3", title: "Genera landings y banners", desc: "Obtén páginas de venta y banners con copy persuasivo al instante." },
  { icon: Download, step: "4", title: "Publica y vende", desc: "Exporta el HTML a tu tienda y empieza a recibir ventas." },
];

const plans = [
  { name: "Free", monthlyPrice: 0, annualPrice: 0, landings: "1 landing", features: ["1 hook de venta", "2 banners / mes", "Preview de landing", "Exportar HTML básico"], popular: false },
  { name: "Starter", monthlyPrice: 14990, annualPrice: 149900, landings: "10 landings / mes", features: ["3 hooks por producto", "30 banners / mes", "Imágenes IA en landings", "Objeciones y urgencia", "FAQs editables", "Exportar HTML + CSS"], popular: true },
  { name: "Pro", monthlyPrice: 34990, annualPrice: 349900, landings: "100 landings / mes", features: ["Ángulos psicológicos ilimitados", "150 banners / mes", "Hooks optimizados para ads", "Variantes de CTA", "Bundles y comparativas", "Microcopys de checkout", "Exportar ZIP completo"], popular: false },
];

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setImageError("La imagen no puede superar los 5MB.");
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
      toast({ title: "Demo ya utilizado", description: "Crea una cuenta para seguir generando.", variant: "destructive" });
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

      toast({ title: "¡Landing demo generada!" });
      navigate("/landing/preview");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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
            <img src="/logo-ns.png" alt="Nexsell" className="h-8 w-8 object-contain" />
            <span className="font-display text-xl font-bold tracking-tight">
              <span className="text-primary">Nex</span>sell
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/login">Iniciar sesión</Link></Button>
            <Button asChild><Link to="/register">Crear cuenta</Link></Button>
          </div>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="py-24 lg:py-40 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text */}
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-6 text-sm px-4 py-1">
                Generador de Landing Pages con IA
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight leading-tight">
                Crea landings y banners que
                <span className="text-primary"> venden tu producto en minutos</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Nexsell usa inteligencia artificial para generar páginas de venta y banners optimizados para ecommerce y dropshipping.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="text-base px-8 w-full sm:w-auto" asChild>
                  <a href="#demo"><Sparkles className="h-5 w-5 mr-2" /> Probar gratis</a>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 w-full sm:w-auto" asChild>
                  <a href="#how">Ver cómo funciona</a>
                </Button>
              </div>
            </div>

            {/* Mockup */}
            <div className="relative mx-auto lg:mx-0 w-full max-w-md lg:max-w-none">
              <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
                {/* Browser bar */}
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
                {/* Fake landing content */}
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
                      <span className="text-xs font-semibold text-primary-foreground">Comprar</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="h-16 rounded bg-muted/80" />
                    <div className="h-16 rounded bg-muted/80" />
                    <div className="h-16 rounded bg-muted/80" />
                  </div>
                </div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                IA ✨
              </div>
              <div className="absolute -bottom-3 -left-3 bg-card border text-xs font-medium px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> 30 seg
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. PROBLEMA / SOLUCIÓN ── */}
      <section className="py-20 lg:py-28 bg-muted/50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-4">
            Crear páginas de venta no debería ser tan difícil
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            Vender online no debería requerir horas de diseño ni presupuestos altos
          </p>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Problems */}
            <div className="space-y-5">
              <h3 className="font-display font-semibold text-lg text-destructive flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5" /> Sin Nexsell
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

            {/* Solutions */}
            <div className="space-y-5">
              <h3 className="font-display font-semibold text-lg text-primary flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5" /> Con Nexsell
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
            Todo lo que necesitas para vender más
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            Herramientas diseñadas para convertir visitantes en compradores
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border bg-card hover:shadow-md transition-shadow">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. CÓMO FUNCIONA ── */}
      <section id="how" className="py-20 lg:py-28 bg-muted/50">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Cómo funciona</h2>
          <p className="text-muted-foreground mb-14 max-w-xl mx-auto">De producto a página de venta lista en 4 pasos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto relative">
            {steps.map(({ icon: Icon, step, title, desc }, idx) => (
              <div key={step} className="relative flex flex-col items-center">
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border z-0">
                    <ArrowRight className="absolute -right-2 -top-[7px] h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mb-4 text-2xl font-display font-bold relative z-10">
                  {step}
                </div>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. EJEMPLOS ── */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-4">
            Mira lo que puedes crear
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            Landings y banners generados con Nexsell en segundos
          </p>
          <BannerShowcaseGallery />
        </div>
      </section>

      {/* ── 6. DEMO GENERATOR ── */}
      <section id="demo" className="py-20 lg:py-28 bg-muted/50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">Prueba gratis</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-display">Prueba el generador</h2>
            <p className="text-muted-foreground mt-2">Genera 1 landing gratis sin crear cuenta</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleDemo} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="demo-name">Nombre del producto *</Label>
                    <Input id="demo-name" value={demoName} onChange={(e) => setDemoName(e.target.value)} placeholder="Ej: Masajeador Cervical Pro" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={demoCategory} onValueChange={setDemoCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="demo-price">Precio CLP</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <Input id="demo-price" type="number" value={demoPrice} onChange={(e) => setDemoPrice(e.target.value)} className="pl-7" placeholder="19990" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-audience">Público objetivo</Label>
                    <Input id="demo-audience" value={demoAudience} onChange={(e) => setDemoAudience(e.target.value)} placeholder="Ej: Mujeres 25-45, oficina" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-desc">Descripción (opcional)</Label>
                  <Textarea id="demo-desc" value={demoDescription} onChange={(e) => setDemoDescription(e.target.value)} placeholder="Detalles del producto..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Imagen del producto *</Label>
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
                      <span className="text-sm text-muted-foreground">Sube una imagen (JPG, PNG, WEBP · máx 5MB)</span>
                      <input id="demo-image" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
                    </label>
                  )}
                  {imageError && <p className="text-sm text-destructive">{imageError}</p>}
                  {!demoImage && !imageError && <p className="text-xs text-muted-foreground">Debes subir una imagen para generar la landing.</p>}
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={generating || demoUsed || !demoImage}>
                  {generating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generando con IA...</>
                  ) : demoUsed ? (
                    "Demo ya utilizado — Crea una cuenta"
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Generar Landing Demo</>
                  )}
                </Button>
                {demoUsed && (
                  <p className="text-center text-sm text-muted-foreground">
                    Ya usaste tu demo gratis.{" "}
                    <Link to="/register" className="text-primary underline">Crea una cuenta</Link> para generar más.
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
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-4">Planes y Precios</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
            Elige el plan que mejor se adapte a tu negocio
          </p>
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-3 bg-muted rounded-lg p-1">
              <button
                className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors", billingPeriod === "monthly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                onClick={() => setBillingPeriod("monthly")}
              >
                Mensual
              </button>
              <button
                className={cn("px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2", billingPeriod === "annual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                onClick={() => setBillingPeriod("annual")}
              >
                Anual <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">-2 meses</Badge>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => {
              const price = billingPeriod === "annual" ? plan.annualPrice : plan.monthlyPrice;
              const monthlyEq = billingPeriod === "annual" && plan.annualPrice > 0 ? Math.round(plan.annualPrice / 12) : null;
              return (
              <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg relative" : ""}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Más popular</Badge>
                  </div>
                )}
                <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                  <h3 className="font-display font-bold text-xl">{plan.name}</h3>
                  <div>
                    {price === 0 ? (
                      <span className="text-4xl font-bold font-display">Gratis</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold font-display">${price.toLocaleString("es-CL")}</span>
                        <span className="text-muted-foreground">/{billingPeriod === "annual" ? "año" : "mes"}</span>
                        {monthlyEq && (
                          <p className="text-sm text-muted-foreground mt-1">${monthlyEq.toLocaleString("es-CL")}/mes</p>
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
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                    <Link to="/register">{price === 0 ? "Comenzar gratis" : "Suscribirse"}</Link>
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
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-14">Preguntas Frecuentes</h2>
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
            Crea tu primera landing en minutos
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Regístrate gratis y genera tu primera página de venta con inteligencia artificial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-10 w-full sm:w-auto" asChild>
              <Link to="/register"><Sparkles className="h-5 w-5 mr-2" /> Comenzar gratis</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-10 w-full sm:w-auto" asChild>
              <a href="#how">Ver cómo funciona</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-card">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="font-display text-lg font-bold tracking-tight">
              <span className="text-primary">Nex</span>sell
            </span>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#pricing" className="hover:text-foreground transition-colors">Precios</a>
              <Link to="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
              <Link to="/register" className="hover:text-foreground transition-colors">Crear cuenta</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Nexsell
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
