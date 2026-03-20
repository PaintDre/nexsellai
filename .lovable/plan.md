

## Plan: Improve Shopify Export

### Problem
The current export generates a full HTML page with `<html>`, `<head>`, `<body>` tags. When users paste this into Shopify's "Custom Liquid" or "Custom HTML" section, it breaks because Shopify already provides the page wrapper, causing style conflicts and broken layouts.

### Solution
Add a dedicated "Copy for Shopify" button that generates a self-contained HTML fragment (no `<!DOCTYPE>`, no `<head>`, no `<body>`) wrapped in a single `<div>` with scoped inline styles + a `<style>` block. Include clear instructions for the user.

### Changes

**1. `src/lib/exportLanding.ts`** — New function `generateShopifyHTML()`
- Generates only the content sections (no full page wrapper)
- Wraps everything in a scoped `<div class="nexsell-landing">` with a `<style>` block using that class as namespace to avoid Shopify theme conflicts
- Includes Google Fonts import via `<style>` instead of `<link>` in `<head>`
- Responsive media queries included inline in the style block
- Same section rendering logic but outputting a fragment, not a full document

**2. `src/components/landing/ExportPreviewDialog.tsx`** — Add Shopify export option
- Add a new "Copy for Shopify" button with a Shopify icon (store icon)
- When clicked, generates the Shopify-optimized fragment, copies to clipboard
- Show a brief instruction toast: "Paste this in a Custom Liquid section in Shopify"
- Reorder buttons: Copy HTML | Copy for Shopify | Download HTML | Download ZIP

**3. `src/i18n/locales/[es|en|pt].json`** — Add translation keys
- `exportDialog.copyShopify`: "Copiar para Shopify" / "Copy for Shopify" / "Copiar para Shopify"
- `exportDialog.shopifyCopied`: toast message with paste instructions

