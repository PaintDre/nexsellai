
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT null,
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT null,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, country_code, timezone, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country_code',
    NEW.raw_user_meta_data->>'timezone',
    COALESCE(NEW.raw_user_meta_data->>'currency', 'USD')
  );
  RETURN NEW;
END;
$function$;
