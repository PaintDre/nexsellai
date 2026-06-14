ALTER TABLE public.ai_influencers ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE public.ai_influencers ALTER COLUMN script DROP NOT NULL;