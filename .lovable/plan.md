

## Plan: Add Share to Instagram & WhatsApp Buttons

### Overview
Add share buttons for Instagram and WhatsApp in two locations:
1. **GenerateBanner.tsx** — next to each banner's "Descargar" button and in the preview modal
2. **Banners.tsx** — in each banner card and in the preview modal

### How sharing works

- **WhatsApp**: Use `https://api.whatsapp.com/send?text=` with the banner image URL. This opens WhatsApp with a pre-filled message containing the image link. Works on both mobile and desktop.
- **Instagram**: Instagram doesn't support direct image sharing via URL. The best approach is:
  - On mobile: Use the **Web Share API** (`navigator.share()`) if available, which lets users pick Instagram from the native share sheet
  - Fallback: Download the image and show a toast saying "Image downloaded — open Instagram and paste it from your gallery"

### Changes

**1. Create `src/lib/shareBanner.ts`** — shared utility with two functions:
- `shareToWhatsApp(imageUrl, productName)` — opens WhatsApp with image link and product text
- `shareToInstagram(imageUrl, productName)` — tries Web Share API first, falls back to download + toast instruction

**2. Update `src/pages/GenerateBanner.tsx`**:
- Import share functions and Instagram/WhatsApp icons from lucide (`MessageCircle`, `Instagram` or use inline SVG)
- Add share buttons next to "Descargar" on each generated banner (~line 693-697)
- Add share buttons in the preview modal (~line 759-761)

**3. Update `src/pages/Banners.tsx`**:
- Add share buttons in `BannerCard` component next to "Ver" and "Bajar" buttons
- Add share buttons in the preview modal footer

### UI Details
- Two small icon buttons: WhatsApp (green) and Instagram (gradient pink/purple)
- Placed inline next to existing download buttons
- Responsive: same layout on mobile and desktop

