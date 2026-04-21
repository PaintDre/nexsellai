CREATE TABLE public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'processing',
  processed_at TIMESTAMP WITH TIME ZONE,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_events_payment_id ON public.payment_events(payment_id);
CREATE INDEX idx_payment_events_status ON public.payment_events(status);

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Lock down: only service role (which bypasses RLS) may access.
CREATE POLICY "Service role only - select"
  ON public.payment_events FOR SELECT
  USING (false);

CREATE POLICY "Service role only - insert"
  ON public.payment_events FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Service role only - update"
  ON public.payment_events FOR UPDATE
  USING (false);

CREATE TRIGGER update_payment_events_updated_at
  BEFORE UPDATE ON public.payment_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();