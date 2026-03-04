

# Plan: Professional Landing System Upgrade

## What Already Exists (No Changes Needed)
- **Renderer** (`LandingRenderer.tsx`): Already renders continuous sections (hero, benefits, features, testimonials, objections, FAQ, comparison, bundles, offer, guarantee, CTA) with no "Block 1/2" labels. Has sticky mobile CTA, trust badges, pulse animation, price comparison.
- **4 Themes** in `themes.ts`: Minimal, Bold, Clean, Warm — already switchable on preview.
- **Image-first flow**: `ProductForm` uploads images, stored as public URLs. `LandingView` fetches and passes them to renderer.
- **AI prompt**: Already generates 7 required sections, microcopy, category-sensitive rules, Q&A FAQ pairs.
- **Export**: HTML + ZIP with images already implemented.

## What Needs to Change

### 1. Landing Cards Show Hero Preview (Landings List)
**File:** `src/pages/Landings.tsx`

Each card currently shows only name + badges + date. Add a mini hero preview area:
- Extract the hero block's title from `landing.blocks` JSON
- Fetch the product's first image URL (join with products table)
- Render a compact preview strip: gradient background + hero headline truncated + product image thumbnail
- The "Ver" button already links to `/landings/:id` which renders the full page — no new route needed

### 2. Dedicated Preview Route at `/landings/:id/preview`
**Files:** `src/App.tsx`, new `src/pages/LandingFullPreview.tsx`

- Add route `/landings/:id/preview` (protected)
- This page renders the landing **without the app sidebar** — full-width, immersive
- Reuses `LandingRenderer` with theme selector in a minimal floating toolbar
- Different from `/landings/:id` (which is inside the app layout with sidebar)
- Add a "Vista completa" button on `/landings/:id` linking to the preview

### 3. Polish the Renderer
**File:** `src/components/landing/LandingRenderer.tsx`

Minor improvements for professional feel:
- Add subtle wave/curve SVG dividers between major sections (hero→benefits, offer→CTA)
- Improve testimonials with avatar colors cycling through theme accent
- Add a "social proof" counter near hero ("🔥 147 personas vieron este producto hoy")
- Make the hero image have a subtle shadow/border-radius upgrade
- Add a smooth scroll-reveal feel with CSS (opacity transition on sections)

### 4. Store Theme Per Landing
**Migration:** Add `theme` column to `landings` table (text, default 'clean')

**Files:** `src/pages/GenerateLanding.tsx`, `src/pages/LandingView.tsx`, `src/pages/Landings.tsx`
- Save selected theme when generating a landing
- Load stored theme when viewing/exporting
- Use stored theme as default in the theme selector (user can still switch)

### 5. Sync Export with Renderer
**File:** `src/lib/exportLanding.ts`
- Ensure any new visual elements (dividers, social proof) are mirrored in HTML export

## Database Change
```sql
ALTER TABLE public.landings ADD COLUMN theme text NOT NULL DEFAULT 'clean';
```

## Files Summary

| File | Action |
|------|--------|
| `src/pages/Landings.tsx` | Add hero preview strip per card, fetch product image |
| `src/pages/LandingFullPreview.tsx` | New — full-width immersive preview page |
| `src/App.tsx` | Add `/landings/:id/preview` route |
| `src/pages/LandingView.tsx` | Add "Vista completa" button, use stored theme |
| `src/pages/GenerateLanding.tsx` | Save theme to landing record |
| `src/components/landing/LandingRenderer.tsx` | Add section dividers, social proof, CSS transitions |
| `src/lib/exportLanding.ts` | Mirror dividers + social proof in export |
| Migration | Add `theme` column to landings |

No new dependencies needed.

