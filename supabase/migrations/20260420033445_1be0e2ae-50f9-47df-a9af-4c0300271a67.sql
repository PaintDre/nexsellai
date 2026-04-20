DROP POLICY IF EXISTS "Authenticated users can increment usage_count" ON public.target_audiences;

CREATE POLICY "Authenticated users can increment usage_count"
ON public.target_audiences
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);