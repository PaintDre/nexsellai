-- Fix subscriptions: replace overly permissive INSERT/UPDATE policies with service-role-only
DROP POLICY IF EXISTS "Service can insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Service can update subscriptions" ON public.subscriptions;

CREATE POLICY "Service role only insert subscriptions" ON public.subscriptions
  FOR INSERT TO public
  WITH CHECK (false);

CREATE POLICY "Service role only update subscriptions" ON public.subscriptions
  FOR UPDATE TO public
  USING (false);

-- Fix payments: replace overly permissive INSERT/UPDATE policies  
DROP POLICY IF EXISTS "Service role can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can update payments" ON public.payments;

CREATE POLICY "Service role only insert payments" ON public.payments
  FOR INSERT TO public
  WITH CHECK (false);

CREATE POLICY "Service role only update payments" ON public.payments
  FOR UPDATE TO public
  USING (false);