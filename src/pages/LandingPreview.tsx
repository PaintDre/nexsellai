import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Truck, Clock,
  Star, Quote, ChevronDown, ChevronUp, Lock,
} from "lucide-react";

interface PreviewData {
  blocks: any[];
  product: {
    name: string;
    category: string;
    price: number;
    target_audience: string;
    description: string | null;
  };
  imagePreview?: string | null;
}

const LandingPreview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PreviewData | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("nexsell_preview_data");
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">No hay landing generada para mostrar.</p>
        <Button variant="outline" onClick={() => navigate("/#demo")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al generador
        </Button>
      </div>
    );
  }

  const { blocks, product, imagePreview } = data;
  const getBlock = (type: string) => blocks.find((b: any) => b.type === type);
  const getBlocks = (type: string) => blocks.filter((b: any) => b.type === type);

  const hero = getBlock("hero");
  const benefits = getBlock("benefits");
  const features = getBlock("features");
  const testimonials = getBlock("testimonials");
  const objections = getBlock("objections");
  const offer = getBlock("offer");
  const urgency = getBlock("urgency");
  const cta = getBlock("cta");
  const guarantee = getBlock("guarantee");
  const faq = getBlock("faq");
  const microcopy = getBlock("microcopy");

  const formattedPrice = `$${product.price.toLocaleString("es-CL")}`;

  const renderContent = (content: any) => {
    if (Array.isArray(content)) {
      return (
        <ul className="space-y-3">
          {content.map((item: string, i: number) => (
            <li key={i} className="flex items-start gap-3 text-base">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }
    return <p className="text-lg leading-relaxed">{content}</p>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-muted/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-12 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/#demo")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver y editar
          </Button>
          <Badge variant="secondary" className="text-xs">Vista previa — Demo</Badge>
        </div>
      </div>

      {/* === HERO === */}
      {hero && (
        <section className="py-16 lg:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight leading-tight">
                  {hero.title}
                </h1>
                {hero.content && (
                  <div className="text-lg text-muted-foreground leading-relaxed">
                    {renderContent(hero.content)}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button size="lg" className="text-lg px-10 py-6">
                    Comprar ahora — {formattedPrice}
                  </Button>
                </div>
              </div>
              {imagePreview && (
                <div className="flex justify-center">
                  <img
                    src={imagePreview}
                    alt={product.name}
                    className="rounded-2xl shadow-2xl max-h-96 object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* === BENEFITS === */}
      {benefits && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-10">
              {benefits.title}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {Array.isArray(benefits.content) ? (
                benefits.content.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-card shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-base">{item}</p>
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-center text-muted-foreground">{benefits.content}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* === FEATURES === */}
      {features && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-10">
              {features.title}
            </h2>
            {renderContent(features.content)}
          </div>
        </section>
      )}

      {/* === TESTIMONIALS === */}
      {testimonials && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-10">
              {testimonials.title}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {Array.isArray(testimonials.content) ? (
                testimonials.content.map((item: string, i: number) => (
                  <div key={i} className="p-6 rounded-xl bg-card shadow-sm border relative">
                    <Quote className="h-8 w-8 text-primary/20 absolute top-4 right-4" />
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed italic text-muted-foreground">{item}</p>
                  </div>
                ))
              ) : (
                <p className="col-span-3 text-center text-muted-foreground italic">{testimonials.content}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* === OBJECTIONS === */}
      {objections && (
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-10">
              {objections.title}
            </h2>
            {Array.isArray(objections.content) ? (
              <div className="space-y-4">
                {objections.content.map((item: string, i: number) => (
                  <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-card shadow-sm border">
                    <ShieldCheck className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                    <p className="text-base">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">{objections.content}</p>
            )}
          </div>
        </section>
      )}

      {/* === OFFER / URGENCY === */}
      {(offer || urgency) && (
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 max-w-3xl text-center space-y-6">
            {urgency && (
              <Badge className="bg-destructive text-destructive-foreground text-sm px-4 py-1.5">
                <Clock className="h-4 w-4 mr-1.5" />
                {typeof urgency.content === "string" ? urgency.content : urgency.title}
              </Badge>
            )}
            {offer && (
              <>
                <h2 className="text-3xl md:text-4xl font-bold font-display">{offer.title}</h2>
                {offer.content && (
                  <div className="text-lg text-muted-foreground">{renderContent(offer.content)}</div>
                )}
              </>
            )}
            <div className="pt-4">
              <Button size="lg" className="text-lg px-12 py-6">
                Comprar ahora — {formattedPrice}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* === GUARANTEE === */}
      {guarantee && (
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/20">
              <ShieldCheck className="h-8 w-8 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-display font-bold text-lg mb-1">{guarantee.title}</h3>
                <p className="text-muted-foreground">{typeof guarantee.content === "string" ? guarantee.content : ""}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === FAQ === */}
      {faq && Array.isArray(faq.content) && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-center mb-10">
              {faq.title}
            </h2>
            <div className="space-y-3">
              {faq.content.map((item: string, i: number) => (
                <button
                  key={i}
                  className="w-full text-left p-5 rounded-xl bg-card shadow-sm border"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item}</span>
                    {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === MICROCOPY / TRUST === */}
      {microcopy && (
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4" /> Envío seguro</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Compra protegida</span>
              <span className="flex items-center gap-1.5"><Lock className="h-4 w-4" /> Pago 100% seguro</span>
              {typeof microcopy.content === "string" && (
                <span>{microcopy.content}</span>
              )}
              {Array.isArray(microcopy.content) && microcopy.content.map((item: string, i: number) => (
                <span key={i}>{item}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* === FINAL CTA === */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center space-y-6">
          {cta ? (
            <>
              <h2 className="text-3xl md:text-4xl font-bold font-display">{cta.title}</h2>
              {cta.content && <p className="text-lg text-muted-foreground">{typeof cta.content === "string" ? cta.content : ""}</p>}
            </>
          ) : (
            <h2 className="text-3xl md:text-4xl font-bold font-display">¿Listo para probarlo?</h2>
          )}
          <Button size="lg" className="text-lg px-12 py-6">
            Comprar ahora — {formattedPrice}
          </Button>
        </div>
      </section>

      {/* === DEMO EXPORT GATE === */}
      <section className="py-12 bg-muted/50 border-t">
        <div className="container mx-auto px-4 max-w-xl text-center space-y-4">
          <p className="text-muted-foreground">
            Para exportar o descargar esta landing, crea una cuenta.
          </p>
          <Button size="lg" asChild>
            <Link to="/register">
              <ArrowRight className="h-4 w-4 mr-2" /> Crear cuenta y exportar
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPreview;
