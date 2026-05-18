CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

ALTER POLICY "Admins can view all banners" ON public.banners
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all transactions" ON public.credit_transactions
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all ad generations" ON public.dropi_ad_generations
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all jobs" ON public.dropi_ad_jobs
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can manage dropi products" ON public.dropi_products
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can manage automation logs" ON public.email_automation_logs
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can manage automations" ON public.email_automations
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can manage campaigns" ON public.email_campaigns
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can manage email sends" ON public.email_sends
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all landings" ON public.landings
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can update any profile" ON public.profiles
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all profiles" ON public.profiles
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can view all subscriptions" ON public.subscriptions
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Super admins can delete config" ON public.system_config
  USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Super admins can insert config" ON public.system_config
  WITH CHECK (private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Super admins can read config" ON public.system_config
  USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Super admins can update config" ON public.system_config
  USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Admins can read all roles" ON public.user_roles
  USING (private.has_role(auth.uid(), 'admin'::public.app_role) OR private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Super admins can delete roles" ON public.user_roles
  USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Super admins can insert roles" ON public.user_roles
  WITH CHECK (private.has_role(auth.uid(), 'super_admin'::public.app_role));

ALTER POLICY "Super admins can update roles" ON public.user_roles
  USING (private.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF NOT private.has_role(auth.uid(), 'super_admin'::public.app_role) THEN
    RAISE EXCEPTION 'Only super_admins can modify user roles';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;