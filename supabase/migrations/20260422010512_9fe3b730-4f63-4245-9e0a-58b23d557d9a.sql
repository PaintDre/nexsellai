-- Create dropi_ad_jobs table for background processing
CREATE TABLE public.dropi_ad_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dropi_product_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress_total INTEGER NOT NULL DEFAULT 0,
  progress_done INTEGER NOT NULL DEFAULT 0,
  result_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  charge_transaction_id UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX idx_dropi_ad_jobs_user_id ON public.dropi_ad_jobs(user_id);
CREATE INDEX idx_dropi_ad_jobs_status ON public.dropi_ad_jobs(status);

-- Enable RLS
ALTER TABLE public.dropi_ad_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own jobs"
ON public.dropi_ad_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own jobs
CREATE POLICY "Users can insert own jobs"
ON public.dropi_ad_jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all jobs
CREATE POLICY "Admins can view all jobs"
ON public.dropi_ad_jobs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger to keep updated_at fresh
CREATE TRIGGER update_dropi_ad_jobs_updated_at
BEFORE UPDATE ON public.dropi_ad_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live polling
ALTER PUBLICATION supabase_realtime ADD TABLE public.dropi_ad_jobs;
ALTER TABLE public.dropi_ad_jobs REPLICA IDENTITY FULL;