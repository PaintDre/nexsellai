

# Codebase Cleanup — Shared Constants, Utility, and Minor Fixes

## Changes

### 1. New file: `src/lib/constants.ts`
Shared constants only:
- `LANDING_LIMITS: Record<string, number>` — `{ free: 1, starter: 10, pro: 100 }`
- `BANNER_LIMITS: Record<string, number>` — `{ free: 2, starter: 30, pro: 150 }`
- `PRODUCT_CATEGORIES` — the `[{ value, label }]` array used in ProductForm, Onboarding, Index

### 2. New file: `src/lib/planUsage.ts`
Single utility function:
- `computeBannersUsed(profile: { banners_reset_at?: string | null; banners_used?: number | null } | null): number` — extracts the 30-day reset logic currently duplicated in Dashboard, SettingsPage, and GenerateBanner.

### 3. Modified files (import from shared, remove local duplicates)

| File | What changes |
|------|-------------|
| `Dashboard.tsx` | Replace local `planLimits`/`bannerLimits` with imports from constants. Replace inline banner-used calc with `computeBannersUsed`. Fix `icon: any` → `icon: React.ComponentType<{ className?: string }>` in QuickActionCard. |
| `SettingsPage.tsx` | Replace local `PLAN_LIMITS`/`BANNER_LIMITS` with imports. Replace inline banner-used calc with `computeBannersUsed`. |
| `GenerateBanner.tsx` | Replace local `BANNER_LIMITS` with import. Replace local `computeBannersUsed` with import from `planUsage.ts`. |
| `GenerateLanding.tsx` | Replace local `planLimits` with `LANDING_LIMITS` import. |
| `ProductForm.tsx` | Replace local `categories` with `PRODUCT_CATEGORIES` import. |
| `Onboarding.tsx` | Replace local `categories` with `PRODUCT_CATEGORIES` import. |
| `Index.tsx` | Replace local `categories` with `PRODUCT_CATEGORIES` import. |
| `ProductDetail.tsx` | Remove unused `Home` import. Remove duplicate `Link as BreadcrumbLink` import (just use `Link`). |
| `Banners.tsx` | Add try/catch to `handleDownload` (lines 124-133). |

### 4. Safety notes
- All changes are import swaps and dead-code removal — no logic changes.
- `computeBannersUsed` keeps the exact same calculation (30-day window check).
- The `any` → proper type on QuickActionCard icon is a narrowing, not a behavioral change.
- Banners.tsx try/catch adds error handling where there was none — strictly additive.

