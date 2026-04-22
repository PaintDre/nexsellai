-- Fix Security Definer View warning by switching to security_invoker=on
-- and using a SECURITY DEFINER function to safely expose only admin banners.

DROP VIEW IF EXISTS public.public_banner_showcase;

CREATE OR REPLACE FUNCTION public.get_showcase_banners()
RETURNS TABLE (image_url text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.image_url, b.created_at
  FROM public.banners b
  WHERE b.user_id IN (
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'super_admin'
  )
  ORDER BY b.created_at DESC
  LIMIT 12;
$$;

GRANT EXECUTE ON FUNCTION public.get_showcase_banners() TO anon, authenticated;

CREATE VIEW public.public_banner_showcase
WITH (security_invoker = on) AS
SELECT image_url, created_at
FROM public.get_showcase_banners();

GRANT SELECT ON public.public_banner_showcase TO anon, authenticated;