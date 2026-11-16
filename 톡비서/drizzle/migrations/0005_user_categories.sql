CREATE TABLE public.user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🏷️',
  hint text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_categories TO authenticated;
GRANT ALL ON public.user_categories TO service_role;
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cats select" ON public.user_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own cats insert" ON public.user_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cats update" ON public.user_categories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own cats delete" ON public.user_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);