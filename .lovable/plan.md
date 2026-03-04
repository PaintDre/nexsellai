

# Update Edge Function Prompt

Replace the current `systemPrompt` in `supabase/functions/generate-landing/index.ts` with the user's comprehensive prompt. This is the full conversion-copywriting prompt that handles:

- Default 7-block sales structure for product landings
- AIDA vs Standard mode
- Intensity levels (low/medium/high mapped from soft/medium/hard)
- Plan-based feature gating (free: 3 blocks, starter: 8 blocks, pro: full suite)
- SaaS marketing landing context (category = "saas")
- Offer/guarantee logic
- Chilean Spanish, CLP pricing

## Changes

**File: `supabase/functions/generate-landing/index.ts`**
- Replace the `systemPrompt` variable and `planFeatures` object with the user's full prompt template
- Map the existing `intensity` values (soft/medium/hard) to the prompt's expected values (low/medium/high)
- Interpolate `product.*`, `mode`, `intensity`, `hasOffer`, `guarantee`, and `plan` into the prompt
- Remove the old `planFeatures` map since the new prompt embeds all plan logic inline

No database changes needed. No new files.

