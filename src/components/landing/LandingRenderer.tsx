import { useState } from "react";
import {
  CheckCircle2, ShieldCheck, Star, Quote, Clock,
  ChevronDown, ChevronUp, Zap, Gift, Award,
} from "lucide-react";
import TrustBadges from "./TrustBadges";
import { themes, type LandingTheme, type ThemeConfig } from "./themes";

interface Block {
  type: string;
  title?: string;
  content?: string | string[];
}

interface LandingRendererProps {
  blocks: Block[];
  product: {
    name: string;
    price: number;
    category?: string;
    target_audience?: string;
    description?: string | null;
  } | null;
  imagePreview?: string | null;
  theme?: LandingTheme;
}

const LandingRenderer = ({ blocks, product, imagePreview, theme = "clean" }: LandingRendererProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const t = themes[theme];

  const getBlock = (type: string) => blocks.find((b) => b.type === type);
  const price = product?.price ?? 0;
  const formattedPrice = `$${price.toLocaleString("es-CL")}`;
  const productName = product?.name ?? "Producto";

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

  const microItems: string[] = microcopy
    ? Array.isArray(microcopy.content) ? microcopy.content
      : typeof microcopy.content === "string" ? [microcopy.content]
      : []
    : [];

  const CTAButton = ({ className = "" }: { className?: string }) => (
    <button
      className={`inline-flex items-center justify-center px-10 py-4 text-lg font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${t.ctaBg} ${t.ctaText} ${t.ctaHover} ${className}`}
    >
      Comprar ahora — {formattedPrice}
    </button>
  );

  const CTAWithTrust = ({ className = "" }: { className?: string }) => (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <CTAButton />
      <TrustBadges colorClass={t.trustColor} extraItems={microItems} />
    </div>
  );

  const SectionTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <h2 className={`text-3xl md:text-4xl font-bold tracking-tight text-center mb-10 ${t.headingColor} ${className}`}
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {children}
    </h2>
  );

  const featureIcons = [Zap, Gift, Award, CheckCircle2, Star, ShieldCheck];

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ═══ HERO ═══ */}
      {hero && (
        <section className={`py-20 md:py-28 ${t.heroBg}`}>
          <div className="mx-auto max-w-6xl px-6">
            <div className={`grid ${imagePreview ? "lg:grid-cols-2" : ""} gap-12 items-center`}>
              <div className="space-y-8">
                <h1
                  className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] ${t.heroText}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {hero.title}
                </h1>
                {hero.content && (
                  <p className={`text-lg md:text-xl leading-relaxed max-w-xl ${theme === "bold" ? "text-gray-300" : t.bodyColor}`}>
                    {typeof hero.content === "string" ? hero.content : ""}
                  </p>
                )}
                <CTAWithTrust className="items-start" />
              </div>
              {imagePreview && (
                <div className="flex justify-center lg:justify-end">
                  <img
                    src={imagePreview}
                    alt={productName}
                    className="rounded-2xl shadow-2xl max-h-[480px] object-cover w-full max-w-md"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BENEFITS ═══ */}
      {benefits && (
        <section className={`py-16 md:py-24 ${t.sectionAltBg}`}>
          <div className="mx-auto max-w-5xl px-6">
            <SectionTitle>{benefits.title || "Beneficios"}</SectionTitle>
            {Array.isArray(benefits.content) ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {benefits.content.map((item: string, i: number) => {
                  const Icon = featureIcons[i % featureIcons.length];
                  return (
                    <div key={i} className={`flex items-start gap-4 p-6 rounded-xl ${t.cardBg} border ${t.cardBorder} shadow-sm`}>
                      <div className={`h-10 w-10 rounded-lg ${t.accentBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${t.headingColor}`} />
                      </div>
                      <p className={`text-base leading-relaxed ${t.bodyColor}`}>{item}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`text-center text-lg ${t.bodyColor}`}>{benefits.content}</p>
            )}
          </div>
        </section>
      )}

      {/* ═══ FEATURES ═══ */}
      {features && (
        <section className={`py-16 md:py-24 ${t.sectionBg}`}>
          <div className="mx-auto max-w-4xl px-6">
            <SectionTitle>{features.title || "Características"}</SectionTitle>
            {Array.isArray(features.content) ? (
              <ul className="space-y-4">
                {features.content.map((item: string, i: number) => (
                  <li key={i} className={`flex items-start gap-4 text-base ${t.bodyColor}`}>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-lg leading-relaxed ${t.bodyColor}`}>{features.content}</p>
            )}
          </div>
        </section>
      )}

      {/* ═══ TESTIMONIALS ═══ */}
      {testimonials && (
        <section className={`py-16 md:py-24 ${t.sectionAltBg}`}>
          <div className="mx-auto max-w-5xl px-6">
            <SectionTitle>{testimonials.title || "Lo que dicen nuestros clientes"}</SectionTitle>
            {Array.isArray(testimonials.content) ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {testimonials.content.map((item: string, i: number) => (
                  <div key={i} className={`p-6 rounded-xl ${t.cardBg} border ${t.cardBorder} shadow-sm relative`}>
                    <Quote className="h-8 w-8 opacity-10 absolute top-4 right-4" />
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${t.starColor}`} />
                      ))}
                    </div>
                    <p className={`text-sm leading-relaxed italic ${t.mutedColor}`}>"{item}"</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full ${t.accentBg} flex items-center justify-center text-xs font-bold ${t.headingColor}`}>
                        {String.fromCharCode(65 + (i % 26))}
                      </div>
                      <span className={`text-xs font-medium ${t.mutedColor}`}>Cliente verificado</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center italic ${t.mutedColor}`}>{testimonials.content}</p>
            )}
          </div>
        </section>
      )}

      {/* ═══ OBJECTIONS ═══ */}
      {objections && (
        <section className={`py-16 md:py-24 ${t.sectionBg}`}>
          <div className="mx-auto max-w-3xl px-6">
            <SectionTitle>{objections.title || "¿Aún tienes dudas?"}</SectionTitle>
            {Array.isArray(objections.content) ? (
              <div className="space-y-3">
                {objections.content.map((item: string, i: number) => (
                  <div key={i} className={`flex items-start gap-4 p-5 rounded-xl ${t.cardBg} border ${t.cardBorder}`}>
                    <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    <p className={`text-base ${t.bodyColor}`}>{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center ${t.bodyColor}`}>{objections.content}</p>
            )}
          </div>
        </section>
      )}

      {/* ═══ FAQ ═══ */}
      {faq && Array.isArray(faq.content) && (
        <section className={`py-16 md:py-24 ${t.sectionAltBg}`}>
          <div className="mx-auto max-w-2xl px-6">
            <SectionTitle>{faq.title || "Preguntas frecuentes"}</SectionTitle>
            <div className="space-y-2">
              {faq.content.map((item: string, i: number) => (
                <button
                  key={i}
                  className={`w-full text-left p-5 rounded-xl ${t.cardBg} border ${t.cardBorder} transition-all`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className={`font-medium text-sm ${t.headingColor}`}>{item}</span>
                    {openFaq === i
                      ? <ChevronUp className={`h-4 w-4 shrink-0 ${t.mutedColor}`} />
                      : <ChevronDown className={`h-4 w-4 shrink-0 ${t.mutedColor}`} />
                    }
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ OFFER / URGENCY ═══ */}
      {(offer || urgency) && (
        <section className={`py-16 md:py-24 ${t.accentBg}`}>
          <div className="mx-auto max-w-3xl px-6 text-center space-y-6">
            {urgency && (
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${t.urgencyBg} ${t.urgencyText}`}>
                <Clock className="h-4 w-4" />
                {typeof urgency.content === "string" ? urgency.content : urgency.title}
              </span>
            )}
            {offer && (
              <>
                <h2
                  className={`text-3xl md:text-4xl font-bold tracking-tight ${t.headingColor}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {offer.title}
                </h2>
                {offer.content && (
                  <p className={`text-lg ${t.bodyColor}`}>
                    {typeof offer.content === "string" ? offer.content : ""}
                  </p>
                )}
              </>
            )}
            <CTAWithTrust />
          </div>
        </section>
      )}

      {/* ═══ GUARANTEE ═══ */}
      {guarantee && (
        <section className={`py-12 md:py-16 ${t.sectionBg}`}>
          <div className="mx-auto max-w-2xl px-6">
            <div className={`flex items-start gap-5 p-6 rounded-2xl ${t.guaranteeBg} border ${t.guaranteeBorder}`}>
              <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0 mt-1" />
              <div>
                <h3
                  className={`font-bold text-lg mb-1 ${t.headingColor}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {guarantee.title || "Garantía"}
                </h3>
                <p className={t.bodyColor}>
                  {typeof guarantee.content === "string" ? guarantee.content : ""}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ FINAL CTA ═══ */}
      <section className={`py-20 md:py-28 ${t.sectionAltBg}`}>
        <div className="mx-auto max-w-2xl px-6 text-center space-y-8">
          <h2
            className={`text-3xl md:text-4xl font-bold tracking-tight ${t.headingColor}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {cta?.title || "¿Listo para probarlo?"}
          </h2>
          {cta?.content && (
            <p className={`text-lg ${t.bodyColor}`}>
              {typeof cta.content === "string" ? cta.content : ""}
            </p>
          )}
          <CTAWithTrust />
        </div>
      </section>
    </div>
  );
};

export default LandingRenderer;
