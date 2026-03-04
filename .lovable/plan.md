

# Plan: Admin Panel Improvements + Settings Page Upgrade

## Bugs Found
1. **AdminDashboard.tsx (line 26-30)**: Dead code — calls `supabase.functions.invoke` then immediately makes a second `fetch` call. The first call is wasted.
2. **AdminUsers.tsx**: Plan/role changes fire immediately on select change with no confirmation. The `Select` uses `defaultValue` which doesn't update when `users` state refreshes (stale UI after re-fetch).
3. **AdminUsers.tsx**: No back button to return to admin dashboard.
4. **SettingsPage.tsx**: Minimal — only name edit, no plan info, no preferences, no help links.

## Changes

### 1. Fix & Improve `AdminDashboard.tsx`
- Remove dead `supabase.functions.invoke` call (lines 26-30)
- Keep only the direct `fetch` call

### 2. Improve `AdminUsers.tsx`
- Add "Volver" back button linking to `/admin`
- Replace `defaultValue` with `value` on Select components + track local state for pending changes
- Fix: use `key={u.user_id}` on Select to force re-render on data refresh
- Plan/role changes already save immediately via API (this works), but add proper error handling

### 3. Rebuild `SettingsPage.tsx` with 4 sections

**A) Account** — Name (editable), Email (read-only), Change password button (uses `supabase.auth.updateUser`), Delete account with confirmation dialog

**B) Plan & Usage** — Show current plan, landings used / limit (free=1, starter=10, pro=100), progress bar, "Upgrade" link to `/pricing`

**C) Generator Preferences** — Default intensity (soft/medium/hard) and framework (aida/standard) stored in `localStorage` (no DB migration needed — these are UI preferences)

**D) Help & Support** — Links to Shopify tutorial section (`/#shopify-tutorial`), report problem (mailto), documentation

### Files to modify
- `src/pages/AdminDashboard.tsx` — remove dead code
- `src/pages/AdminUsers.tsx` — add back button, fix Select rendering
- `src/pages/SettingsPage.tsx` — full rebuild with 4 sections

No database changes needed.

