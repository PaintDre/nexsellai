

## Plan: Shopify-Native Liquid Export System

### Overview
Replace the HTML export system with a Shopify-native Liquid template export. The landing will export as a proper Shopify section (`.liquid` file) with a JSON template, downloadable as a ZIP. The preview renderer remains untouched.

### What Gets Removed
- `exportLandingAsHTML()` function and its usage
- `generateLandingHTML()` — the full-page HTML generator (keep only theme color definitions used by preview iframe in the export dialog)
- "Copy HTML", "Download HTML", "Download ZIP" buttons from `ExportPreviewDialog`
- `exportLandingAsZip()` function (replaced by new Shopify ZIP)

### What Gets Added/Changed

**1. `src/lib/exportShopify.ts`** — New file, Shopify Liquid generator

Core function: `generateShopifyLiquid(blocks, theme)` that outputs a complete Liquid section file:
- Each block type (hero, benefits, features, testimonials, objections, faq, offer, urgency, cta, guarantee, comparison, bundles, microcopy) maps to a Liquid section with inline scoped CSS
- Uses Shopify dynamic objects: `{{ section.settings.hero_title }}`, `{{ section.settings.cta_label }}`, `{{ product.price | money }}`, etc.
- Includes working Add-to-Cart form: `<form action="/cart/add" method="post">` with `{{ product.variants.first.id }}`
- Includes a `{% schema %}` block at the bottom with editable settings (hero_title, subtitle, cta_label, benefits list, urgency_text, image, etc.) so merchants can edit inside Shopify Theme Editor
- Images use `{{ section.settings.hero_image | image_url: width: 800 }}` for Shopify-hosted images OR fall back to absolute Supabase public URLs as defaults in schema
- All CSS scoped under `.nexsell-landing` class with Google Fonts import
- Responsive media queries included

Helper function: `generateShopifyTemplate()` — returns JSON for `templates/page.nexsell.json`:
```json
{
  "sections": {
    "nexsell-landing": {
      "type": "nexsell-landing",
      "settings": {}
    }
  },
  "order": ["nexsell-landing"]
}
```

Helper function: `generateShopifyCSS(theme)` — optional extracted CSS for `assets/nexsell.css`

Export function: `exportShopifyZip(blocks, product, theme, allImageUrls)` — creates ZIP with:
- `sections/nexsell-landing.liquid`
- `templates/page.nexsell.json`
- `assets/nexsell.css` (optional)
- `README.md` with installation instructions

The schema settings will pre-populate with actual content from blocks (e.g., the hero title the user wrote becomes the default value), so the landing works immediately after upload.

**2. `src/lib/exportLanding.ts`** — Simplified
- Keep `normalizeImageUrl()` (used by Shopify export)
- Keep `generateLandingHTML()` ONLY for the preview iframe inside ExportPreviewDialog (it still needs to render a preview)
- Remove `exportLandingAsHTML()`, `exportLandingAsZip()`, `generateShopifyHTML()`

**3. `src/components/landing/ExportPreviewDialog.tsx`** — Redesigned UI
- Remove "Copy HTML", "Download HTML", "Download ZIP" buttons
- Two export options only:
  - **Primary**: "Export to Shopify" (green button) — uses the existing edge function + `ShopifyConnectDialog` flow to create a page directly (uses Liquid-compatible HTML fragment via edge function)
  - **Secondary**: "Download Liquid Template" — downloads the Shopify ZIP package with `.liquid` + `.json` files
- Keep iframe preview (still uses `generateLandingHTML` internally for visual preview only)
- Keep Shopify connection check + `ShopifyConnectDialog`

**4. `supabase/functions/shopify-export/index.ts`** — Update `create-page` action
- When creating a page, generate the HTML with normalized image URLs (absolute public Supabase URLs) and include Add-to-Cart form
- No structural changes needed; the edge function already creates pages via Shopify Admin API

**5. `src/i18n/locales/[es|en|pt].json`** — Update translation keys
- Remove HTML export keys
- Add: `exportDialog.downloadLiquid`, `exportDialog.liquidDownloaded`, `exportDialog.liquidInstructions`
- Update dialog title to reflect Shopify-native focus

### Image Handling
- All images in Liquid use `normalizeImageUrl()` to produce absolute Supabase public URLs as default values in schema settings
- Schema includes `image_picker` type settings so merchants can replace with Shopify-hosted images via Theme Editor
- No blob URLs, no base64, no temporary URLs

### Backward Compatibility
- `LandingRenderer.tsx` is NOT modified — preview continues working exactly as before
- Block structure in database remains the same
- The Liquid generator reads the same `blocks[]` array and maps each block type to Liquid output
- Old landings with any block structure still render in preview and export correctly

### Technical Reference (PageFly/GemPages/Zipoli inspired)
- Like PageFly: sections are self-contained with schema settings editable in Theme Editor
- Like GemPages: single section file approach (not multi-section) for simplicity
- Add-to-Cart form follows Shopify's standard pattern used by all page builders
- Schema uses Shopify's standard setting types: `text`, `richtext`, `image_picker`, `url`, `checkbox`

