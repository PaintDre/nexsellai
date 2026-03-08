

# Refactor: Landing Generation Edge Function (Phase 1)

## Summary

Extract the monolithic edge function into clean helper functions, add robust server-side validation/fallbacks, improve safety rules in the prompt, and fix the SaaS block type conflict — all without changing the endpoint contract.

## Single file: `supabase/functions/generate-landing/index.ts`

All helpers stay in the same file for Deno edge function compatibility.

### Helper functions to create

| Function | Purpose |
|---|---|
| `getPlanConfig(plan)` | Returns `{ blockTypes, blockCount, limits }` for free/starter/pro |
| `buildPlanSections(plan)` | Returns the plan-specific prompt section string |
| `buildSystemPrompt(params)` | Assembles the full system prompt from all parameters |
| `callOpenAI(apiKey, systemPrompt, productName)` | Calls OpenAI, returns raw JSON string or throws |
| `parseBlocks(raw)` | Safely parses JSON, extracts blocks array, returns `[]` on failure |
| `sanitizeBlock(block)` | Ensures each block has type/title/content/order with correct types |
| `validateFaqContent(content)` | Ensures FAQ content is `[{q, a}]` format |
| `validateBlocksForPlan(blocks, plan)` | Filters to allowed types, fills missing required blocks with fallbacks, reorders sequentially |
| `getFallbackBlocks(plan)` | Returns safe static fallback blocks for each plan |

### Validation logic (in `validateBlocksForPlan`)

1. Filter blocks to only allowed types for the plan (using `getPlanConfig`)
2. Ensure each block has `type` (string), `title` (string), `content` (string|array), `order` (number)
3. For `faq` blocks, validate content is `[{q, a}]`; if not, attempt conversion or use fallback
4. Remove duplicate block types (keep first)
5. Fill missing required blocks with safe fallbacks from `getFallbackBlocks`
6. Re-number `order` sequentially (1, 2, 3...)
7. Cap total blocks at plan limit

### Allowed block types per plan

```text
free:    [hero, benefits, cta]
starter: [hero, benefits, features, testimonials, objections, faq, urgency, cta]
pro:     [hero, benefits, features, testimonials, objections, comparison, bundles, offer, urgency, guarantee, faq, microcopy, cta]
```

These match exactly what `LandingRenderer.tsx` supports (lines 79-91).

### Safety prompt improvements

Add explicit rules to the system prompt:
- Do NOT invent specific testimonial names, dates, or quantified results — use generic trust phrases like "Nuestros clientes confirman..." instead
- Do NOT invent stock numbers ("solo quedan X")
- Do NOT invent competitor names or specific weaknesses
- Do NOT show discounted prices unless `hasOffer === true`
- Do NOT include guarantee details unless guarantee text is provided
- For comparison blocks, frame as category-level advantages, not named competitor attacks

### SaaS fix

Remove the `saas_` prefix block type generation entirely. For `category === "saas"`, add contextual copy instructions to the prompt but keep standard block types (`hero`, `benefits`, `features`, `faq`, `cta`). This ensures the renderer can display them without a parallel block taxonomy.

### Parsing & fallback protection

- Wrap `JSON.parse` in try/catch
- If parsing fails or blocks array is empty/invalid, return `getFallbackBlocks(plan)` instead of crashing
- Log the error server-side for debugging

### What stays unchanged

- CORS headers
- Auth flow (demo bypass, token validation, profile lookup)
- Plan limit enforcement
- Endpoint input shape `{ product, mode, intensity, hasOffer, guarantee, plan, demo }`
- Output shape `{ blocks: [...] }`
- OpenAI model and API call structure
- `config.toml` settings

## Files to modify

| File | Change |
|---|---|
| `supabase/functions/generate-landing/index.ts` | Full refactor with helpers, validation, safety, SaaS fix |

