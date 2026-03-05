
-- Add publishing columns to landings
ALTER TABLE public.landings ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;
ALTER TABLE public.landings ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE public.landings ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- Create landing_views table for analytics
CREATE TABLE public.landing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id uuid NOT NULL REFERENCES public.landings(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  referrer text,
  user_agent text
);

ALTER TABLE public.landing_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert views (anonymous visitors)
CREATE POLICY "Anyone can insert views" ON public.landing_views FOR INSERT WITH CHECK (true);

-- Only owners can read their analytics
CREATE POLICY "Owners can read views" ON public.landing_views FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.landings WHERE landings.id = landing_views.landing_id AND landings.user_id = auth.uid()));

-- Public can view published landings (anonymous access)
CREATE POLICY "Public can view published landings" ON public.landings FOR SELECT USING (published = true);
