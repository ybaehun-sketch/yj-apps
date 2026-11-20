-- Usage ledger: server-only, survives reading deletion
CREATE TABLE public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reading_id uuid,
  kind text NOT NULL CHECK (kind IN ('reading','turn')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.usage_events TO service_role;
REVOKE ALL ON public.usage_events FROM anon, authenticated;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX usage_events_user_kind_time ON public.usage_events (user_id, kind, created_at);
CREATE INDEX usage_events_reading ON public.usage_events (reading_id, kind);

-- Backfill existing usage so limits stay accurate
INSERT INTO public.usage_events (user_id, reading_id, kind, created_at)
SELECT user_id, id, 'reading', created_at FROM public.readings;
INSERT INTO public.usage_events (user_id, reading_id, kind, created_at)
SELECT user_id, reading_id, 'turn', created_at FROM public.reading_messages WHERE role = 'user';

-- reading_messages: browser read-only
DROP POLICY IF EXISTS "own messages" ON public.reading_messages;
CREATE POLICY "read own messages" ON public.reading_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE INSERT, UPDATE, DELETE ON public.reading_messages FROM anon, authenticated;
REVOKE ALL ON public.reading_messages FROM anon;
GRANT SELECT ON public.reading_messages TO authenticated;
GRANT ALL ON public.reading_messages TO service_role;

-- wallets / payments: read-only for owners, writes only by server
REVOKE INSERT, UPDATE, DELETE ON public.wallets FROM anon, authenticated;
REVOKE ALL ON public.wallets FROM anon;
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon, authenticated;
REVOKE ALL ON public.payments FROM anon;
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
REVOKE ALL ON public.readings FROM anon;

-- spend_leaf: server-only
REVOKE EXECUTE ON FUNCTION public.spend_leaf() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_leaf() TO service_role;