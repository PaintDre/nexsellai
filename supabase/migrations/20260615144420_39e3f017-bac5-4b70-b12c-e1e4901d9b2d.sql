
CREATE TABLE public.launch_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  current_step text NOT NULL DEFAULT 'product',
  steps_completed jsonb NOT NULL DEFAULT '{}'::jsonb,
  assets jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.launch_jobs TO authenticated;
GRANT ALL ON public.launch_jobs TO service_role;

ALTER TABLE public.launch_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own launch_jobs"
ON public.launch_jobs FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_launch_jobs_updated_at
BEFORE UPDATE ON public.launch_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.launch_jobs;
ALTER TABLE public.launch_jobs REPLICA IDENTITY FULL;
