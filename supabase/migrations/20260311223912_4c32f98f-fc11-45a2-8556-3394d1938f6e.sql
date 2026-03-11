-- Add currency and provider columns to payments table
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'CLP',
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'mercadopago';

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert/update subscriptions (via edge functions)
CREATE POLICY "Service can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Service can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  TO public
  USING (true);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));