-- 1) Seed default Dropi ad limits (idempotent)
INSERT INTO public.system_config (key, value)
VALUES ('dropi_ads_limits', '{"free": 1, "starter": 30, "pro": 150}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2) Allow authenticated users to read this new limit key (same pattern as plan_limits/banner_limits)
DROP POLICY IF EXISTS "Authenticated can read plan limits" ON public.system_config;
CREATE POLICY "Authenticated can read plan limits"
  ON public.system_config
  FOR SELECT
  TO authenticated
  USING (key = ANY (ARRAY['plan_limits', 'banner_limits', 'dropi_ads_limits']));