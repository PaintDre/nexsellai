

# Category-Based Hero Visual Selection

## Problem
The hero section always renders with the same theme background (`t.heroBg`) or a generic dark overlay when an image is present. Product category is available in props but unused, making all landings look identical.

## Approach

### 1. Create `src/components/landing/heroStyles.ts`
A category-to-style mapping that returns visual configuration per category:

```text
Category mapping:
  beauty/skincare  → soft pink/rose gradients, light overlay on images
  health/wellness  → clinical white/blue, light minimal overlay
  gadgets/electronics → dark tech bg, blue/purple glow accents
  pets             → warm amber/orange gradients, friendly overlay
  home/kitchen     → neutral beige/stone, bright overlay
  automotive       → dark premium, metallic gray gradients
  fashion/clothing → elegant neutral, subtle overlay
  food/drinks      → warm earth tones
  generic fallback → current theme default
```

Each config returns:
- `bgClass`: Tailwind gradient/background classes (no-image hero)
- `textClass`: Heading text color override
- `subtextClass`: Body text color override
- `overlayClass`: Gradient overlay for image-based heroes
- `accentClass`: Accent color for decorative elements
- `imageRingClass`: Ring/shadow style for product image

The function normalizes category strings (lowercase, trims) and matches against keywords to handle variations like "belleza", "beauty", "skincare", etc.

### 2. Modify `src/components/landing/LandingRenderer.tsx`
- Import the helper
- Call `getHeroStyle(product?.category)` once
- In the hero section (lines 197-263):
  - **Image hero branch** (line 203): Replace the hardcoded `bg-gradient-to-r from-black/80 via-black/60 to-black/30` with the category-specific `overlayClass`
  - **No-image hero branch** (line 230): Replace `t.heroBg` with the category `bgClass`, and apply category text colors
  - Apply `imageRingClass` to the product image container
- Keep `t.heroBg` as the ultimate fallback if no category matches

### What stays unchanged
- All other sections (benefits, features, testimonials, etc.)
- Theme system and theme selector
- AI pipeline and block structure
- Editable mode functionality
- All other pages/components

