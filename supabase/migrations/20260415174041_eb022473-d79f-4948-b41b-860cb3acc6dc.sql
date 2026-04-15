
-- dropi_products table
CREATE TABLE public.dropi_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  image_main text,
  image_2 text,
  image_3 text,
  video_url text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dropi_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view dropi products"
  ON public.dropi_products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage dropi products"
  ON public.dropi_products FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_dropi_products_updated_at
  BEFORE UPDATE ON public.dropi_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- dropi_ad_generations table
CREATE TABLE public.dropi_ad_generations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  dropi_product_id uuid REFERENCES public.dropi_products(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dropi_ad_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ad generations"
  ON public.dropi_ad_generations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ad generations"
  ON public.dropi_ad_generations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all ad generations"
  ON public.dropi_ad_generations FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Storage bucket for generated ads
INSERT INTO storage.buckets (id, name, public) VALUES ('dropi-ads', 'dropi-ads', true);

CREATE POLICY "Anyone can view dropi ads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dropi-ads');

CREATE POLICY "Authenticated can upload dropi ads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'dropi-ads');
