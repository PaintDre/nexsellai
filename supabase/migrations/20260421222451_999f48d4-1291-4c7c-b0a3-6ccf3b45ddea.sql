
-- =====================================================
-- 1. RLS HARDENING: demo_landings
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert demo landings" ON public.demo_landings;
CREATE POLICY "Anyone can insert demo landings"
ON public.demo_landings
FOR INSERT
TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND length(session_id) BETWEEN 8 AND 128
  AND pg_column_size(blocks) < 500000
  AND pg_column_size(product_data) < 100000
);

-- =====================================================
-- 2. RLS HARDENING: landing_views
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert views" ON public.landing_views;
CREATE POLICY "Anyone can insert views"
ON public.landing_views
FOR INSERT
TO anon, authenticated
WITH CHECK (
  landing_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.landings
    WHERE landings.id = landing_views.landing_id
      AND landings.published = true
  )
  AND (user_agent IS NULL OR length(user_agent) <= 500)
  AND (referrer IS NULL OR length(referrer) <= 1000)
);

-- =====================================================
-- 3. RLS HARDENING: target_audiences
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can insert audiences" ON public.target_audiences;
CREATE POLICY "Authenticated users can insert audiences"
ON public.target_audiences
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND name IS NOT NULL
  AND length(trim(name)) BETWEEN 2 AND 100
  AND usage_count = 0
);

-- =====================================================
-- 4. STORAGE: Restrict listing on public buckets
-- Public URLs still work (CDN bypasses RLS), only the
-- list/search API is restricted to owners and admins.
-- =====================================================

-- product-images
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Owners and admins can list product images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'product-images'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- banner-images
DROP POLICY IF EXISTS "Anyone can view banner images" ON storage.objects;
CREATE POLICY "Owners and admins can list banner images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'banner-images'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- dropi-ads
DROP POLICY IF EXISTS "Anyone can view dropi ads" ON storage.objects;
CREATE POLICY "Owners and admins can list dropi ads"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'dropi-ads'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);

-- dropi-videos (admins only — already a curated catalog)
DROP POLICY IF EXISTS "Public can view dropi videos" ON storage.objects;
CREATE POLICY "Admins can list dropi videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'dropi-videos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);
