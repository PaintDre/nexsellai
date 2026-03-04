

# Plan: Fix Admin User Plan/Role Save — Root Cause & Fix

## Root Cause Found

The network request log shows:
```
PATCH .../admin-api/users/.../plan → Error: Failed to fetch
```

The `admin-api` edge function is **missing from `supabase/config.toml`**. Only `generate-landing` has `verify_jwt = false`. Without this config, the default `verify_jwt = true` kicks in, which fails with the signing-keys system, causing the request to be rejected before the function code runs.

This is why Save Changes does nothing — the PATCH requests never reach the edge function handler.

## Changes

### 1. Fix `supabase/config.toml`
Add the admin-api function with `verify_jwt = false` (auth is already validated in code):
```toml
[functions.admin-api]
verify_jwt = false
```

### 2. Improve error logging in `AdminUsers.tsx`
- In `saveAllChanges`, read and display the actual error message from the response body on failure (currently it just checks `!res.ok` without reading why).

### 3. Redeploy edge function
The config change triggers automatic redeployment.

## Files to modify
- `supabase/config.toml` — add `[functions.admin-api]` section
- `src/pages/AdminUsers.tsx` — improve error reporting in `saveAllChanges`

No other changes needed. The edge function code, RBAC logic, frontend pending-changes state, and LandingView renderer are all already correctly implemented.

