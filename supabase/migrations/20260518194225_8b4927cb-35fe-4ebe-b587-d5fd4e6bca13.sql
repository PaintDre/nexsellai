ALTER TABLE public.landings
  ADD COLUMN IF NOT EXISTS shopify_page_id text,
  ADD COLUMN IF NOT EXISTS shopify_page_handle text,
  ADD COLUMN IF NOT EXISTS shopify_product_id text,
  ADD COLUMN IF NOT EXISTS shopify_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_landings_shopify_page_id ON public.landings(shopify_page_id) WHERE shopify_page_id IS NOT NULL;