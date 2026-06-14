GRANT EXECUTE ON FUNCTION public.charge_credits(uuid, integer, text, uuid, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.grant_monthly_credits(uuid, text, integer, boolean) TO authenticated, service_role;