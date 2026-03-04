

# Plan: Fix Landings Edit/Export, Cleanup Generate UI, Improve Sidebar UX

## Issues Found

1. **Edit button broken**: Links to `/landings/:id/edit` but no route exists for it
2. **Export button does nothing**: No click handler, just a static `<Button>`
3. **Generate page shows "Modo de escritura" selector**: Should be hidden, auto-set to best mode
4. **Admin user management**: Plan/role changes save immediately via API (already works), but console shows ref warnings on Select components
5. **Sidebar has Settings/Sistema cluttering nav**: Should move settings + logout to user profile area

## Changes

### A) Landing View Page — New route `/landings/:id`

**Create `src/pages/LandingView.tsx`**
- Accepts `:id` param, fetches landing from `supabase.from("landings").select("*").eq("id", id).eq("user_id", user.id).single()`
- Reuses the same rendering logic as `LandingPreview.tsx` (Hero, Benefits, Features, Testimonials, Objections, Offer/Urgency, Guarantee, FAQ, Microcopy, Final CTA)
- Top bar: "Volver a mis landings" button + Export button
- Loading spinner while fetching, error state if not found
- Fetches product data from `products` table using `landing.product_id` for price display

**Update `src/App.tsx`**
- Add route: `/landings/:id` inside ProtectedLayout (renders `LandingView`)

**Update `src/pages/Landings.tsx`**
- Change Edit link from `/landings/${landing.id}/edit` to `/landings/${landing.id}`
- Add export handler to Export button (same logic as in LandingView)

### B) Export Handler

**In `Landings.tsx` and `LandingView.tsx`**
- Build a self-contained HTML string from the landing blocks (inline CSS, no JS)
- Create Blob, use `URL.createObjectURL` + programmatic `<a>` click to trigger download
- Loading state while generating, success/error toasts
- Name file: `{landing.name}.html`

### C) Remove "Modo de escritura" from GenerateLanding

**Edit `src/pages/GenerateLanding.tsx`**
- Remove the mode `Select` UI (lines 105-114)
- Keep `mode` state hardcoded to `"aida"` (best for conversion)
- Mode still sent in the API payload, just not user-selectable

### D) Move Settings/Logout to User Profile Area in Sidebar

**Edit `src/components/AppSidebar.tsx`**
- Remove "Ajustes" from main navItems
- In the bottom user area, add a settings icon button linking to `/settings`
- Keep logout button in the same area
- Keep Admin/Sistema in nav (admin-only items stay in sidebar)

### E) Fix Select ref warning in AdminUsers

**Edit `src/pages/AdminUsers.tsx`**
- The warning is about giving refs to Select (function component). This is cosmetic from Radix. No functional fix needed — already uses `key` prop for re-render. Low priority, won't address unless it causes real issues.

## Files to Create
- `src/pages/LandingView.tsx`

## Files to Modify
- `src/App.tsx` — add `/landings/:id` route
- `src/pages/Landings.tsx` — fix Edit link, add Export handler
- `src/pages/GenerateLanding.tsx` — remove mode selector UI
- `src/components/AppSidebar.tsx` — move settings to user profile area

