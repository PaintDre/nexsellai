-- 1) email_sends: allow users to read their own sends
CREATE POLICY "Users can view own email sends"
ON public.email_sends
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2) Storage: restrict banner-images uploads to the user's own folder
DROP POLICY IF EXISTS "Users can upload banner images" ON storage.objects;
CREATE POLICY "Users can upload own banner images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'banner-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) target_audiences: restrict UPDATE to incrementing usage_count only
DROP POLICY IF EXISTS "Authenticated users can increment usage_count" ON public.target_audiences;

CREATE OR REPLACE FUNCTION public.prevent_target_audience_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.name IS DISTINCT FROM OLD.name
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Only usage_count can be updated on target_audiences';
  END IF;
  IF NEW.usage_count < OLD.usage_count THEN
    RAISE EXCEPTION 'usage_count can only be incremented';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_target_audience_tampering ON public.target_audiences;
CREATE TRIGGER trg_prevent_target_audience_tampering
BEFORE UPDATE ON public.target_audiences
FOR EACH ROW
EXECUTE FUNCTION public.prevent_target_audience_tampering();

CREATE POLICY "Authenticated users can increment usage_count"
ON public.target_audiences
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4) landings: stop exposing user_id to anonymous visitors via a safe view
DROP POLICY IF EXISTS "Public can view published landings" ON public.landings;

CREATE OR REPLACE VIEW public.public_landings
WITH (security_invoker = true)
AS
SELECT
  id,
  name,
  slug,
  product_id,
  blocks,
  theme,
  mode,
  intensity,
  has_offer,
  guarantee,
  published_at,
  created_at,
  updated_at
FROM public.landings
WHERE published = true;

GRANT SELECT ON public.public_landings TO anon, authenticated;

-- Re-create a safe policy on landings so the view (security_invoker) works for anon
CREATE POLICY "Public can view published landings (no user_id)"
ON public.landings
FOR SELECT
TO anon, authenticated
USING (published = true);