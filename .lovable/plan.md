

# Fix Remaining Bugs in Landing System

## Issues Found

### 1. GenerateLanding.tsx — Theme selector is decorative only
Line 128: `value="clean"` hardcoded, `onValueChange={() => {}}` does nothing. The user sees a theme dropdown but it has no effect.

**Fix:** Add `theme` state, wire the selector, and (optionally) pass theme to the edge function or store it with the landing.

### 2. Landings.tsx — Export ignores theme
Line 25: `generateLandingHTML(blocks, product, name)` — no theme parameter passed, always exports with default "clean".

**Fix:** Since the landing doesn't store theme preference, either: (a) add a theme column to landings table, or (b) prompt user to pick theme before export. Simplest: default to "clean" is acceptable for now, but we should at least pass `"clean"` explicitly.

### 3. Product images may show storage paths instead of URLs
`Products.tsx` line 45 uses `product.images[0]` directly. If images are stored as storage paths (not full URLs), they'll be broken. However, looking at `ProductForm.tsx` line 85-86, images are stored as public URLs (`getPublicUrl`), so this is actually fine.

## Files to Change

| File | Change |
|------|--------|
| `src/pages/GenerateLanding.tsx` | Wire theme selector to state variable |
| `src/pages/Landings.tsx` | Pass explicit theme to export (or add theme picker) |

These are minor 2-line fixes. No database changes needed.

