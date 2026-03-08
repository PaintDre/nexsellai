# Multi-Step AI Pipeline for Landing Generation (Phase 2)

## Architecture

The current single-call flow becomes a 3-step internal pipeline, all within the same edge function file. Each step calls OpenAI independently with a focused prompt. If any step fails, the pipeline degrades gracefully.

```text
Request → Auth/Plan validation (unchanged)
  ↓
Step 1: STRATEGY PLANNER → structured JSON strategy
  ↓ (fallback: default strategy object)
Step 2: BLOCK GENERATOR → raw blocks using strategy + product data
  ↓ (fallback: getFallbackBlocks)
Step 3: CRITIC / QA PASS → refined blocks with repetition/safety cleanup
  ↓ (fallback: return generator output as-is)
  ↓
validateBlocksForPlan → sanitize → Response { blocks: [...] }
```

## What changes

### New types

- `Strategy` interface: `{ primary_angle, tone, persuasion_level, awareness_level, key_objections[], section_emphasis Record<string, string>, category_context }` — returned by planner step
- `BlockWithMeta` extends `Block` with optional `_meta: { variant?, emphasis?, visual_intent? }` — internal only, stripped before response

### New helper functions (same file)


| Function                                     | Purpose                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `buildPlannerPrompt(params)`                 | Builds a short prompt that asks the AI to analyze product data and return a strategy JSON |
| `buildGeneratorPrompt(params, strategy)`     | Builds the block generation prompt, injecting the planner's strategy decisions            |
| `buildCriticPrompt(plan)`                    | Builds a QA prompt that reviews blocks for repetition, fake claims, and CTA clarity       |
| `runPlannerStep(apiKey, params)`             | Calls OpenAI with planner prompt, parses strategy, returns fallback on failure            |
| `runGeneratorStep(apiKey, params, strategy)` | Calls OpenAI with generator prompt, returns raw blocks                                    |
| `runCriticStep(apiKey, blocks, plan)`        | Calls OpenAI with critic prompt + blocks as input, returns refined blocks                 |
| `getDefaultStrategy(params)`                 | Returns a safe static strategy when planner fails                                         |


### Kept unchanged

- `getPlanConfig`, `getFallbackBlocks`, `validateBlocksForPlan`, `sanitizeBlock`, `validateFaqContent`, `parseBlocks`
- Auth flow, plan validation, CORS, env usage
- Output shape `{ blocks: [...] }`
- OpenAI model (`gpt-4o-mini`)

### Pipeline behavior

**Step 1 — Planner**: Asks AI to return ~200 tokens of structured JSON with marketing strategy decisions. Uses `temperature: 0.6` for consistency. If it fails → use `getDefaultStrategy()`.

**Step 2 — Generator**: Injects strategy into the existing prompt structure (replaces the generic tone/intensity section with planner-derived specifics). Same block format rules. Uses `temperature: 0.8`.

**Step 3 — Critic**: Sends the generated blocks back to the AI with a QA checklist prompt. The critic returns the same blocks array but with refined copy. Uses `temperature: 0.3` for precision. If it fails → skip, use generator output directly.

### Internal metadata (renderer preparation)

The generator prompt will ask the AI to include optional `_meta` fields per block. Before returning the response, the function will strip `_meta` from the output so the current frontend is unaffected. This prepares for future renderer upgrades without breaking anything today.

### Safety improvements in prompts

- Planner explicitly identifies which blocks are "risky" for the product (e.g., testimonials without real data) and flags them for safe alternatives
- Generator receives planner's safety flags and uses neutral trust copy for flagged blocks
- Critic has an explicit checklist: no fake names, no invented numbers, no unauthorized discounts, no medical claims

## File to modify


| File                                           | Change                                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `supabase/functions/generate-landing/index.ts` | Add pipeline steps, new prompt builders, strategy type, fallback strategy, critic step, metadata stripping |


## Cost consideration

Three OpenAI calls instead of one. Planner (200 tokens out) and Critic (same tokens as input) are lightweight. Total cost increase is ~2x for `gpt-4o-mini` which is very cheap. Latency increase ~2-4s total but quality improvement is significant.