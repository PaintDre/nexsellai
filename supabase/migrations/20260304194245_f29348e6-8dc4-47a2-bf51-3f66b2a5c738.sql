
-- Add 'pets' to product_category enum
ALTER TYPE public.product_category ADD VALUE IF NOT EXISTS 'pets';

-- Create target_audiences table
CREATE TABLE public.target_audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Public read, authenticated insert
ALTER TABLE public.target_audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read audiences"
  ON public.target_audiences FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert audiences"
  ON public.target_audiences FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update usage_count"
  ON public.target_audiences FOR UPDATE
  TO authenticated
  USING (true);

-- Create product_audiences junction table
CREATE TABLE public.product_audiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  audience_id uuid NOT NULL REFERENCES public.target_audiences(id) ON DELETE CASCADE,
  UNIQUE(product_id, audience_id)
);

ALTER TABLE public.product_audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own product audiences"
  ON public.product_audiences FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND user_id = auth.uid())
  );

-- Create demo_landings table for guest sessions
CREATE TABLE public.demo_landings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  product_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_landings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert demo landings"
  ON public.demo_landings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read demo landings by session"
  ON public.demo_landings FOR SELECT
  TO anon, authenticated
  USING (true);
