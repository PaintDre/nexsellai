

# Plan: Banner Generator Service for Starter & Pro Plans

## What We're Building

A Zepol-inspired **banner image generator** that creates professional product marketing images using AI. Available only for Starter and Pro plan users.

## Architecture

```text
User uploads product photos → Picks template → Edge function sends to AI → 
AI generates banner image → Saved to storage → User downloads PNG
```

## Database Changes

### 1. New `banners` table
```sql
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  image_url text NOT NULL,
  template_id text NOT NULL DEFAULT 'oferta-directa',
  output_size text NOT NULL DEFAULT '1080x1080',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own banners" ON public.banners
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

### 2. New `banner-images` storage bucket

## Edge Function: `generate-banner`

- Receives: product info, product image URLs, template style, output size
- Checks plan (only starter/pro allowed, with limits: starter=5/month, pro=50/month)
- Builds a detailed image generation prompt based on template style
- Calls `gemini-3-pro-image-preview` via Lovable AI Gateway with product image + text prompt
- Uploads resulting image to `banner-images` bucket
- Saves record in `banners` table
- Returns the public URL

## Template Definitions (`src/components/banner/templates.ts`)

6 predefined styles, each with a name, description, preview color scheme, and AI prompt instructions:

| Template | Style |
|----------|-------|
| Oferta Directa | Bold price, red/yellow urgency, discount badge |
| Hero Producto | Clean background, large product, key benefits |
| Social Proof | Star rating, testimonial overlay |
| Beneficios Grid | Product center, benefit icons around |
| Flash Sale | Dark background, timer aesthetic, bold discount |
| Pet Friendly | Soft colors, friendly shapes, warm tones |

## New Pages

### `GenerateBanner.tsx` (`/products/:id/banner`)
Dark-themed card UI inspired by Zepol screenshots:
- Product image displayed (from existing product)
- Template gallery grid (click to select)
- Size selector: Instagram Stories (1080x1920), Instagram Square (1080x1080), Facebook (1200x628)
- Plan gate: show upgrade prompt for free users
- "Generar Banner" button → loading state → preview result
- Result shows generated image with Download PNG button + Save to gallery

### `Banners.tsx` (`/banners`)
Gallery grid of saved banners:
- Image thumbnail per card
- Download button
- Delete button
- Product name + date badge

## Navigation Updates

| File | Change |
|------|--------|
| `src/components/AppSidebar.tsx` | Add "Banners" nav item (Image icon) |
| `src/pages/Products.tsx` | Add "Generar Banner" button per product (only if starter/pro) |
| `src/App.tsx` | Add routes `/banners` and `/products/:id/banner` |

## Plan Gating

- **Free**: Cannot access banner generator. Show upgrade CTA.
- **Starter**: 5 banners/month
- **Pro**: 50 banners/month

Track usage via count of banners created this month (query `banners` table by `created_at`).

## Files Summary

| File | Action |
|------|--------|
| Migration SQL | Create `banners` table + `banner-images` bucket |
| `supabase/functions/generate-banner/index.ts` | New edge function |
| `supabase/config.toml` | Add `[functions.generate-banner]` |
| `src/components/banner/templates.ts` | New — template definitions |
| `src/components/banner/TemplateGallery.tsx` | New — visual template picker |
| `src/pages/GenerateBanner.tsx` | New — main generation page |
| `src/pages/Banners.tsx` | New — saved banners gallery |
| `src/App.tsx` | Add routes |
| `src/components/AppSidebar.tsx` | Add nav item |
| `src/pages/Products.tsx` | Add "Generar Banner" button |

## AI Model

Uses `google/gemini-3-pro-image-preview` via `LOVABLE_API_KEY` (already configured). No new secrets needed.

