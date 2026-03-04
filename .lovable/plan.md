

# Plan: Upgrade Landing Renderer to Professional E-commerce Quality

## Zepol Inspiration Summary

Zepol generates image-based ad banners, not full HTML landings like we do. However, their overall UX teaches us:
- **Continuous, seamless page flow** — no visible "block" boundaries
- **Strong visual hierarchy** — large hero headlines, clear section breaks via background color alternation
- **CTA repetition** — buy button appears 3+ times throughout the page
- **Trust signals near every CTA** — shipping, guarantee, secure payment icons
- **Mobile-first** — everything stacks cleanly on mobile
- **Professional typography scale** — hero 48-60px, section titles 28-36px, body 16-18px

## Current Problem

Both `LandingPreview.tsx` and `LandingView.tsx` duplicate ~250 lines of identical rendering code. The sections render as separate cards with visible gaps, looking like a debug view rather than a real sales page. There is no theme system.

## Changes

### A) Create Shared `LandingRenderer` Component

**New file: `src/components/landing/LandingRenderer.tsx`**

A single reusable component that accepts `blocks`, `product`, `imagePreview`, and `theme` props. Both `LandingPreview` and `LandingView` will use it, eliminating duplication.

The renderer will:
- Render sections as a **continuous full-width page** with no cards/gaps between sections
- Alternate section backgrounds (white / subtle gray) for visual rhythm
- Place **trust badges (shipping, guarantee, secure payment)** below every CTA button
- Repeat CTA button in Hero, after Offer/Urgency, and at Final CTA (3 minimum)
- Use consistent typography: hero h1 at `text-5xl md:text-6xl`, section h2 at `text-3xl md:text-4xl`, body at `text-lg`
- Consistent section padding: `py-16 md:py-24` for major sections
- Max-width container: `max-w-6xl` for hero, `max-w-4xl` for content sections

### B) Four Theme Variants

**New file: `src/components/landing/themes.ts`**

Define 4 theme configs that control colors, button styles, and section backgrounds:

1. **"minimal"** — Clean white, subtle borders, rounded buttons, Shopify-like feel
2. **"bold"** — Dark hero section, bright CTA (green/orange), high contrast, direct-response style
3. **"clean"** — Light blue/white palette, soft shadows, modern SaaS look
4. **"warm"** — Warm tones (amber/cream backgrounds), friendly for pet/lifestyle products

Each theme is a plain object with CSS class overrides:
```typescript
{ heroBg, sectionAltBg, ctaColor, ctaHoverColor, headingColor, bodyColor }
```

The theme selector will be a simple dropdown in both the Generate page config and the LandingView top bar.

### C) Section-by-Section Rendering Improvements

Each block type maps to a polished section:

- **Hero**: Full-width gradient, product image on right (if available), headline + subtitle + CTA + trust row
- **Benefits**: 2-column grid with icon cards, no visible card borders — just icon + text
- **Features**: Alternating icon-left/icon-right layout or numbered list
- **Testimonials**: 3-column cards with avatar placeholder, stars, quote marks
- **Objections/FAQ**: Accordion with smooth expand/collapse using Radix Accordion
- **Offer/Urgency**: Highlighted banner with urgency badge, strikethrough price if offer active, prominent CTA
- **Guarantee**: Shield icon card, full-width subtle green background
- **Microcopy/Trust**: Row of trust icons that appears below EVERY CTA button (not just as its own section)
- **Final CTA**: Large centered section with headline + CTA + trust row

### D) Update `exportLanding.ts` to Match

Rewrite the HTML export to produce a professional self-contained HTML file that mirrors the new renderer:
- Use the same section structure and spacing
- Inline CSS with proper responsive media queries
- Include the selected theme's color scheme
- Google Fonts link for Inter + Space Grotesk
- Proper mobile-first responsive layout

### E) Wire Into Existing Pages

**`LandingPreview.tsx`**: Replace all section rendering with `<LandingRenderer blocks={blocks} product={product} imagePreview={imagePreview} theme="clean" />`

**`LandingView.tsx`**: Same replacement, plus add theme selector in top bar. Store selected theme in landing metadata if desired.

**`GenerateLanding.tsx`**: Add optional theme selector (default: "clean")

### F) Files Summary

| Action | File |
|--------|------|
| Create | `src/components/landing/LandingRenderer.tsx` |
| Create | `src/components/landing/themes.ts` |
| Create | `src/components/landing/TrustBadges.tsx` |
| Rewrite | `src/lib/exportLanding.ts` |
| Simplify | `src/pages/LandingPreview.tsx` |
| Simplify | `src/pages/LandingView.tsx` |
| Minor edit | `src/pages/GenerateLanding.tsx` (add theme selector) |

No database changes needed. No new dependencies.

