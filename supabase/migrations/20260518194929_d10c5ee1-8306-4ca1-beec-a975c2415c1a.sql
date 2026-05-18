
-- Revoke EXECUTE from public/anon/authenticated for all SECURITY DEFINER functions.
-- These functions are intended for triggers, RLS, or service-role only.
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'handle_new_user_role','has_role','prevent_target_audience_tampering',
        'prevent_role_escalation','get_showcase_banners','refund_credits',
        'normalize_email','update_updated_at_column','handle_new_user',
        'is_disposable_email_domain','handle_new_user_fingerprint',
        'charge_credits','grant_monthly_credits'
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated;',
                   fn.proname, fn.args);
  END LOOP;
END $$;

-- has_role is used inside RLS policies (runs as definer, no grant needed at API level).
-- Re-grant only what truly needs API access: none currently used from client.
