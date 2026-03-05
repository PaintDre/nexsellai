CREATE POLICY "Public can view banners for showcase"
ON public.banners FOR SELECT
TO anon, authenticated
USING (true);