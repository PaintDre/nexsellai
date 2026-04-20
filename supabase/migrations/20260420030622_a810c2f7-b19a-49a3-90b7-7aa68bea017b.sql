-- 1) Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view banners for showcase" ON public.banners;

-- 2) Ensure admins keep full read access on the base table
DROP POLICY IF EXISTS "Admins can view all banners" ON public.banners;
CREATE POLICY "Admins can view all banners"
  ON public.banners
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );

-- 3) Create a safe public view exposing ONLY image_url + created_at
DROP VIEW IF EXISTS public.public_banner_showcase;
CREATE VIEW public.public_banner_showcase
WITH (security_invoker = on) AS
  SELECT image_url, created_at
  FROM public.banners
  ORDER BY created_at DESC
  LIMIT 100;

-- 4) Allow anonymous + authenticated reads of the safe view only
GRANT SELECT ON public.public_banner_showcase TO anon, authenticated;