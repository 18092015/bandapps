CREATE TABLE public.upload_codes (user_id uuid PRIMARY KEY, code text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.upload_codes TO authenticated;
GRANT ALL ON public.upload_codes TO service_role;
ALTER TABLE public.upload_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own code read" ON public.upload_codes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.my_upload_code(_regenerate boolean DEFAULT false) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text; chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not signed in'; END IF;
  IF NOT _regenerate THEN SELECT code INTO c FROM upload_codes WHERE user_id = auth.uid(); IF c IS NOT NULL THEN RETURN c; END IF; END IF;
  LOOP
    c := ''; FOR i IN 1..6 LOOP c := c || substr(chars, 1 + floor(random()*length(chars))::int, 1); END LOOP;
    BEGIN
      INSERT INTO upload_codes(user_id, code) VALUES (auth.uid(), c) ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code, created_at = now();
      RETURN c;
    EXCEPTION WHEN unique_violation THEN END;
  END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.my_upload_code(boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.my_upload_code(boolean) TO authenticated;