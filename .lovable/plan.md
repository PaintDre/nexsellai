

# Plan: Implement Missing Features

After comparing the 10 requirements against the current codebase, here is what exists and what needs to be built.

## Status

| Requirement | Status |
|---|---|
| 1. Landing structure (7 blocks) | Done in edge function prompt |
| 2. SaaS landing (Index page) | **Missing** - Index is a blank placeholder |
| 3. Demo mode (no account) | **Missing** - no guest generation flow |
| 4. Plan limits (Pro = 100) | **Partially done** - Pro is set to 999999, must be 100 |
| 5. Product form fields | Done |
| 6. Target audience database | **Missing** - currently a free text input |
| 7. Category "pets" | **Missing** - enum has home/fitness/beauty/gadget only |
| 8. JSON blocks output | Done |
| 9. Conversion optimization rules | Done in prompt |
| 10. Chilean Spanish + CLP | Done |

## Changes Required

### A. Database Migrations

1. **Add "pets" to `product_category` enum**
   ```sql
   ALTER TYPE product_category ADD VALUE 'pets';
   ```

2. **Create `target_audiences` table** for the audience database
   - Columns: `id`, `name` (text, unique), `usage_count` (integer, default 0)
   - Seed with the example audiences from the spec
   - Public read access (no RLS needed for reading suggestions)

3. **Create `product_audiences` junction table** to link products to multiple audiences (max 10)
   - Columns: `product_id` (FK), `audience_id` (FK)
   - RLS: users can manage audiences for their own products

4. **Add `demo_landings` table** for guest-generated landings stored by session/browser
   - Columns: `id`, `session_id` (text), `blocks` (jsonb), `product_data` (jsonb), `created_at`
   - No RLS (public insert, select by session_id)

### B. Fix Pro Plan Limit

- **Edge function**: Change `pro: 999999` to `pro: 100` in limits map
- **GenerateLanding.tsx**: Same fix in `planLimits`
- **Pricing.tsx**: Change "Landings ilimitadas" to "100 landings / mes"

### C. SaaS Landing Page (Index.tsx)

Build the public homepage with these sections:
- **Hero**: Value proposition + "Probar gratis" CTA
- **Benefits**: Fast generation, conversion-optimized, no coding
- **How it works**: 3 steps (upload → generate → export)
- **Demo section**: Inline mini-form (product name, category, description, audience) that generates a preview landing without login. Uses localStorage `demo_used` flag to limit to 1 generation. Export/download buttons redirect to `/register`.
- **Pricing**: Show 3 plans (Free: 1, Starter: 10, Pro: 100)
- **FAQ**
- **Final CTA**: "Crear cuenta"

### D. Demo Mode

- **New edge function endpoint** or modify existing: allow unauthenticated calls with `verify_jwt = false`, check a `demo` flag, apply free-tier prompt, and return blocks
- **Frontend**: Store demo landing in `demo_landings` table or localStorage. Show preview but lock export/download behind registration
- **Route**: Add `/demo` as a public route in App.tsx

### E. Target Audience Selector (ProductForm.tsx)

Replace the free-text `target_audience` input with:
- A searchable multi-select component querying `target_audiences` table
- Sorted by `usage_count` descending (most popular first)
- Max 10 selections
- Option to add a custom audience (inserts into table)
- On product save, increment `usage_count` for selected audiences and store selections in `product_audiences`
- Update `products.target_audience` to store a comma-joined string for backward compatibility with the edge function prompt

### F. Route Updates (App.tsx)

- Move `/` to render the new SaaS landing (Index.tsx) as a public route
- Add `/demo` as a public route
- Keep `/dashboard` behind ProtectedLayout

## Implementation Order

1. Database migrations (enum + tables)
2. Fix Pro limit (edge function + frontend)
3. Target audience selector component + ProductForm update
4. SaaS homepage (Index.tsx)
5. Demo mode (edge function update + demo page)

