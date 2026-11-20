CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY,
  leaves integer NOT NULL DEFAULT 0,
  premium_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.payments (
  payment_id text PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.spend_leaf()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE public.wallets SET leaves = leaves - 1, updated_at = now()
  WHERE user_id = auth.uid() AND leaves > 0 RETURNING leaves INTO n;
  IF n IS NULL THEN RETURN -1; END IF;
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.spend_leaf() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.spend_leaf() TO authenticated;