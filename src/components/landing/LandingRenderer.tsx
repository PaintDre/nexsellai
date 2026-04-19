import { useState, useCallback, useMemo, memo } from "react";
import {
  CheckCircle2, ShieldCheck, Star, Quote, Clock,
  ChevronDown, ChevronUp, Zap, Gift, Award,
  Package, BarChart3, Layers, Truck, PackageCheck, MapPin, X, TrendingUp,
} from "lucide-react";
import TrustBadges from "./TrustBadges";
import { themes, type LandingTheme, type ThemeConfig } from "./themes";
import SectionDivider from "./SectionDivider";
import SocialProof from "./SocialProof";
import EditableText from "./EditableText";
import BlockToolbar from "./BlockToolbar";
import BeforeAfterSlider from "./BeforeAfterSlider";
import { getHeroStyle } from "./heroStyles";

interface Block {
  type: string;
  title?: string;
  content?: any;
  image_url?: string;
  // Optional structured fields for advanced blocks (Shrine Pro LATAM)
  steps?: Array<{ icon?: string; top?: string; bottom?: string }>;
  rows?: Array<{ benefit: string; us?: boolean; others?: boolean }>;
  us_label?: string;
  others_label?: string;
  caption?: string;
  stats?: Array<{ percentage: number | string; text: string }>;
  before_image?: string;
  after_image?: string;
  text?: string;
  items?: any[];
  options?: Array<{ label: string; price: string; compare_price?: string; badge?: string; savings?: string }>;
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
  editable?: boolean;
  onBlocksChange?: (blocks: Block[]) => void;
  hasOffer?: boolean;
}

const LandingRenderer = ({ blocks, product, imagePreview, theme = "clean", editable = false, onBlocksChange, hasOffer = false }: LandingRendererProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const t = themes[theme];

  const getBlock = (type: string) => blocks.find((b) => b.type === type);
  const price = product?.price ?? 0;
  const formattedPrice = `$${price.toLocaleString()}`;
  const productName = product?.name ?? "Producto";

  // Editing helpers
  const updateBlock = useCallback((type: string, updates: Partial<Block>) => {
    if (!onBlocksChange) return;
    const newBlocks = blocks.map(b => b.type === type ? { ...b, ...updates } : b);
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  const updateBlockContentItem = useCallback((type: string, index: number, value: string) => {
    if (!onBlocksChange) return;
    const newBlocks = blocks.map(b => {
      if (b.type === type && Array.isArray(b.content)) {
        const newContent = [...b.content] as any[];
        newContent[index] = value;
        return { ...b, content: newContent } as Block;
      }
      return b;
    });
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  const moveBlock = useCallback((index: number, direction: "up" | "down") => {
    if (!onBlocksChange) return;
    const newBlocks = [...blocks];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  const deleteBlock = useCallback((index: number) => {
    if (!onBlocksChange) return;
    onBlocksChange(blocks.filter((_, i) => i !== index));
  }, [blocks, onBlocksChange]);

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

  // ── New advanced blocks (Shrine Pro LATAM) ──
  const shippingTimeline = getBlock("shipping_timeline");
  const comparisonTable = getBlock("comparison_table");
  const resultsStats = getBlock("results_stats");
  const beforeAfterSlider = getBlock("before_after_slider");
  const marqueeBenefits = getBlock("marquee_benefits");
  const emojiBenefits = getBlock("emoji_benefits");
  const bundleOffer = getBlock("bundle_offer");
  const faqCod = getBlock("faq_cod");
  const productImages = (product as any)?.images as string[] | undefined;

  const microItems: string[] = microcopy
    ? Array.isArray(microcopy.content) ? (microcopy.content as string[])
      : typeof microcopy.content === "string" ? [microcopy.content]
      : []
    : [];

  const getHeading = (alt: boolean) => alt ? t.sectionAltHeading : t.headingColor;
  const getBody = (alt: boolean) => alt ? t.sectionAltBody : t.bodyColor;
  const getMuted = (alt: boolean) => alt ? t.sectionAltMuted : t.mutedColor;
  const getCard = (alt: boolean) => alt ? t.sectionAltCardBg : t.cardBg;
  const getCardBorder = (alt: boolean) => alt ? t.sectionAltCardBorder : t.cardBorder;

  const CTAButton = ({ className = "" }: { className?: string }) => (
    <button
      className={`inline-flex items-center justify-center px-6 sm:px-10 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 animate-[pulse-glow_2s_ease-in-out_infinite] ${t.ctaBg} ${t.ctaText} ${t.ctaHover} ${className}`}
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

  const SectionTitle = ({ children, className = "", alt = false, blockType }: { children: React.ReactNode; className?: string; alt?: boolean; blockType?: string }) => {
    if (editable && blockType) {
      return (
        <EditableText
          value={String(children)}
          onChange={(v) => updateBlock(blockType, { title: v })}
          editable
          tag="h2"
          className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-center mb-6 sm:mb-10 ${getHeading(alt)} ${className}`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        />
      );
    }
    return (
      <h2 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-center mb-6 sm:mb-10 ${getHeading(alt)} ${className}`}
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        {children}
      </h2>
    );
  };

  const Section = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
    <section
      className={`landing-section ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );

  // Wrap section with edit toolbar
  const EditableSection = ({ children, blockType, blockTitle, className = "", delay = 0 }: {
    children: React.ReactNode;
    blockType: string;
    blockTitle?: string;
    className?: string;
    delay?: number;
  }) => {
    const blockIndex = blocks.findIndex(b => b.type === blockType);
    if (!editable) {
      return <Section className={className} delay={delay}>{children}</Section>;
    }
    return (
      <Section className={`${className} relative group ring-1 ring-dashed ring-primary/20 hover:ring-primary/40 transition-all`} delay={delay}>
        <BlockToolbar
          blockType={blockType}
          blockTitle={blockTitle}
          index={blockIndex}
          total={blocks.length}
          onMoveUp={() => moveBlock(blockIndex, "up")}
          onMoveDown={() => moveBlock(blockIndex, "down")}
          onDelete={() => deleteBlock(blockIndex)}
        />
        {children}
      </Section>
    );
  };

  const featureIcons = [Zap, Gift, Award, CheckCircle2, Star, ShieldCheck];

  const parseFaqItems = (content: Block["content"]): Array<{ q: string; a: string }> => {
    if (!Array.isArray(content)) return [];
    return content.map((item) => {
      if (typeof item === "string") return { q: item, a: "" };
      if (typeof item === "object" && item !== null && "q" in item) return { q: (item as any).q, a: (item as any).a || "" };
      return { q: String(item), a: "" };
    });
  };

  const avatarColors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500"];

  const heroImage = hero?.image_url || imagePreview;
  const heroStyle = getHeroStyle(product?.category);
  const isDarkHero = heroStyle.textClass === "text-white";

  return (
    <div className="min-h-screen landing-container" style={{ fontFamily: "'Inter', sans-serif", overflowWrap: "anywhere", wordBreak: "break-word" }}>

      {/* ═══ HERO ═══ */}
      {hero && (
        <EditableSection blockType="hero" blockTitle={hero.title} className={`relative overflow-hidden py-20 md:py-28 ${heroStyle.bgClass}`}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {/* Banner image shown inline above content if provided */}
            {hero.image_url && (
              <div className="mb-8 md:mb-12 -mt-8 md:-mt-12 mx-auto max-w-4xl">
                <img
                  src={hero.image_url}
                  alt={productName}
                  className="w-full h-auto rounded-2xl shadow-xl object-contain"
                  loading="eager"
                />
              </div>
            )}
            <div className={`grid ${imagePreview && !hero.image_url ? "lg:grid-cols-2" : ""} gap-8 lg:gap-12 items-center`}>
              <div className="space-y-6 sm:space-y-8">
                <EditableText
                  value={hero.title || ""}
                  onChange={(v) => updateBlock("hero", { title: v })}
                  editable={editable}
                  tag="h1"
                  className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] ${heroStyle.textClass}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                />
                {hero.content && (
                  <EditableText
                    value={typeof hero.content === "string" ? hero.content : ""}
                    onChange={(v) => updateBlock("hero", { content: v })}
                    editable={editable}
                    tag="p"
                    className={`text-base sm:text-lg md:text-xl leading-relaxed max-w-xl ${heroStyle.subtextClass}`}
                  />
                )}
                <SocialProof theme={theme} />
                <CTAWithTrust className="items-start" trustColor={isDarkHero ? "text-gray-500" : undefined} />
              </div>
              {imagePreview && !hero.image_url && (
                <div className="flex justify-center lg:justify-end">
                  <div className="relative">
                    <img src={imagePreview} alt={productName} className={`rounded-2xl shadow-2xl max-h-[480px] object-contain w-full max-w-md ring-1 ${heroStyle.imageRingClass}`} />
                    <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-tr ${heroStyle.accentClass} pointer-events-none`} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </EditableSection>
      )}

      <SectionDivider theme={theme} from="hero" to="alt" />

      {/* ═══ BENEFITS ═══ */}
      {benefits && (
        <EditableSection blockType="benefits" blockTitle={benefits.title} className={`py-16 md:py-24 ${t.sectionAltBg}`} delay={100}>
          <div className="mx-auto max-w-5xl px-6">
            <SectionTitle alt blockType="benefits">{benefits.title || "Beneficios"}</SectionTitle>
            {benefits.image_url ? (
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <img src={benefits.image_url} alt={benefits.title || "Beneficios"} className="w-full h-auto object-contain" loading="lazy" />
                </div>
                <div className="space-y-4">
                  {Array.isArray(benefits.content) ? (
                    (benefits.content as string[]).map((item, i) => {
                      const Icon = featureIcons[i % featureIcons.length];
                      return (
                        <div key={i} className={`flex items-start gap-4 p-5 rounded-xl ${getCard(true)} border ${getCardBorder(true)} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                          <div className={`h-10 w-10 rounded-lg ${t.accentBg} flex items-center justify-center shrink-0`}>
                            <Icon className={`h-5 w-5 ${getHeading(true)}`} />
                          </div>
                          <EditableText
                            value={item}
                            onChange={(v) => updateBlockContentItem("benefits", i, v)}
                            editable={editable}
                            tag="p"
                            className={`text-base leading-relaxed ${getBody(true)}`}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <EditableText value={benefits.content as string} onChange={(v) => updateBlock("benefits", { content: v })} editable={editable} tag="p" className={`text-lg ${getBody(true)}`} />
                  )}
                </div>
              </div>
            ) : (
              Array.isArray(benefits.content) ? (
                <div className="grid sm:grid-cols-2 gap-5">
                  {(benefits.content as string[]).map((item, i) => {
                    const Icon = featureIcons[i % featureIcons.length];
                    return (
                      <div key={i} className={`flex items-start gap-4 p-6 rounded-xl ${getCard(true)} border ${getCardBorder(true)} shadow-sm hover:shadow-md transition-shadow duration-300`}>
                        <div className={`h-10 w-10 rounded-lg ${t.accentBg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-5 w-5 ${getHeading(true)}`} />
                        </div>
                        <EditableText
                          value={item}
                          onChange={(v) => updateBlockContentItem("benefits", i, v)}
                          editable={editable}
                          tag="p"
                          className={`text-base leading-relaxed ${getBody(true)}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EditableText value={String(benefits.content)} onChange={(v) => updateBlock("benefits", { content: v })} editable={editable} tag="p" className={`text-center text-lg ${getBody(true)}`} />
              )
            )}
          </div>
        </EditableSection>
      )}

      {/* ═══ FEATURES ═══ */}
      {features && (
        <EditableSection blockType="features" blockTitle={features.title} className={`py-16 md:py-24 ${t.sectionBg}`} delay={200}>
          <div className="mx-auto max-w-4xl px-6">
            <SectionTitle blockType="features">{features.title || "Características"}</SectionTitle>
            {features.image_url ? (
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-4">
                  {Array.isArray(features.content) ? (
                    <ul className="space-y-4">
                      {(features.content as string[]).map((item, i) => (
                        <li key={i} className={`flex items-start gap-4 text-base ${t.bodyColor}`}>
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                          <EditableText value={item} onChange={(v) => updateBlockContentItem("features", i, v)} editable={editable} tag="span" className="" />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EditableText value={features.content as string} onChange={(v) => updateBlock("features", { content: v })} editable={editable} tag="p" className={`text-lg leading-relaxed ${t.bodyColor}`} />
                  )}
                </div>
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <img src={features.image_url} alt={features.title || "Características"} className="w-full h-auto object-contain" loading="lazy" />
                </div>
              </div>
            ) : (
              Array.isArray(features.content) ? (
                <ul className="space-y-4">
                  {(features.content as string[]).map((item, i) => (
                    <li key={i} className={`flex items-start gap-4 text-base ${t.bodyColor}`}>
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                      <EditableText value={item} onChange={(v) => updateBlockContentItem("features", i, v)} editable={editable} tag="span" className="" />
                    </li>
                  ))}
                </ul>
              ) : (
                <EditableText value={String(features.content)} onChange={(v) => updateBlock("features", { content: v })} editable={editable} tag="p" className={`text-lg leading-relaxed ${t.bodyColor}`} />
              )
            )}
          </div>
        </EditableSection>
      )}

      {/* ═══ TESTIMONIALS ═══ */}
      {testimonials && (
        <EditableSection blockType="testimonials" blockTitle={testimonials.title} className={`py-16 md:py-24 ${t.sectionAltBg}`} delay={300}>
          <div className="mx-auto max-w-5xl px-6">
            <SectionTitle alt blockType="testimonials">{testimonials.title || "Lo que dicen nuestros clientes"}</SectionTitle>
            {Array.isArray(testimonials.content) ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(testimonials.content as string[]).map((item, i) => (
                  <div key={i} className={`p-6 rounded-xl ${getCard(true)} border ${getCardBorder(true)} shadow-sm hover:shadow-md transition-shadow duration-300 relative`}>
                    <Quote className={`h-8 w-8 opacity-10 absolute top-4 right-4 ${getBody(true)}`} />
                    <div className="flex gap-0.5 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${t.starColor}`} />
                      ))}
                    </div>
                    <EditableText
                      value={item}
                      onChange={(v) => updateBlockContentItem("testimonials", i, v)}
                      editable={editable}
                      tag="p"
                      className={`text-sm leading-relaxed italic ${getMuted(true)}`}
                    />
                    <div className="mt-4 flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-xs font-bold text-white`}>
                        {String.fromCharCode(65 + (i % 26))}
                      </div>
                      <span className={`text-xs font-medium ${getMuted(true)}`}>Cliente verificado</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EditableText value={String(testimonials.content)} onChange={(v) => updateBlock("testimonials", { content: v })} editable={editable} tag="p" className={`text-center italic ${getMuted(true)}`} />
            )}
          </div>
        </EditableSection>
      )}

      {/* ═══ OBJECTIONS ═══ */}
      {objections && (
        <EditableSection blockType="objections" blockTitle={objections.title} className={`py-16 md:py-24 ${t.sectionBg}`} delay={400}>
          <div className="mx-auto max-w-3xl px-6">
            <SectionTitle blockType="objections">{objections.title || "¿Aún tienes dudas?"}</SectionTitle>
            {Array.isArray(objections.content) ? (
              <div className="space-y-3">
                {(objections.content as string[]).map((item, i) => (
                  <div key={i} className={`flex items-start gap-4 p-5 rounded-xl ${t.cardBg} border ${t.cardBorder} hover:shadow-sm transition-shadow`}>
                    <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                    <EditableText value={item} onChange={(v) => updateBlockContentItem("objections", i, v)} editable={editable} tag="p" className={`text-base ${t.bodyColor}`} />
                  </div>
                ))}
              </div>
            ) : (
              <EditableText value={String(objections.content)} onChange={(v) => updateBlock("objections", { content: v })} editable={editable} tag="p" className={`text-center ${t.bodyColor}`} />
            )}
          </div>
        </EditableSection>
      )}

      {/* ═══ FAQ ═══ */}
      {faq && Array.isArray(faq.content) && (
        <EditableSection blockType="faq" blockTitle={faq.title} className={`py-16 md:py-24 ${t.sectionAltBg}`} delay={500}>
          <div className="mx-auto max-w-2xl px-6">
            <SectionTitle alt blockType="faq">{faq.title || "Preguntas frecuentes"}</SectionTitle>
            <div className="space-y-2">
              {parseFaqItems(faq.content).map((item, i) => (
                <div key={i} className={`rounded-xl ${getCard(true)} border ${getCardBorder(true)} transition-all overflow-hidden`}>
                  <button className="w-full text-left p-5" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
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
        </EditableSection>
      )}

      {/* ═══ COMPARISON ═══ */}
      {comparison && Array.isArray(comparison.content) && (
        <EditableSection blockType="comparison" blockTitle={comparison.title} className={`py-16 md:py-24 ${t.sectionBg}`}>
          <div className="mx-auto max-w-4xl px-6">
            <SectionTitle blockType="comparison">{comparison.title || "¿Por qué elegirnos?"}</SectionTitle>
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
        </EditableSection>
      )}

      {/* ═══ BUNDLES ═══ */}
      {bundles && Array.isArray(bundles.content) && (
        <EditableSection blockType="bundles" blockTitle={bundles.title} className={`py-16 md:py-24 ${t.sectionAltBg}`}>
          <div className="mx-auto max-w-4xl px-6">
            <SectionTitle alt blockType="bundles">{bundles.title || "Packs disponibles"}</SectionTitle>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(bundles.content as string[]).map((item, i) => (
                <div key={i} className={`p-6 rounded-xl ${getCard(true)} border ${getCardBorder(true)} shadow-sm text-center hover:shadow-md transition-shadow`}>
                  <Layers className={`h-8 w-8 mx-auto mb-3 ${getHeading(true)}`} />
                  <EditableText value={item} onChange={(v) => updateBlockContentItem("bundles", i, v)} editable={editable} tag="p" className={`text-sm leading-relaxed ${getBody(true)}`} />
                </div>
              ))}
            </div>
          </div>
        </EditableSection>
      )}

      <SectionDivider theme={theme} from="main" to="accent" />

      {/* ═══ OFFER / URGENCY ═══ */}
      {(offer || urgency) && (
        <EditableSection blockType="offer" blockTitle={offer?.title || "Oferta"} className={`relative overflow-hidden ${`py-16 md:py-24 ${t.accentBg}`}`}>
          <div className="mx-auto max-w-3xl px-6 text-center space-y-6">
            {urgency && (
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${t.urgencyBg} ${t.urgencyText}`}>
                <Clock className="h-4 w-4" />
                {typeof urgency.content === "string" ? urgency.content : urgency.title}
              </span>
            )}
            {offer && (
              <>
                <EditableText
                  value={offer.title || ""}
                  onChange={(v) => updateBlock("offer", { title: v })}
                  editable={editable}
                  tag="h2"
                  className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight ${t.headingColor}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                />
                {offer.content && (
                  <EditableText
                    value={typeof offer.content === "string" ? offer.content : ""}
                    onChange={(v) => updateBlock("offer", { content: v })}
                    editable={editable}
                    tag="p"
                    className={`text-lg ${t.bodyColor}`}
                  />
                )}
              </>
            )}
            <CTAWithTrust />
          </div>
        </EditableSection>
      )}

      {/* ═══ GUARANTEE ═══ */}
      {guarantee && (
        <EditableSection blockType="guarantee" blockTitle="Garantía" className={`py-12 md:py-16 ${t.sectionBg}`}>
          <div className="mx-auto max-w-2xl px-6">
            <div className={`flex items-start gap-5 p-6 rounded-2xl ${t.guaranteeBg} border ${t.guaranteeBorder}`}>
              <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0 mt-1" />
              <div>
                <EditableText
                  value={guarantee.title || "Garantía"}
                  onChange={(v) => updateBlock("guarantee", { title: v })}
                  editable={editable}
                  tag="h3"
                  className={`font-bold text-lg mb-1 ${t.headingColor}`}
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                />
                <EditableText
                  value={typeof guarantee.content === "string" ? guarantee.content : ""}
                  onChange={(v) => updateBlock("guarantee", { content: v })}
                  editable={editable}
                  tag="p"
                  className={t.bodyColor}
                />
              </div>
            </div>
          </div>
        </EditableSection>
      )}

      {/* ═══ EMOJI BENEFITS (Shrine Pro) ═══ */}
      {emojiBenefits && Array.isArray(emojiBenefits.items || emojiBenefits.content) && (
        <EditableSection blockType="emoji_benefits" blockTitle={emojiBenefits.title} className={`py-8 md:py-10 ${t.sectionBg}`}>
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
              {((emojiBenefits.items || emojiBenefits.content) as any[]).slice(0, 4).map((it, i) => {
                const emoji = typeof it === "object" ? it.emoji : "✓";
                const text = typeof it === "object" ? it.text : String(it);
                return (
                  <div key={i} className={`flex flex-col items-center text-center gap-2 p-4 rounded-xl ${t.cardBg} border ${t.cardBorder}`}>
                    <span className="text-3xl" aria-hidden>{emoji}</span>
                    <span className={`text-xs sm:text-sm font-medium ${t.bodyColor}`}>{text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </EditableSection>
      )}

      {/* ═══ MARQUEE BENEFITS (Shrine Pro) ═══ */}
      {marqueeBenefits && Array.isArray(marqueeBenefits.items || marqueeBenefits.content) && (
        <EditableSection blockType="marquee_benefits" blockTitle={marqueeBenefits.title} className={`py-4 md:py-5 bg-emerald-600 text-white overflow-hidden`}>
          <div className="relative">
            <div className="flex gap-12 whitespace-nowrap animate-[marquee_30s_linear_infinite]">
              {[...((marqueeBenefits.items || marqueeBenefits.content) as any[]), ...((marqueeBenefits.items || marqueeBenefits.content) as any[])].map((item, i) => (
                <span key={i} className="text-sm font-semibold inline-flex items-center gap-2">
                  <Star className="h-4 w-4 fill-white" />
                  {String(item)}
                </span>
              ))}
            </div>
          </div>
        </EditableSection>
      )}

      {/* ═══ RESULTS STATS (Shrine Pro) ═══ */}
      {resultsStats && Array.isArray(resultsStats.stats) && (
        <EditableSection blockType="results_stats" blockTitle={resultsStats.title} className={`py-16 md:py-24 ${t.sectionBg}`}>
          <div className="mx-auto max-w-5xl px-6">
            <SectionTitle blockType="results_stats">{resultsStats.title || "Resultados comprobados"}</SectionTitle>
            {resultsStats.caption && (
              <p className={`text-center text-sm sm:text-base mb-8 ${t.mutedColor}`}>{resultsStats.caption}</p>
            )}
            <div className="grid sm:grid-cols-3 gap-6">
              {resultsStats.stats.slice(0, 3).map((s, i) => {
                const pct = typeof s.percentage === "number" ? s.percentage : parseInt(String(s.percentage), 10) || 0;
                return (
                  <div key={i} className={`p-6 rounded-2xl ${t.cardBg} border ${t.cardBorder} text-center`}>
                    <div className="flex items-center justify-center gap-1 mb-3">
                      <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {pct}
                      </span>
                      <span className="text-2xl font-bold text-emerald-600">%</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <p className={`text-sm leading-relaxed ${t.bodyColor}`}>{s.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </EditableSection>
      )}

      {/* ═══ BEFORE / AFTER SLIDER (Shrine Pro) ═══ */}
      {beforeAfterSlider && (() => {
        const beforeImg = beforeAfterSlider.before_image || (productImages?.[0] && (productImages[0].startsWith("http") ? productImages[0] : null)) || imagePreview;
        const afterImg = beforeAfterSlider.after_image || (productImages?.[1] && (productImages[1].startsWith("http") ? productImages[1] : null)) || (productImages?.[0] && (productImages[0].startsWith("http") ? productImages[0] : null)) || imagePreview;
        if (!beforeImg || !afterImg) return null;
        return (
          <EditableSection blockType="before_after_slider" blockTitle={beforeAfterSlider.title} className={`py-16 md:py-24 ${t.sectionAltBg}`}>
            <div className="mx-auto max-w-3xl px-6">
              <SectionTitle alt blockType="before_after_slider">{beforeAfterSlider.title || "Antes vs Después"}</SectionTitle>
              {beforeAfterSlider.text && (
                <p className={`text-center text-base mb-8 ${getBody(true)}`}>{beforeAfterSlider.text}</p>
              )}
              <BeforeAfterSlider beforeImage={beforeImg} afterImage={afterImg} />
              <p className={`text-center text-xs mt-4 ${getMuted(true)}`}>Arrastra el control para comparar</p>
            </div>
          </EditableSection>
        );
      })()}

      {/* ═══ COMPARISON TABLE (Shrine Pro) ═══ */}
      {comparisonTable && Array.isArray(comparisonTable.rows) && (
        <EditableSection blockType="comparison_table" blockTitle={comparisonTable.title} className={`py-16 md:py-24 ${t.sectionBg}`}>
          <div className="mx-auto max-w-3xl px-6">
            <SectionTitle blockType="comparison_table">{comparisonTable.title || "Compáranos"}</SectionTitle>
            <div className={`overflow-hidden rounded-2xl border ${t.cardBorder} ${t.cardBg} shadow-sm`}>
              <div className="grid grid-cols-[1fr,auto,auto] sm:grid-cols-[2fr,1fr,1fr]">
                <div className="p-4 sm:p-5 font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wide">
                  Característica
                </div>
                <div className="p-4 sm:p-5 text-center font-bold text-xs sm:text-sm bg-emerald-50 text-emerald-700 border-l border-border">
                  {comparisonTable.us_label || productName}
                </div>
                <div className="p-4 sm:p-5 text-center font-semibold text-xs sm:text-sm text-muted-foreground border-l border-border">
                  {comparisonTable.others_label || "Otros"}
                </div>
                {comparisonTable.rows.map((row, i) => (
                  <div key={i} className="contents">
                    <div className={`p-4 sm:p-5 text-sm border-t border-border ${t.bodyColor}`}>
                      {row.benefit}
                    </div>
                    <div className="p-4 sm:p-5 text-center border-t border-l border-border bg-emerald-50/40">
                      {row.us !== false ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </div>
                    <div className="p-4 sm:p-5 text-center border-t border-l border-border">
                      {row.others ? (
                        <CheckCircle2 className="h-5 w-5 text-muted-foreground mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground/60 mx-auto" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </EditableSection>
      )}

      {/* ═══ SHIPPING TIMELINE (Shrine Pro) ═══ */}
      {shippingTimeline && Array.isArray(shippingTimeline.steps) && (
        <EditableSection blockType="shipping_timeline" blockTitle={shippingTimeline.title} className={`py-16 md:py-20 ${t.sectionAltBg}`}>
          <div className="mx-auto max-w-4xl px-6">
            <SectionTitle alt blockType="shipping_timeline">{shippingTimeline.title || "Cómo recibirás tu pedido"}</SectionTitle>
            <div className="relative">
              {/* Connector line - desktop */}
              <div className="hidden sm:block absolute top-7 left-[10%] right-[10%] h-0.5 bg-emerald-200" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-2 relative">
                {shippingTimeline.steps.slice(0, 4).map((step, i) => {
                  const icons = [Package, PackageCheck, Truck, MapPin];
                  const Icon = icons[i] || Package;
                  return (
                    <div key={i} className="flex flex-col items-center text-center gap-2">
                      <div className="h-14 w-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg ring-4 ring-background relative z-10">
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className={`text-xs sm:text-sm font-bold ${getHeading(true)}`}>{step.top || ""}</p>
                      <p className={`text-xs ${getMuted(true)}`}>{step.bottom || ""}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </EditableSection>
      )}

      {/* ═══ BUNDLE OFFER (Shrine Pro) ═══ */}
      {bundleOffer && Array.isArray(bundleOffer.options) && (
        <EditableSection blockType="bundle_offer" blockTitle={bundleOffer.title} className={`py-16 md:py-24 ${t.sectionBg}`}>
          <div className="mx-auto max-w-5xl px-6">
            <SectionTitle blockType="bundle_offer">{bundleOffer.title || "Elige tu pack"}</SectionTitle>
            <div className="grid sm:grid-cols-3 gap-5">
              {bundleOffer.options.slice(0, 3).map((opt, i) => {
                const isFeatured = !!opt.badge;
                return (
                  <div
                    key={i}
                    className={`relative p-6 rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-xl ${
                      isFeatured
                        ? "border-emerald-500 bg-emerald-50/50 shadow-lg scale-[1.02]"
                        : `${t.cardBorder} ${t.cardBg}`
                    }`}
                  >
                    {opt.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md whitespace-nowrap">
                        {opt.badge}
                      </span>
                    )}
                    <p className={`text-sm font-semibold mb-3 text-center ${t.headingColor}`}>{opt.label}</p>
                    <div className="text-center mb-2">
                      <span className={`text-3xl font-extrabold ${isFeatured ? "text-emerald-700" : t.headingColor}`}>
                        {opt.price}
                      </span>
                    </div>
                    {opt.compare_price && (
                      <p className="text-center text-sm text-muted-foreground line-through mb-2">{opt.compare_price}</p>
                    )}
                    {opt.savings && (
                      <p className="text-center text-xs font-bold text-emerald-600 mb-4 inline-flex items-center justify-center gap-1 w-full">
                        <TrendingUp className="h-3 w-3" /> {opt.savings}
                      </p>
                    )}
                    <button
                      className={`w-full py-3 mt-2 rounded-xl text-sm font-bold transition-all ${
                        isFeatured
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : `${t.ctaBg} ${t.ctaText} ${t.ctaHover}`
                      }`}
                    >
                      Elegir pack
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </EditableSection>
      )}

      {/* ═══ FAQ COD (Shrine Pro - LATAM oriented) ═══ */}
      {faqCod && Array.isArray(faqCod.items || faqCod.content) && (
        <EditableSection blockType="faq_cod" blockTitle={faqCod.title} className={`py-16 md:py-24 ${t.sectionAltBg}`}>
          <div className="mx-auto max-w-2xl px-6">
            <SectionTitle alt blockType="faq_cod">{faqCod.title || "Preguntas frecuentes"}</SectionTitle>
            <div className="space-y-2">
              {((faqCod.items || faqCod.content) as any[]).map((item, i) => {
                const q = typeof item === "object" ? item.q : String(item);
                const a = typeof item === "object" ? item.a : "";
                return (
                  <div key={i} className={`rounded-xl ${getCard(true)} border ${getCardBorder(true)} overflow-hidden`}>
                    <button className="w-full text-left p-5" onClick={() => setOpenFaq(openFaq === (i + 1000) ? null : (i + 1000))}>
                      <div className="flex items-center justify-between gap-4">
                        <span className={`font-medium text-sm ${getHeading(true)}`}>{q}</span>
                        {openFaq === (i + 1000)
                          ? <ChevronUp className={`h-4 w-4 shrink-0 ${getMuted(true)}`} />
                          : <ChevronDown className={`h-4 w-4 shrink-0 ${getMuted(true)}`} />
                        }
                      </div>
                    </button>
                    {openFaq === (i + 1000) && a && (
                      <div className={`px-5 pb-5 text-sm leading-relaxed ${getBody(true)}`}>{a}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </EditableSection>
      )}

      <SectionDivider theme={theme} from="alt" to="cta" />

      {/* ═══ FINAL CTA ═══ */}
      <EditableSection blockType="cta" blockTitle="CTA Final" className={`relative overflow-hidden py-20 md:py-28 ${t.sectionAltBg}`}>
        <div className="mx-auto max-w-2xl px-6 text-center space-y-8">
          <EditableText
            value={cta?.title || "¿Listo para probarlo?"}
            onChange={(v) => updateBlock("cta", { title: v })}
            editable={editable}
            tag="h2"
            className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight ${getHeading(true)}`}
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          />
          {cta?.content && (
            <EditableText
              value={typeof cta.content === "string" ? cta.content : ""}
              onChange={(v) => updateBlock("cta", { content: v })}
              editable={editable}
              tag="p"
              className={`text-lg ${getBody(true)}`}
            />
          )}
          {cta?.image_url && (
            <div className="mx-auto max-w-sm">
              <img src={cta.image_url} alt="Producto" className="rounded-2xl shadow-xl w-full h-auto object-contain" loading="lazy" />
            </div>
          )}
          <CTAWithTrust trustColor={theme === "bold" ? "text-gray-500" : undefined} />
        </div>
      </EditableSection>

      {/* ═══ STICKY MOBILE CTA ═══ */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <button className={`w-full py-3 text-sm sm:text-base font-bold rounded-xl ${t.ctaBg} ${t.ctaText} shadow-md`}>
          Comprar ahora — {formattedPrice}
        </button>
      </div>

      <div className="h-16 md:hidden" />

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 14px rgba(0,0,0,0.15); }
          50% { box-shadow: 0 4px 24px rgba(0,0,0,0.25); }
        }
        @keyframes landing-fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .landing-section {
          animation: landing-fade-in 0.6s ease-out both;
        }
        .landing-container {
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
};

export default memo(LandingRenderer);
