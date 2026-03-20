

## Plan: Professional Shopify Export with Reliable Images

### Problem
Images break when exported to Shopify because the base64 approach produces HTML too large for Shopify's Custom Liquid sections, and fetching images client-side can fail due to CORS. Meanwhile, the product images in Supabase storage are in a **public bucket** — their URLs should work directly in Shopify without any conversion.

### Root Cause
The code tries to convert images to base64 (heavy, fragile) instead of simply ensuring all image references use their full public Supabase storage URLs, which are already accessible from anywhere.

### Solution
Two-tier approach:
1. **Fix image URLs** — Ensure all exported HTML uses absolute public Supabase storage URLs (no blob/relative/preview URLs)
2. **Add Shopify store connection** — Create a "Direct Export to Shopify" flow via Shopify Admin API to automatically create a page on the user's store

---

### Changes

**1. `src/lib/exportLanding.ts`** — Fix `generateShopifyHTML`
- Remove the base64 conversion logic (too heavy, unreliable)
- Instead, ensure all image URLs are absolute public Supabase URLs by normalizing them through a helper
- For `product-images` bucket items stored as relative paths, construct the full public URL: `https://{project_id}.supabase.co/storage/v1/object/public/product-images/{path}`
- Keep the scoped `.nexsell-landing` wrapper and CSS
- Add a new export: `generateShopifyReadyHTML()` that returns the fragment with guaranteed public URLs

**2. `supabase/functions/shopify-export/index.ts`** — New edge function
- Accepts: Shopify store domain, access token, page title, HTML body
- Calls Shopify Admin API `POST /admin/api/2024-01/pages.json` to create a page
- Returns the created page URL
- Handles errors (invalid token, permission denied, etc.)

**3. `src/components/landing/ExportPreviewDialog.tsx`** — Redesigned export UI
- Replace the 4 small buttons with a cleaner layout:
  - **Primary action**: "Export to Shopify" button (green, prominent)
    - If no Shopify store connected → show connection modal
    - If connected → call edge function to create page, show success with link
  - **Secondary actions**: "Download HTML" and "Download ZIP" 
  - **Tertiary**: "Copy HTML" for manual paste
- Add a Shopify connection state (store domain + token stored in `profiles` or a new `shopify_connections` table)
- Loading states during export

**4. New: `src/components/landing/ShopifyConnectDialog.tsx`**
- Simple dialog asking for:
  - Shopify store URL (e.g., `mystore.myshopify.com`)
  - Admin API access token (with instructions on how to create one in Shopify admin → Settings → Apps → Develop apps)
- Saves credentials to database for future exports
- "Test connection" button to verify the token works

**5. Database migration** — New `shopify_connections` table
```sql
CREATE TABLE shopify_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_domain text NOT NULL,
  access_token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE shopify_connections ENABLE ROW LEVEL SECURITY;
-- Users can only manage their own connection
```

**6. `src/i18n/locales/[es|en|pt].json`** — New translation keys
- Shopify connect dialog labels, export success/error messages, instructions

### User Flow

1. User clicks "Export to Shopify" in the export dialog
2. First time → Shopify connect dialog appears with instructions to create an API token
3. User enters store domain + token → saved to database
4. System normalizes all image URLs to public Supabase URLs
5. Edge function calls Shopify Admin API to create a page with the landing HTML
6. Success toast with link to the new Shopify page
7. Subsequent exports skip step 2-3 (already connected)

Fallback: "Download Shopify-ready HTML" button downloads the HTML fragment with public image URLs for manual paste.

### Technical Details

- Images work because `product-images` bucket is public — URLs like `https://fizryssrfsojiavxmhrt.supabase.co/storage/v1/object/public/product-images/...` are accessible globally
- No base64 needed, keeping HTML lightweight and within Shopify's size limits
- Shopify Admin API access token is stored encrypted in the database, accessed only via edge function
- Edge function validates user auth before using stored credentials

