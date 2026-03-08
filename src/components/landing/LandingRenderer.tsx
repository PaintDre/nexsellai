import { useState, useCallback, useMemo, memo } from "react";
import {
  CheckCircle2, ShieldCheck, Star, Quote, Clock,
  ChevronDown, ChevronUp, Zap, Gift, Award,
  Package, BarChart3, Layers,
} from "lucide-react";
import TrustBadges from "./TrustBadges";
import { themes, type LandingTheme, type ThemeConfig } from "./themes";
import SectionDivider from "./SectionDivider";
import SocialProof from "./SocialProof";
import EditableText from "./EditableText";
import BlockToolbar from "./BlockToolbar";
import { getHeroStyle } from "./heroStyles";

interface Block {
  type: string;
  title?: string;
  content?: string | string[] | Array<{ q: string; a: string }>;
  image_url?: string;
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
}

const LandingRenderer = ({ blocks, product, imagePreview, theme = "clean", editable = false, onBlocksChange }: LandingRendererProps) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const t = themes[theme];

  const getBlock = (type: string) => blocks.find((b) => b.type === type);
  const price = product?.price ?? 0;
  const formattedPrice = `$${price.toLocaleString("es-CL")}`;
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
      <Section className={`${className} relative group`} delay={delay}>
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
        <EditableSection blockType="hero" blockTitle={hero.title} className={`relative overflow-hidden ${hero.image_url ? 'py-0' : `py-20 md:py-28 ${heroStyle.bgClass}`}`}>
          {hero.image_url ? (
            <div className="relative min-h-[400px] md:min-h-[600px] flex items-center">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${hero.image_url})` }} />
              <div className={`absolute inset-0 ${heroStyle.overlayClass}`} />
              <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-16 md:py-28">
                <div className="max-w-2xl space-y-6 sm:space-y-8">
                  <EditableText
                    value={hero.title || ""}
                    onChange={(v) => updateBlock("hero", { title: v })}
                    editable={editable}
                    tag="h1"
                    className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white drop-shadow-lg"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  />
                  {hero.content && (
                    <EditableText
                      value={typeof hero.content === "string" ? hero.content : ""}
                      onChange={(v) => updateBlock("hero", { content: v })}
                      editable={editable}
                      tag="p"
                      className="text-base sm:text-lg md:text-xl leading-relaxed max-w-xl text-gray-200"
                    />
                  )}
                  <SocialProof theme={theme} />
                  <CTAWithTrust className="items-start" trustColor="text-gray-400" />
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className={`grid ${imagePreview ? "lg:grid-cols-2" : ""} gap-8 lg:gap-12 items-center`}>
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
                {imagePreview && (
                  <div className="flex justify-center lg:justify-end">
                    <div className="relative">
                      <img src={imagePreview} alt={productName} className={`rounded-2xl shadow-2xl max-h-[480px] object-contain w-full max-w-md ring-1 ${heroStyle.imageRingClass}`} />
                      <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-tr ${heroStyle.accentClass} pointer-events-none`} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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
        <EditableSection blockType="offer" blockTitle={offer?.title || "Oferta"} className={`relative overflow-hidden ${offer?.image_url ? 'py-0' : `py-16 md:py-24 ${t.accentBg}`}`}>
          {offer?.image_url ? (
            <div className="relative min-h-[400px] flex items-center">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${offer.image_url})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/40" />
              <div className="relative z-10 mx-auto max-w-3xl px-6 py-16 md:py-24 text-center space-y-6">
                {urgency && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-red-500/90 text-white">
                    <Clock className="h-4 w-4" />
                    {typeof urgency.content === "string" ? urgency.content : urgency.title}
                  </span>
                )}
                <EditableText
                  value={offer?.title || ""}
                  onChange={(v) => updateBlock("offer", { title: v })}
                  editable={editable}
                  tag="h2"
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                />
                {offer?.content && (
                  <EditableText
                    value={typeof offer.content === "string" ? offer.content : ""}
                    onChange={(v) => updateBlock("offer", { content: v })}
                    editable={editable}
                    tag="p"
                    className="text-base sm:text-lg text-gray-200"
                  />
                )}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                  <span className="text-lg sm:text-2xl line-through text-gray-400">{formattedPrice}</span>
                  <span className="text-2xl sm:text-4xl font-extrabold text-emerald-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {`$${Math.round(price * 0.7).toLocaleString("es-CL")}`}
                  </span>
                  <span className="inline-block bg-red-500 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full">-30%</span>
                </div>
                <CTAWithTrust trustColor="text-gray-400" />
              </div>
            </div>
          ) : (
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
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                    <span className={`text-lg sm:text-2xl line-through ${t.mutedColor}`}>{formattedPrice}</span>
                    <span className="text-2xl sm:text-4xl font-extrabold text-emerald-600" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {`$${Math.round(price * 0.7).toLocaleString("es-CL")}`}
                    </span>
                    <span className="inline-block bg-red-500 text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 rounded-full">-30%</span>
                  </div>
                </>
              )}
              <CTAWithTrust />
            </div>
          )}
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

      <SectionDivider theme={theme} from="alt" to="cta" />

      {/* ═══ FINAL CTA ═══ */}
      <EditableSection blockType="cta" blockTitle="CTA Final" className={`relative overflow-hidden ${cta?.image_url ? 'py-0' : `py-20 md:py-28 ${t.sectionAltBg}`}`}>
        {cta?.image_url ? (
          <div className="relative min-h-[350px] flex items-center">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${cta.image_url})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
            <div className="relative z-10 mx-auto max-w-2xl px-6 py-20 md:py-28 text-center space-y-8">
              <EditableText
                value={cta?.title || "¿Listo para probarlo?"}
                onChange={(v) => updateBlock("cta", { title: v })}
                editable={editable}
                tag="h2"
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              />
              {cta?.content && (
                <EditableText
                  value={typeof cta.content === "string" ? cta.content : ""}
                  onChange={(v) => updateBlock("cta", { content: v })}
                  editable={editable}
                  tag="p"
                  className="text-base sm:text-lg text-gray-200"
                />
              )}
              <CTAWithTrust trustColor="text-gray-400" />
            </div>
          </div>
        ) : (
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
            <CTAWithTrust trustColor={theme === "bold" ? "text-gray-500" : undefined} />
          </div>
        )}
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
