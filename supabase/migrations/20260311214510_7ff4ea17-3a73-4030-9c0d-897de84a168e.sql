-- Allow authenticated users to read plan limits from system_config
CREATE POLICY "Authenticated can read plan limits"
ON public.system_config
FOR SELECT
TO authenticated
USING (key IN ('plan_limits', 'banner_limits'));