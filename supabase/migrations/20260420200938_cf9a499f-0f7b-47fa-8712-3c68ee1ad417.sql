
-- ============================================================
-- 1) Protect Shopify access tokens: clients must use a safe view
-- ============================================================
-- Drop the user SELECT policy so clients cannot read access_token directly
DROP POLICY IF EXISTS "Users can view own shopify connection" ON public.shopify_connections;

-- Create a SECURITY INVOKER view that excludes the access_token
CREATE OR REPLACE VIEW public.shopify_connections_safe
WITH (security_invoker = true) AS
SELECT id, user_id, store_domain, shop_name, created_at
FROM public.shopify_connections
WHERE user_id = auth.uid();

GRANT SELECT ON public.shopify_connections_safe TO authenticated;

-- ============================================================
-- 2) Stop exposing user_id on public landings table to anon
--    (a column-safe view `public_landings` already exists)
-- ============================================================
DROP POLICY IF EXISTS "Public can view published landings (no user_id)" ON public.landings;

-- Ensure the public_landings view is selectable by anon/authenticated
GRANT SELECT ON public.public_landings TO anon, authenticated;

-- ============================================================
-- 3) Restrict dropi-ads uploads to user-owned folders
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can upload dropi ads" ON storage.objects;

CREATE POLICY "Users can upload own dropi ads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dropi-ads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own dropi ads"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'dropi-ads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own dropi ads"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'dropi-ads'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- 4) Defensive: prevent privilege escalation via user_roles
--    Add a trigger to forbid any non-super_admin from changing roles,
--    even if a future RLS policy is misconfigured.
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role / supabase internals (no auth.uid())
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Only super_admins can insert/update/delete role rows
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super_admins can modify user roles';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS enforce_role_escalation_protection ON public.user_roles;
CREATE TRIGGER enforce_role_escalation_protection
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_escalation();
