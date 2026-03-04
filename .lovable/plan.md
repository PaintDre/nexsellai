

# Fix: PATCH Requests Failing on admin-api (CORS)

## Root Cause

The `PATCH` requests to `admin-api/users/.../plan` fail with "Failed to fetch" while `GET` requests work fine. This is a **CORS preflight failure**.

The `corsHeaders` object is missing the `Access-Control-Allow-Methods` header. When the browser sends an OPTIONS preflight for PATCH (a non-simple method), the server doesn't declare PATCH as allowed, so the browser blocks the actual request.

GET works because simple GET requests don't require a preflight with allowed methods.

## Fix

**File: `supabase/functions/admin-api/index.ts`** (line 4-7)

Add `Access-Control-Allow-Methods` to the CORS headers:

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};
```

That's the only change needed. The edge function will be redeployed automatically.

