

# Analysis: Zepol vs Our Renderer — Gaps & Improvements

## What Zepol Does
Zepol generates **image-based banners** (PNG), not full HTML pages. Their website itself is polished but their output is fundamentally different from ours. Our system is actually more powerful — we generate full interactive HTML landing pages. The goal is to make our rendered output look as polished as a professional e-commerce page.

## Critical Bugs Found in Our Renderer

### 1. Bold theme — invisible text on dark sections
`sectionAltBg: "bg-gray-950"` but `headingColor: "text-gray-900"` and `bodyColor: "text-gray-700"` — dark text on dark background = invisible. Sections like Benefits, Testimonials, FAQ that use `sectionAltBg` are unreadable in Bold theme.

**Fix:** Add `sectionAltHeading` and `sectionAltBody` color overrides to ThemeConfig for dark alternating sections.

### 2. FAQ section has no answers
The AI generates FAQ as `content: ["question1", "question2"]` — just question strings. The accordion expands but shows nothing. Need the AI to output Q&A pairs and the renderer to display answers.

**Fix:** Update the AI prompt to generate FAQ as `content: [{"q": "...", "a": "..."}]` and update the renderer to parse and display both.

### 3. Product image missing in LandingView
`LandingView.tsx` doesn't pass any image to the renderer. Only `LandingPreview` does from localStorage.

**Fix:** Fetch the product's image URL from the products table and pass it to the renderer.

### 4. Offer block doesn't show price comparison
When `hasOffer=true`, the AI generates offer text but the renderer doesn't visually show strikethrough price vs discounted price.

**Fix:** Add visual price comparison (original crossed out + new price highlighted) in the offer section.

### 5. Comparison/bundles blocks not rendered
Pro plan generates `comparison` and `bundles` blocks but the renderer silently ignores them.

**Fix:** Add rendering for these block types.

## Polish Improvements

### 6. Sticky mobile CTA
Professional e-commerce pages show a fixed bottom CTA bar on mobile. Add this to the renderer.

### 7. Animated CTA button
Add a subtle pulse/glow animation to make the primary CTA more attention-grabbing.

### 8. Section dividers/visual rhythm
Add subtle decorative separators or wave dividers between sections for a more polished feel.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/landing/themes.ts` | Add dark-section text color variants |
| `src/components/landing/LandingRenderer.tsx` | Fix dark theme text, add FAQ answers, comparison/bundles rendering, sticky mobile CTA, animated CTA, offer price display |
| `src/pages/LandingView.tsx` | Fetch and pass product image |
| `supabase/functions/generate-landing/index.ts` | Update FAQ prompt to output Q&A pairs |
| `src/lib/exportLanding.ts` | Mirror all renderer improvements in HTML export |

No database changes needed. No new dependencies.

