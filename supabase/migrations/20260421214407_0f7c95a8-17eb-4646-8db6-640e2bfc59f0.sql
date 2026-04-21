
-- 1. Add credit columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits_balance integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_reset_at timestamptz,
  ADD COLUMN IF NOT EXISTS credits_plan_snapshot text;

-- 2. Credit transactions table (full audit log)
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL, -- negative = consumption, positive = grant/refund
  action text NOT NULL,    -- e.g. 'landing_text', 'banner_single', 'monthly_grant', 'refund'
  resource_id uuid,        -- optional link to landing/banner/etc
  balance_after integer NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_created
  ON public.credit_transactions(user_id, created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all transactions" ON public.credit_transactions;
CREATE POLICY "Admins can view all transactions"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
  );

-- No INSERT/UPDATE/DELETE policies → only service role can mutate.

-- 3. RPC: charge_credits (atomic, transactional)
CREATE OR REPLACE FUNCTION public.charge_credits(
  _user_id uuid,
  _amount integer,
  _action text,
  _resource_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
  new_balance integer;
  tx_id uuid;
BEGIN
  IF _amount < 0 THEN
    RAISE EXCEPTION 'amount must be non-negative';
  END IF;

  SELECT credits_balance INTO current_balance
  FROM public.profiles
  WHERE user_id = _user_id
  FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF current_balance < _amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'balance', current_balance,
      'required', _amount
    );
  END IF;

  new_balance := current_balance - _amount;

  UPDATE public.profiles
  SET credits_balance = new_balance,
      updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.credit_transactions (
    user_id, amount, action, resource_id, balance_after, metadata
  )
  VALUES (
    _user_id, -_amount, _action, _resource_id, new_balance, COALESCE(_metadata, '{}'::jsonb)
  )
  RETURNING id INTO tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', tx_id,
    'balance', new_balance,
    'charged', _amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.charge_credits(uuid, integer, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.charge_credits(uuid, integer, text, uuid, jsonb) TO service_role;

-- 4. RPC: refund_credits (used when a generation fails after charging)
CREATE OR REPLACE FUNCTION public.refund_credits(
  _transaction_id uuid,
  _reason text DEFAULT 'generation_failed'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tx RECORD;
  new_balance integer;
  refund_tx_id uuid;
BEGIN
  SELECT * INTO tx
  FROM public.credit_transactions
  WHERE id = _transaction_id
  FOR UPDATE;

  IF tx IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'transaction_not_found');
  END IF;

  IF tx.amount >= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_charge');
  END IF;

  -- Idempotent: if a refund already exists, do nothing
  IF EXISTS (
    SELECT 1 FROM public.credit_transactions
    WHERE metadata->>'refund_of' = _transaction_id::text
  ) THEN
    RETURN jsonb_build_object('success', true, 'already_refunded', true);
  END IF;

  UPDATE public.profiles
  SET credits_balance = credits_balance + ABS(tx.amount),
      updated_at = now()
  WHERE user_id = tx.user_id
  RETURNING credits_balance INTO new_balance;

  INSERT INTO public.credit_transactions (
    user_id, amount, action, resource_id, balance_after, metadata
  )
  VALUES (
    tx.user_id,
    ABS(tx.amount),
    'refund',
    tx.resource_id,
    new_balance,
    jsonb_build_object('refund_of', _transaction_id::text, 'reason', _reason)
  )
  RETURNING id INTO refund_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'refund_transaction_id', refund_tx_id,
    'balance', new_balance
  );
END;
$$;

REVOKE ALL ON FUNCTION public.refund_credits(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_credits(uuid, text) TO service_role;

-- 5. RPC: grant_monthly_credits (called by cron or on-demand on plan change)
CREATE OR REPLACE FUNCTION public.grant_monthly_credits(
  _user_id uuid,
  _plan text,
  _amount integer,
  _force boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prof RECORD;
  new_balance integer;
  tx_id uuid;
  should_grant boolean := false;
BEGIN
  IF _amount < 0 THEN
    RAISE EXCEPTION 'amount must be non-negative';
  END IF;

  SELECT * INTO prof
  FROM public.profiles
  WHERE user_id = _user_id
  FOR UPDATE;

  IF prof IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_not_found');
  END IF;

  -- Grant if forced, never granted, or last reset >= 30 days ago, or plan changed
  IF _force
     OR prof.credits_reset_at IS NULL
     OR prof.credits_reset_at < (now() - interval '30 days')
     OR COALESCE(prof.credits_plan_snapshot, '') <> _plan
  THEN
    should_grant := true;
  END IF;

  IF NOT should_grant THEN
    RETURN jsonb_build_object(
      'success', true,
      'skipped', true,
      'balance', prof.credits_balance,
      'next_reset', prof.credits_reset_at + interval '30 days'
    );
  END IF;

  -- Replace balance with the plan allowance (no rollover by default)
  new_balance := _amount;

  UPDATE public.profiles
  SET credits_balance = new_balance,
      credits_reset_at = now(),
      credits_plan_snapshot = _plan,
      updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.credit_transactions (
    user_id, amount, action, balance_after, metadata
  )
  VALUES (
    _user_id,
    _amount,
    'monthly_grant',
    new_balance,
    jsonb_build_object('plan', _plan, 'forced', _force)
  )
  RETURNING id INTO tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', tx_id,
    'balance', new_balance,
    'plan', _plan
  );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_monthly_credits(uuid, text, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_monthly_credits(uuid, text, integer, boolean) TO service_role;

-- 6. Seed system_config with credit costs, allowances and settings
INSERT INTO public.system_config (key, value)
VALUES (
  'credit_costs',
  '{
    "landing_text": 10,
    "landing_with_images": 25,
    "banner_single": 5,
    "banner_aida_pack": 30,
    "regenerate_block": 3,
    "regenerate_banner": 4,
    "design_critic": 2,
    "edit_banner_variation": 4,
    "dropi_image_single": 5,
    "dropi_image_pack_3": 12,
    "dropi_image_pack_5": 20,
    "dropi_ad_with_image": 8,
    "dropi_ad_pack_3": 22,
    "dropi_regenerate_image": 4,
    "shopify_export": 0,
    "publish_landing": 0
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.system_config (key, value)
VALUES (
  'credit_allowances',
  '{"free": 30, "starter": 300, "pro": 1500}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.system_config (key, value)
VALUES (
  'credit_settings',
  '{
    "reset_strategy": "monthly_rolling",
    "rollover_unused": false,
    "allow_topup_packs": false,
    "low_balance_warning_threshold": 20
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Allow authenticated users to read credit_costs (needed for UI hints)
DROP POLICY IF EXISTS "Authenticated can read plan limits" ON public.system_config;
CREATE POLICY "Authenticated can read plan limits"
  ON public.system_config
  FOR SELECT
  TO authenticated
  USING (key = ANY (ARRAY[
    'plan_limits'::text,
    'banner_limits'::text,
    'dropi_ads_limits'::text,
    'credit_costs'::text,
    'credit_allowances'::text,
    'credit_settings'::text
  ]));

-- 7. Grant initial credits to existing users based on their current plan
DO $$
DECLARE
  allowances jsonb;
  prof RECORD;
  amt integer;
BEGIN
  SELECT value INTO allowances FROM public.system_config WHERE key = 'credit_allowances';
  IF allowances IS NULL THEN
    RETURN;
  END IF;

  FOR prof IN SELECT user_id, plan FROM public.profiles WHERE credits_reset_at IS NULL LOOP
    amt := COALESCE((allowances->>prof.plan::text)::integer, (allowances->>'free')::integer);
    PERFORM public.grant_monthly_credits(prof.user_id, prof.plan::text, amt, true);
  END LOOP;
END $$;
