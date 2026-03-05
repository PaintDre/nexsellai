ALTER TABLE public.profiles
ADD COLUMN banners_used integer NOT NULL DEFAULT 0,
ADD COLUMN banners_reset_at timestamp with time zone;