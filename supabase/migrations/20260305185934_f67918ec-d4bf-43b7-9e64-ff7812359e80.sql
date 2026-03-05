CREATE TABLE public.landing_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_id uuid NOT NULL REFERENCES public.landings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  blocks jsonb NOT NULL DEFAULT '[]',
  theme text NOT NULL DEFAULT 'clean',
  version_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  label text
);
ALTER TABLE public.landing_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own versions" ON public.landing_versions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own versions" ON public.landing_versions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own versions" ON public.landing_versions FOR DELETE USING (auth.uid() = user_id);