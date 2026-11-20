CREATE OR REPLACE FUNCTION public.spend_leaf_for(_user_id uuid, _amount integer DEFAULT 1)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n integer;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'user required'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
  UPDATE public.wallets SET leaves = leaves - _amount, updated_at = now()
  WHERE user_id = _user_id AND leaves >= _amount RETURNING leaves INTO n;
  RETURN COALESCE(n, -1);
END $$;
REVOKE EXECUTE ON FUNCTION public.spend_leaf_for(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_leaf_for(uuid, integer) TO service_role;
COMMENT ON FUNCTION public.spend_leaf() IS 'DEPRECATED: replaced by spend_leaf_for (server-only)';