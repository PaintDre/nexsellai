

## Plan: DROPI — Private Product Media Catalog Module

### Overview
Build a new internal module called "DROPI" within Nexsell. It provides a private product media catalog where authenticated users browse products (with images/videos), download assets, and generate ad images for Facebook/Instagram. Products are imported by admins via Excel upload.

### Database Changes (Migration)

**1. `dropi_products` table**
- `id uuid PK`, `name text`, `image_main text`, `image_2 text`, `image_3 text`, `video_url text`, `category text`, `created_at timestamptz`, `updated_at timestamptz`
- RLS: authenticated users can SELECT; admins can ALL

**2. `dropi_ad_generations` table** (tracks free trial usage)
- `id uuid PK`, `user_id uuid NOT NULL`, `dropi_product_id uuid REFERENCES dropi_products`, `created_at timestamptz`
- RLS: users can SELECT/INSERT own rows; admins can SELECT all

**3. Storage bucket**: `dropi-ads` (public) for generated ad images

### Edge Function

**`generate-dropi-ads/index.ts`**
- Receives: product data (images, name), options (show name toggle, badge type)
- Uses Lovable AI (gemini-2.5-flash-image) to generate 9 variations:
  - 3 formats: 1:1 (1080x1080), 4:5 (1080x1350), 9:16 (1080x1920)
  - 3 variations per format (different placements)
- Returns image URLs or base64, client bundles into ZIP
- Validates plan: checks `dropi_ad_generations` count for free users (1 lifetime max)

### Admin Edge Function Update

**`admin-api/index.ts`** — Add `upload-dropi-catalog` action
- Receives Excel file (parsed client-side with SheetJS)
- Upserts rows into `dropi_products` (match by name or replace all)

### Frontend Pages

**1. `src/pages/Dropi.tsx`** — Product grid dashboard
- Fetches all `dropi_products`
- Card grid: main image + product name
- Search/filter by category
- Mobile responsive grid (1-2-3-4 cols)

**2. `src/pages/DropiProduct.tsx`** — Product detail page
- Image gallery viewer (main + image_2 + image_3)
- Video player (if video_url exists)
- "Download Images" button → ZIP of all images
- "Download Video" button → direct download
- "Generate Ad Images" button → opens config modal

**3. `src/pages/AdminDropiCatalog.tsx`** — Admin Excel upload page
- File upload for Excel (.xlsx)
- Parses client-side with SheetJS, sends rows to edge function
- Shows current product count and last upload date
- Manual video URL edit per product

### Frontend Components

**`src/components/dropi/AdGeneratorModal.tsx`**
- Toggle: product name ON/OFF
- Toggle: promotional badge ON/OFF
- Badge options: OFERTA, NUEVO, TOP VENTAS, RECOMENDADO
- "Generate" button → calls edge function
- Shows progress, then download ZIP of 9 images
- Free plan check: if `dropi_ad_generations` count >= 1, show upgrade modal instead

**`src/components/dropi/ProductCard.tsx`** — Grid card component

**`src/components/dropi/ImageGallery.tsx`** — Lightbox-style gallery

### Routing Changes (`App.tsx`)
- `/dropi` → `Dropi.tsx` (inside ProtectedLayout)
- `/dropi/:id` → `DropiProduct.tsx` (inside ProtectedLayout)
- `/admin/dropi` → `AdminDropiCatalog.tsx` (inside AdminLayout)

### Sidebar Changes (`AppSidebar.tsx`)
- Add "DROPI" nav item with a package/box icon after Banners
- Add "DROPI Catalog" in admin section

### Plan Restriction Logic
- All authenticated users: view products, download images/videos
- Starter/Pro: unlimited ad generations
- Free: 1 lifetime generation, then upgrade modal with Spanish copy as specified

### i18n Updates
- Add `dropi.*` keys to en.json, es.json, pt.json for all labels, modal text, buttons

### Technical Details
- Excel parsing: `xlsx` (SheetJS) library added to dependencies, parsed client-side
- ZIP download: `JSZip` + `file-saver` (already likely available or add)
- Image generation: Lovable AI gateway with gemini-2.5-flash-image model
- All product images stored as external URLs (Google Drive, CDN) — no re-upload needed

