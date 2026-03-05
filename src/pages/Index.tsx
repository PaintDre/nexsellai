import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LandingExamplesGallery } from "@/components/landing/LandingExamplesGallery";
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
  Monitor, Store, FilePlus, Send, ImagePlus, X,
} from "lucide-react";

const categories = ["home", "fitness", "beauty", "gadget", "pets"];

const faqs = [
  { q: "¿Necesito saber programar?", a: "No. Nexsell genera todo el contenido listo para usar. Solo describe tu producto y la IA hace el resto." },
  { q: "¿En qué idioma se generan las landings?", a: "Todas las landings se generan en español optimizado para ecommerce chileno, con precios en CLP." },
  { q: "¿Puedo probar sin crear una cuenta?", a: "Sí. Puedes generar 1 landing demo sin registrarte. Para exportar o descargar necesitas crear una cuenta." },
  { q: "¿Cuántas landings puedo generar?", a: "Depende de tu plan: Free (1), Starter (10), Pro (100). Cada plan tiene características adicionales de persuasión." },
  { q: "¿Puedo editar la landing después?", a: "Sí. Una vez generada puedes editar los bloques de texto y ajustar el contenido a tu gusto." },
];

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Demo form state
  const [demoName, setDemoName] = useState("");
  const [demoCategory, setDemoCategory] = useState("home");
  const [demoPrice, setDemoPrice] = useState("");
  const [demoDescription, setDemoDescription] = useState("");
  const [demoAudience, setDemoAudience] = useState("");
  const [generating, setGenerating] = useState(false);
  
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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

      // Store in demo_landings
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
          <span className="font-display text-xl font-bold tracking-tight">
            <span className="text-primary">Nex</span>sell
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/login">Iniciar sesión</Link></Button>
            <Button asChild><Link to="/register">Crear cuenta</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6 text-sm px-4 py-1">
            Generador de Landing Pages con IA
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight leading-tight">
            Crea landing pages que
            <span className="text-primary"> venden de verdad</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Genera landing pages de alta conversión para tus productos de ecommerce en segundos. 
            Sin código. Optimizadas para dropshipping en Chile.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8" asChild>
              <a href="#demo"><Sparkles className="h-5 w-5 mr-2" /> Probar gratis</a>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <a href="#pricing">Ver planes</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-12">
            ¿Por qué usar Nexsell?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: Zap, title: "Rápido", desc: "Genera una landing completa en menos de 30 segundos. Sin diseñar, sin programar." },
              { icon: ShoppingCart, title: "Optimizado para ventas", desc: "Estructura probada de 7 secciones que maximiza conversiones en ecommerce." },
              { icon: Code2, title: "Sin código", desc: "Solo describe tu producto y la IA crea todo el contenido persuasivo listo para usar." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="text-center border-none bg-card shadow-sm">
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
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

      {/* How it works - 4 steps */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">Cómo funciona</h2>
          <p className="text-muted-foreground mb-12 max-w-xl mx-auto">De producto a landing page lista para vender en 4 pasos simples</p>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto relative">
            {[
              { icon: Upload, step: "1", title: "Sube tu producto", desc: "Agrega fotos, nombre, precio y descripción de tu producto." },
              { icon: Wand2, step: "2", title: "La IA lo analiza", desc: "Nuestro motor entiende tu producto, audiencia y categoría." },
              { icon: ImagePlus, step: "3", title: "Genera todo", desc: "Landing completa con copy persuasivo, banners e imágenes IA.", badges: ["Landing", "Banners", "Secciones"] },
              { icon: Download, step: "4", title: "Exporta y publica", desc: "Descarga HTML listo para Shopify u otra plataforma." },
            ].map(({ icon: Icon, step, title, desc, badges }, idx) => (
              <div key={step} className="relative flex flex-col items-center">
                {/* Connector line */}
                {idx < 3 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border z-0">
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
                <p className="text-muted-foreground text-sm mb-3">{desc}</p>
                {badges && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {badges.map((b) => (
                      <Badge key={b} variant="secondary" className="text-xs">{b}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shopify Tutorial */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-4">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">Integración Shopify</Badge>
            <h2 className="text-3xl md:text-4xl font-bold font-display">
              Cómo subir tu landing a Shopify en menos de 2 minutos
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              No necesitas saber programar. Solo descarga tu landing generada y súbela a tu tienda Shopify en pocos pasos.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[
              { icon: Monitor, step: "1", title: "Abre tu panel de Shopify", desc: "Inicia sesión en tu cuenta de Shopify y accede al panel de administración." },
              { icon: Store, step: "2", title: "Online Store → Pages", desc: "En el menú lateral, ve a Online Store y luego haz clic en Pages." },
              { icon: FilePlus, step: "3", title: "Crea una nueva página", desc: "Haz clic en 'Add page' para crear una página nueva en tu tienda." },
              { icon: Send, step: "4", title: "Pega el HTML y publica", desc: "Pega el código HTML de tu landing generada en el editor y haz clic en Publicar." },
            ].map(({ icon: Icon, step, title, desc }) => (
              <Card key={step} className="text-center border-none bg-card shadow-sm">
                <CardContent className="pt-8 pb-6 px-5">
                  <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-display font-bold">
                    {step}
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-base mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>


          <div className="mt-16 text-center">
            <h3 className="text-2xl md:text-3xl font-bold font-display mb-4">
              Crea tu primera landing y publícala en Shopify hoy
            </h3>
            <Button size="lg" className="text-base px-8" asChild>
              <a href="#demo"><Sparkles className="h-5 w-5 mr-2" /> Probar generador gratis</a>
            </Button>
          </div>
        </div>
      </section>
      <section id="demo" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold font-display">Prueba el generador</h2>
            <p className="text-muted-foreground mt-2">Genera 1 landing gratis sin crear cuenta</p>
          </div>

          <Card>
              <CardContent className="p-6">
                <form onSubmit={handleDemo} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
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
                  <div className="grid md:grid-cols-2 gap-4">
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

        {/* Example gallery */}
        <LandingExamplesGallery />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-12">Planes y Precios</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Free", price: 0, landings: "1 landing", features: ["1 ángulo / 1 hook", "Exportar HTML básico", "Listo para Shopify"] },
              { name: "Starter", price: 7990, landings: "10 landings / mes", features: ["3 hooks por producto", "Objeciones básicas", "Urgencia editable", "FAQs", "Exportar HTML + CSS"], popular: true },
              { name: "Pro", price: 14990, landings: "100 landings / mes", features: ["Múltiples ángulos psicológicos", "Hooks para ads", "Variantes de CTA", "Bundles y comparativas", "Microcopys de checkout", "Exportar ZIP completo"] },
            ].map((plan) => (
              <Card key={plan.name} className={plan.popular ? "border-primary shadow-lg relative" : ""}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Más popular</Badge>
                  </div>
                )}
                <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                  <h3 className="font-display font-bold text-xl">{plan.name}</h3>
                  <div>
                    {plan.price === 0 ? (
                      <span className="text-4xl font-bold font-display">Gratis</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold font-display">${plan.price.toLocaleString("es-CL")}</span>
                        <span className="text-muted-foreground">/mes</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm font-medium text-primary">{plan.landings}</p>
                  <ul className="text-left space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                    <Link to="/register">{plan.price === 0 ? "Comenzar gratis" : "Suscribirse"}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-12">Preguntas Frecuentes</h2>
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

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
            Empieza a generar landings hoy
          </h2>
          <p className="text-muted-foreground mb-8">
            Crea tu cuenta gratis y genera tu primera landing page en menos de 1 minuto.
          </p>
          <Button size="lg" className="text-base px-10" asChild>
            <Link to="/register"><Sparkles className="h-5 w-5 mr-2" /> Crear cuenta gratis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Nexsell. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default Index;
