

## Plan: Polish Landing Ecosystem — UI, Editor, Export

### Problems Identified

1. **Landings list page (`Landings.tsx`)** still exports raw HTML (line 41-61) — downloads `.html` file instead of Shopify Liquid ZIP
2. **LandingFullPreview** has hardcoded Spanish strings (lines 37, 74, 76, 95)
3. **LandingView top bar** is overcrowded with too many buttons crammed into one horizontal strip — poor UX on smaller screens
4. **ExportPreviewDialog** still generates HTML for the iframe preview and uses an old HTML-based approach for the "Export to Shopify" button (lines 111-135) — generates full HTML, extracts body, wraps in div — instead of using the Liquid-based export
5. **Editor toolbar** (BlockToolbar) is minimal and could look more polished

### Changes

**1. `src/pages/Landings.tsx`** — Replace HTML export with Shopify ZIP
- Change `handleExport` to use `exportShopifyZip` instead of `generateLandingHTML`
- Download as `.zip` instead of `.html`
- Update the export button icon/label

**2. `src/pages/LandingFullPreview.tsx`** — Fix hardcoded strings + improve toolbar
- Replace hardcoded Spanish with `useTranslation()` (already imported via `toast`)
- Add `useTranslation` import and use `t()` for all strings
- Make the floating toolbar more polished: add "Export to Shopify" label next to the download icon

**3. `src/pages/LandingView.tsx`** — Reorganize the top toolbar
- Group actions into logical clusters with separators:
  - Left: Back button + landing name
  - Center: Theme selector + device preview controls
  - Right: Action buttons grouped in a dropdown menu (Edit, AI Images, Duplicate, Delete, Version History, Export, Publish, Share)
- Use a `DropdownMenu` for secondary actions to reduce clutter
- Keep primary actions (Edit, Export, Publish) as visible buttons

**4. `src/components/landing/ExportPreviewDialog.tsx`** — Fix "Export to Shopify" to use Liquid
- The "Export to Shopify" button currently sends raw HTML to the edge function — update it to send the Liquid-generated Shopify HTML fragment (from `generateShopifyLiquid`) or better yet, generate a clean HTML fragment from the same export engine
- Remove the old `generateLandingHTML` → body extraction → manual wrapping approach
- Use `generateShopifyLiquid` output stripped of `{% schema %}` for the Shopify page creation (since Shopify Pages API accepts HTML, not Liquid)
- Actually, for direct Shopify API page creation, we need clean HTML (not Liquid tags) — so keep using `generateLandingHTML` but ensure images use `normalizeImageUrl` from `exportLanding.ts`
- Fix the actual problem: the HTML sent to Shopify must have all images as absolute public URLs

**5. `src/components/landing/LandingRenderer.tsx`** — Minor polish
- Ensure the editor mode has visible section boundaries with a subtle dashed border
- Add section labels visible in edit mode

**6. `src/components/landing/ResizablePreview.tsx`** — Minor polish
- Add width label for preset sizes (e.g., "375px" next to Mobile)

### Technical Details

- The key export bug is in `Landings.tsx` which still downloads `.html` — this is why the user sees HTML downloads
- `ExportPreviewDialog` correctly has the Shopify ZIP download button, but the direct "Export to Shopify" still uses HTML body extraction which loses styles
- For the Shopify API page creation, we need a self-contained HTML fragment (not Liquid) with inline styles and absolute image URLs — the current `generateLandingHTML` approach is correct for this, just needs proper image normalization applied consistently
- The `normalizeImageUrl` function in `exportLanding.ts` correctly handles relative paths → absolute Supabase URLs

