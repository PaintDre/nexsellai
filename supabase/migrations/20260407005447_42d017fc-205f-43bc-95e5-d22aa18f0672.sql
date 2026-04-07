
ALTER TABLE public.shopify_connections ADD COLUMN IF NOT EXISTS shop_name text;

CREATE TABLE IF NOT EXISTS public.shopify_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nonce text NOT NULL,
  store_domain text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shopify_oauth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON public.shopify_oauth_states FOR ALL USING (false);
