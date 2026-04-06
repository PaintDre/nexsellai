

## Plan: Unify Shopify Export — Replace ZIP Download with Export Dialog on Landings List

### Problem
There are **two different export flows** in the app:

1. **`/landings` list page** → The "Shopify" button calls `handleExport()` which directly downloads a `.zip` file (lines 50-73 in `Landings.tsx`). No dialog, no Shopify connection option.

2. **Inside the preview/editor** (`ExportPreviewDialog`) → Opens a dialog where the user can connect their Shopify store and export directly, OR download the Liquid ZIP as a fallback.

These should be unified. The list page button should open the same `ExportPreviewDialog` instead of silently downloading a ZIP.

### Changes

**1. `src/pages/Landings.tsx`**
- Remove the `handleExport` function that downloads a ZIP directly
- Add state for the export dialog: `exportDialogOpen`, `selectedLanding`
- When the "Shopify" button is clicked, set the selected landing and open `ExportPreviewDialog`
- Pass the landing's blocks, product, theme, and image URLs to the dialog
- Import `ExportPreviewDialog`

This way, clicking "Shopify" on the list page opens the same professional dialog where users can:
- Connect their Shopify store
- Export directly to Shopify
- Or download the Liquid ZIP as a fallback

One unified flow everywhere.

### Technical Details
- `ExportPreviewDialog` already accepts `blocks`, `product`, `landingName`, `theme`, `productImage`, and `allImageUrls` as props — the list page has all this data available
- No new components needed — just reuse the existing dialog

