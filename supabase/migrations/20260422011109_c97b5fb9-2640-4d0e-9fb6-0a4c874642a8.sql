-- =========================================================
-- 1. Tabla signup_fingerprints: 1 registro por persona real
-- =========================================================
CREATE TABLE public.signup_fingerprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  normalized_email TEXT NOT NULL UNIQUE,
  raw_email TEXT NOT NULL,
  email_domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_signup_fingerprints_domain ON public.signup_fingerprints(email_domain);

ALTER TABLE public.signup_fingerprints ENABLE ROW LEVEL SECURITY;

-- Solo service role puede leer/escribir
CREATE POLICY "Service role only - signup_fingerprints"
ON public.signup_fingerprints
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- =========================================================
-- 2. Función normalize_email
--    - lowercase
--    - elimina alias +xxx
--    - en Gmail/Googlemail: elimina puntos del local-part
-- =========================================================
CREATE OR REPLACE FUNCTION public.normalize_email(_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  lower_email TEXT;
  local_part TEXT;
  domain_part TEXT;
  at_pos INT;
BEGIN
  IF _email IS NULL OR length(trim(_email)) = 0 THEN
    RETURN NULL;
  END IF;

  lower_email := lower(trim(_email));
  at_pos := position('@' in lower_email);
  IF at_pos = 0 THEN
    RETURN lower_email;
  END IF;

  local_part := substring(lower_email FROM 1 FOR at_pos - 1);
  domain_part := substring(lower_email FROM at_pos + 1);

  -- Quitar +alias
  IF position('+' in local_part) > 0 THEN
    local_part := split_part(local_part, '+', 1);
  END IF;

  -- En Gmail/Googlemail los puntos no cuentan
  IF domain_part IN ('gmail.com', 'googlemail.com') THEN
    local_part := replace(local_part, '.', '');
    domain_part := 'gmail.com';
  END IF;

  RETURN local_part || '@' || domain_part;
END;
$$;

-- =========================================================
-- 3. Función is_disposable_email_domain
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_disposable_email_domain(_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  domain_part TEXT;
  blocked TEXT[] := ARRAY[
    'mailinator.com','tempmail.com','10minutemail.com','guerrillamail.com',
    'guerrillamail.net','guerrillamail.org','yopmail.com','throwawaymail.com',
    'getnada.com','nada.email','trashmail.com','dispostable.com',
    'sharklasers.com','maildrop.cc','mintemail.com','tempinbox.com',
    'fakeinbox.com','mytemp.email','mailcatch.com','mohmal.com',
    'temp-mail.org','temp-mail.io','tempmail.dev','spambox.us',
    'spamgourmet.com','emailondeck.com','mailnesia.com','mailbox.org',
    '10minutenmail.de','byom.de','minutemail.com','tempemail.net',
    'incognitomail.com','jetable.org','linshiyou.com','meltmail.com',
    'noclickemail.com','tempr.email','tafmail.com','tmail.ws',
    'tmpmail.org','tmpmail.net','wegwerfemail.de','wegwerf-emails.de',
    'inboxbear.com','mail-temp.com','tempmail.email','tempmailo.com',
    'bouncemail.com','grr.la','spam4.me'
  ];
BEGIN
  IF _email IS NULL THEN RETURN FALSE; END IF;
  domain_part := lower(split_part(_email, '@', 2));
  RETURN domain_part = ANY (blocked);
END;
$$;

-- =========================================================
-- 4. Trigger handle_new_user_fingerprint
--    Se ejecuta DESPUÉS de crear el auth.user
--    Bloquea el registro si:
--      - el dominio es desechable
--      - el email normalizado ya existe
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_fingerprint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm TEXT;
  domain_part TEXT;
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  IF public.is_disposable_email_domain(NEW.email) THEN
    RAISE EXCEPTION 'disposable_email_blocked'
      USING HINT = 'Por favor usa un correo personal válido.';
  END IF;

  norm := public.normalize_email(NEW.email);
  domain_part := lower(split_part(NEW.email, '@', 2));

  -- Si ya existe un fingerprint con el mismo normalized_email, bloquear
  IF EXISTS (
    SELECT 1 FROM public.signup_fingerprints
    WHERE normalized_email = norm
  ) THEN
    RAISE EXCEPTION 'duplicate_account_blocked'
      USING HINT = 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.';
  END IF;

  INSERT INTO public.signup_fingerprints (user_id, normalized_email, raw_email, email_domain)
  VALUES (NEW.id, norm, lower(NEW.email), domain_part);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_fingerprint
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_fingerprint();