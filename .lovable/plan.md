

# Refactor GenerateBanner Component

## Summary
Clean up the 559-line monolithic component by extracting helpers, improving error handling, and adding safer state management -- all while preserving the exact same 3-step UX and generation flow.

## Changes

### 1. Extract utility helpers (top of same file)
- `getSequence(count)` — already exists, keep as-is
- `getTemplateName(id)` — already exists, keep as-is  
- `computeBannersUsed(profile)` — extract the monthly reset logic from the useEffect into a pure function
- `downloadBanner(banner, productName, outputSize)` — extract fetch+blob+download logic with try/catch
- `buildBannerPayload(product, description, customText, templateId, outputSize, index, total)` — extract the body construction for the edge function call

### 2. Improve product loading
- Add error handling to the product fetch (currently ignores errors silently)
- Add a `productError` state to show a user-friendly message when product is not found or unauthorized
- Show a "Producto no encontrado" card with a back button instead of infinite spinner

### 3. Improve state organization
- Group related state into a `formState` object: `{ description, customText, bannerCount, outputSize }`
- Use `useCallback` for `handleGenerate`, `handleDownload`, `handleDownloadAll` to avoid unnecessary re-creations
- Memoize `sequence`, `bannersRemaining`, `hasReachedLimit` with `useMemo`

### 4. Improve generation logic
- Wrap individual banner generation in try/catch so one failure doesn't kill the entire batch (use `Promise.allSettled` instead of `Promise.all`)
- Show partial results: if 2 of 3 succeed, display the 2 and toast a warning about the failed one
- Add download error handling (currently `handleDownload` has no try/catch)

### 5. Defensive improvements
- Safe access to `product.images` with `product.images?.[0]` 
- Guard against `product.price` being undefined in the header display
- Guard `handleDownload` with try/catch + toast on failure

### 6. Minor cleanup
- Remove the redundant `sequence` variable computed outside the JSX (line 185) — use the memoized version
- Consistent naming

## Files to modify

| File | Change |
|---|---|
| `src/pages/GenerateBanner.tsx` | Full refactor with extracted helpers, better error handling, memoization, allSettled |

## What stays unchanged
- 3-step wizard UX (Descripcion → Cantidad → Generar)
- SEQUENCES mapping, STEPS, BANNER_LIMITS constants
- Supabase invocation pattern and payload shape
- Preview modal behavior
- Plan limits logic
- All UI components and design language

