

## Plan: Fix Shopify Export — Embed Images as Base64

### Problem
When "Copy for Shopify" is used, image URLs point to backend storage. These URLs break when pasted into Shopify due to CORS/access restrictions, resulting in broken images as shown in the screenshot.

### Solution
Make the Shopify export **async** — fetch all images and convert them to **base64 data URIs** that are embedded directly in the HTML. Also improve UX with a loading state and clearer instructions.

### Changes

**1. `src/lib/exportLanding.ts`** — Make `generateShopifyHTML` async with embedded images
- Convert `generateShopifyHTML` to `async` function
- Before generating HTML, fetch each image URL (hero + section `image_url` fields) using `fetchImageAsBlob` (already exists)
- Convert blobs to base64 data URIs using `FileReader`/`URL.createObjectURL`
- Replace image URLs in blocks with their base64 equivalents before generating HTML
- The resulting HTML fragment will have all images self-contained

**2. `src/components/landing/ExportPreviewDialog.tsx`** — Async Shopify copy with loading state
- Make `handleCopyShopify` async with a loading spinner (like ZIP export already does)
- Pass `allImageUrls` to the Shopify export function so it can embed the hero image too
- Add a brief instruction step or improved toast explaining where to paste in Shopify (e.g., "Copied! Paste in Shopify: Online Store → Pages → Custom Liquid section")

**3. `src/i18n/locales/[es|en|pt].json`** — Update toast messages
- Improve `shopifyCopied` message with clearer paste instructions

