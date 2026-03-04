import { useState } from "react";
import {
  CheckCircle2, ShieldCheck, Star, Quote, Clock,
  ChevronDown, ChevronUp, Zap, Gift, Award,
  Package, BarChart3, Layers,
} from "lucide-react";
import TrustBadges from "./TrustBadges";
import { themes, type LandingTheme, type ThemeConfig } from "./themes";

interface Block {
  type: string;
  title?: string;
  content?: string | string[] | Array<{ q: string; a: string }>;
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
  const comparison = getBlock("comparison");
  const bundles = getBlock("bundles");

  const microItems: string[] = microcopy
    ? Array.isArray(microcopy.content) ? (microcopy.content as string[])
      : typeof microcopy.content === "string" ? [microcopy.content]
      : []
    : [];

  // Determine if a section is "alt" (dark in bold theme)
  const isAltSection = (bg: string) => bg === t.sectionAltBg;

  const getHeading = (alt: boolean) => alt ? t.sectionAltHeading : t.headingColor;
  const getBody = (alt: boolean) => alt ? t.sectionAltBody : t.bodyColor;
  const getMuted = (alt: boolean) => alt ? t.sectionAltMuted : t.mutedColor;
  const getCard = (alt: boolean) => alt ? t.sectionAltCardBg : t.cardBg;
  const getCardBorder = (alt: boolean) => alt ? t.sectionAltCardBorder : t.cardBorder;

  const CTAButton = ({ className = "" }: { className?: string }) => (
    <button
      className={`inline-flex items-center justify-center px-10 py-4 text-lg font-bold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 animate-[pulse-glow_2s_ease-in-out_infinite] ${t.ctaBg} ${t.ctaText} ${t.ctaHover} ${className}`}
    >
      Comprar ahora — {formattedPrice}
    </button>
  );

  const CTAWithTrust = ({ className = "", trustColor }: { className?: string; trustColor?: string }) => (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <CTAButton />
      <TrustBadges colorClass={trustColor || t.trustColor} extraItems={microItems} />
    </div>
  );

  const SectionTitle = ({ children, className = "", alt = false }: { children: React.ReactNode; className?: string; alt?: boolean }) => (
    <h2 className={`text-3xl md:text-4xl font-bold tracking-tight text-center mb-10 ${getHeading(alt)} ${className}`}
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      {children}
    </h2>
  );

  const featureIcons = [Zap, Gift, Award, CheckCircle2, Star, ShieldCheck];

  // Parse FAQ items - support both string[] and {q,a}[]
  const parseFaqItems = (content: Block["content"]): Array<{ q: string; a: string }> => {
    if (!Array.isArray(content)) return [];
    return content.map((item) => {
      if (typeof item === "string") {
        return { q: item, a: "" };
      }
      if (typeof item === "object" && item !== null && "q" in item) {
        return { q: (item as any).q, a: (item as any).a || "" };
      }
      return { q: String(item), a: "" };
    });
  };

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
                <CTAWithTrust className="items-start" trustColor={theme === "bold" ? "text-gray-500" : undefined} />
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
            <SectionTitle alt>{benefits.title || "Beneficios"}</SectionTitle>
            {Array.isArray(benefits.content) ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {(benefits.content as string[]).map((item, i) => {
                  const Icon = featureIcons[i % featureIcons.length];
                  return (
                    <div key={i} className={`flex items-start gap-4 p-6 rounded-xl ${getCard(true)} border ${getCardBorder(true)} shadow-sm`}>
                      <div className={`h-10 w-10 rounded-lg ${t.accentBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-5 w-5 ${getHeading(true)}`} />
                      </div>
                      <p className={`text-base leading-relaxed ${getBody(true)}`}>{item}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={`text-center text-lg ${getBody(true)}`}>{benefits.content as string}</p>
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
                {(features.content as string[]).map((item, i) => (
                  <li key={i} className={`flex items-start gap-4 text-base ${t.bodyColor}`}>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-lg leading-relaxed ${t.bodyColor}`}>{features.content as string}</p>
            )}
          </div>
        </section>
      )}

      {/* ═══ TESTIMONIALS ═══ */}
      {testimonials && (
        <section className={`py-16 md:py-24 ${t.sectionAltBg}`}>
          <div className="mx-auto max-w-5xl px-6">
            <SectionTitle alt>{testimonials.title || "Lo que dicen nuestros clientes"}</SectionTitle>
            {Array.isArray(testimonials.content) ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(testimonials.content as string[]).map((item, i) => (
                  <div key={i} className={`p-6 rounded-xl ${getCard(true)} border ${getCardBorder(true)} shadow-sm relative`}>
                    <Quote className={`h-8 w-8 opacity-10 absolute top-4 right-4 ${getBody(true)}`} />
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${t.starColor}`} />
                      ))}
                    </div>
                    <p className={`text-sm leading-relaxed italic ${getMuted(true)}`}>"{item}"</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full ${t.accentBg} flex items-center justify-center text-xs font-bold ${getHeading(true)}`}>
                        {String.fromCharCode(65 + (i % 26))}
                      </div>
                      <span className={`text-xs font-medium ${getMuted(true)}`}>Cliente verificado</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center italic ${getMuted(true)}`}>{testimonials.content as string}</p>
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
                {(objections.content as string[]).map((item, i) => (
                  <div key={i} className={`flex items-start gap-4 p-5 rounded-xl ${t.cardBg} border ${t.cardBorder}`}>
                    <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    <p className={`text-base ${t.bodyColor}`}>{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center ${t.bodyColor}`}>{objections.content as string}</p>
            )}
          </div>
        </section>
      )}

      {/* ═══ FAQ ═══ */}
      {faq && Array.isArray(faq.content) && (
        <section className={`py-16 md:py-24 ${t.sectionAltBg}`}>
          <div className="mx-auto max-w-2xl px-6">
            <SectionTitle alt>{faq.title || "Preguntas frecuentes"}</SectionTitle>
            <div className="space-y-2">
              {parseFaqItems(faq.content).map((item, i) => (
                <div
                  key={i}
                  className={`rounded-xl ${getCard(true)} border ${getCardBorder(true)} transition-all overflow-hidden`}
                >
                  <button
                    className="w-full text-left p-5"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className={`font-medium text-sm ${getHeading(true)}`}>{item.q}</span>
                      {openFaq === i
                        ? <ChevronUp className={`h-4 w-4 shrink-0 ${getMuted(true)}`} />
                        : <ChevronDown className={`h-4 w-4 shrink-0 ${getMuted(true)}`} />
                      }
                    </div>
                  </button>
                  {openFaq === i && item.a && (
                    <div className={`px-5 pb-5 text-sm leading-relaxed ${getBody(true)}`}>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ COMPARISON ═══ */}
      {comparison && Array.isArray(comparison.content) && (
        <section className={`py-16 md:py-24 ${t.sectionBg}`}>
          <div className="mx-auto max-w-4xl px-6">
            <SectionTitle>{comparison.title || "¿Por qué elegirnos?"}</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className={`p-6 rounded-xl border-2 border-emerald-500 ${t.cardBg} shadow-md`}>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-emerald-500" />
                  <h3 className={`font-bold ${t.headingColor}`}>{productName}</h3>
                </div>
                <ul className="space-y-2">
                  {(comparison.content as string[]).slice(0, Math.ceil((comparison.content as string[]).length / 2)).map((item, i) => (
                    <li key={i} className={`flex items-start gap-2 text-sm ${t.bodyColor}`}>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`p-6 rounded-xl border ${t.cardBorder} ${t.cardBg} opacity-60`}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className={`h-5 w-5 ${t.mutedColor}`} />
                  <h3 className={`font-bold ${t.mutedColor}`}>Alternativas</h3>
                </div>
                <ul className="space-y-2">
                  {(comparison.content as string[]).slice(Math.ceil((comparison.content as string[]).length / 2)).map((item, i) => (
                    <li key={i} className={`flex items-start gap-2 text-sm ${t.mutedColor}`}>
                      <span className="mt-0.5 shrink-0">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ BUNDLES ═══ */}
      {bundles && Array.isArray(bundles.content) && (
        <section className={`py-16 md:py-24 ${t.sectionAltBg}`}>
          <div className="mx-auto max-w-4xl px-6">
            <SectionTitle alt>{bundles.title || "Packs disponibles"}</SectionTitle>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(bundles.content as string[]).map((item, i) => (
                <div key={i} className={`p-6 rounded-xl ${getCard(true)} border ${getCardBorder(true)} shadow-sm text-center`}>
                  <Layers className={`h-8 w-8 mx-auto mb-3 ${getHeading(true)}`} />
                  <p className={`text-sm leading-relaxed ${getBody(true)}`}>{item}</p>
                </div>
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
                {/* Price comparison */}
                <div className="flex items-center justify-center gap-4">
                  <span className={`text-2xl line-through ${t.mutedColor}`}>
                    {formattedPrice}
                  </span>
                  <span className={`text-4xl font-extrabold text-emerald-600`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {`$${Math.round(price * 0.7).toLocaleString("es-CL")}`}
                  </span>
                  <span className="inline-block bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    -30%
                  </span>
                </div>
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
            className={`text-3xl md:text-4xl font-bold tracking-tight ${getHeading(true)}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {cta?.title || "¿Listo para probarlo?"}
          </h2>
          {cta?.content && (
            <p className={`text-lg ${getBody(true)}`}>
              {typeof cta.content === "string" ? cta.content : ""}
            </p>
          )}
          <CTAWithTrust trustColor={theme === "bold" ? "text-gray-500" : undefined} />
        </div>
      </section>

      {/* ═══ STICKY MOBILE CTA ═══ */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <button
          className={`w-full py-3.5 text-base font-bold rounded-lg ${t.ctaBg} ${t.ctaText} shadow-md`}
        >
          Comprar ahora — {formattedPrice}
        </button>
      </div>

      {/* Bottom padding for sticky CTA on mobile */}
      <div className="h-16 md:hidden" />

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
          50% { box-shadow: 0 4px 24px rgba(0,0,0,0.25); }
        }
      `}</style>
    </div>
  );
};

export default LandingRenderer;
