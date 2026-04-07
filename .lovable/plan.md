

## Plan: Shopify OAuth Connection Flow

### Overview
Replace the manual API token input with a proper Shopify OAuth authorization flow. Users enter only their store domain, get redirected to Shopify for approval, and the token is saved automatically.

### Prerequisites (User Action Required)
Before implementation, you need a **Shopify App** registered in the Shopify Partners dashboard. This app provides:
- `SHOPIFY_API_KEY` (client ID)
- `SHOPIFY_API_SECRET` (client secret)

These will be stored as backend secrets. The app's redirect URI must point to:
`https://fizryssrfsojiavxmhrt.supabase.co/functions/v1/shopify-oauth-callback`

### Changes

**1. New edge function: `supabase/functions/shopify-oauth-callback/index.ts`**
- Handles Shopify's redirect after user approves
- Receives `code`, `shop`, `state` query params
- Validates `state` (contains user ID + nonce, stored temporarily)
- Exchanges `code` for permanent access token via `POST https://{shop}/admin/oauth/access_token`
- Upserts token into `shopify_connections` table using service role
- Redirects browser back to `/landings?shopify=connected`

**2. Update edge function: `supabase/functions/shopify-export/index.ts`**
- Add `action: "oauth-start"` — generates the Shopify OAuth authorize URL with scopes (`write_content,write_themes,read_products`), state param (user ID + nonce), and redirect URI
- Returns the URL for the frontend to redirect to
- Remove `action: "test-connection"` (no longer needed with OAuth)

**3. Database migration: add `shop_name` column + state storage**
- Add `shop_name text` column to `shopify_connections`
- Create `shopify_oauth_states` table (id, user_id, nonce, store_domain, created_at) with TTL cleanup — used to validate the OAuth callback

**4. Rewrite `src/components/landing/ShopifyConnectDialog.tsx`**
- Remove access token input field entirely
- Remove test connection button
- Keep only store domain input
- "Connect Shopify" button calls the edge function to get the OAuth URL, then redirects
- Show connected state: "Connected to mystore.myshopify.com" with disconnect option

**5. Update `src/components/landing/ExportPreviewDialog.tsx`**
- Check connection now also fetches `store_domain` to display it
- Show "Connected to {domain}" badge when connected

**6. Add route handler for OAuth return**
- In `src/pages/Landings.tsx` (or a dedicated callback page), detect `?shopify=connected` query param and show success toast

**7. Add secrets**
- `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET` — will prompt you to add these

### OAuth Flow Diagram
```text
User                    Nexsell                 Shopify
  |                        |                       |
  |-- enters domain ------>|                       |
  |                        |-- save state -------->|
  |                        |-- return auth URL --->|
  |<-- redirect to Shopify OAuth --------------->|
  |                        |                       |
  |-- approves scopes --->|                       |
  |                        |<-- callback + code ---|
  |                        |-- exchange code ----->|
  |                        |<-- access token ------|
  |                        |-- save to DB -------->|
  |<-- redirect to /landings?shopify=connected ----|
```

### Security
- Tokens never touch the frontend — exchanged and stored server-side only
- State parameter prevents CSRF attacks
- OAuth states expire after 10 minutes
- Access tokens stored in `shopify_connections` accessible only by the owning user (RLS)

### i18n Updates
- `shopify.connectWithOAuth`: "Connect with Shopify"
- `shopify.enterDomain`: "Enter your store URL"
- `shopify.connectedTo`: "Connected to {{domain}}"
- `shopify.oauthSuccess`: "Shopify connected successfully"

