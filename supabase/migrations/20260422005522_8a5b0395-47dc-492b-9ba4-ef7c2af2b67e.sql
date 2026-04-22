-- Update public_banner_showcase view to expose only banners created by super_admins (the Nexsell team)
-- This way the homepage shows real, high-quality banners produced by the official account.

DROP VIEW IF EXISTS public.public_banner_showcase;

CREATE VIEW public.public_banner_showcase
WITH (security_invoker = off) AS
SELECT
  b.image_url,
  b.created_at
FROM public.banners b
WHERE b.user_id IN (
  SELECT ur.user_id
  FROM public.user_roles ur
  WHERE ur.role = 'super_admin'
)
ORDER BY b.created_at DESC
LIMIT 12;

GRANT SELECT ON public.public_banner_showcase TO anon, authenticated;