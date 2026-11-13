CREATE TABLE public.upload_code_attempts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_fingerprint TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.upload_code_attempts TO service_role;

ALTER TABLE public.upload_code_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.verify_upload_code(_code text, _ip_fingerprint text)
RETURNS TABLE(rate_limited boolean, owner_user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner uuid;
BEGIN
  IF (SELECT count(*) FROM public.upload_code_attempts
      WHERE ip_fingerprint = _ip_fingerprint AND NOT success
        AND created_at > now() - interval '15 minutes') >= 5 THEN
    RETURN QUERY SELECT true, NULL::uuid;
    RETURN;
  END IF;

  SELECT user_id INTO _owner FROM public.upload_codes WHERE code = _code;

  INSERT INTO public.upload_code_attempts (ip_fingerprint, success)
  VALUES (_ip_fingerprint, _owner IS NOT NULL);

  RETURN QUERY SELECT false, _owner;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_upload_code(text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_upload_code(text, text) TO service_role;