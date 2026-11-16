CREATE TABLE public.chat_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  question text NOT NULL,
  answer text NOT NULL DEFAULT '',
  note_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_answers TO authenticated;
GRANT ALL ON public.chat_answers TO service_role;
ALTER TABLE public.chat_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own answers select" ON public.chat_answers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own answers insert" ON public.chat_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own answers delete" ON public.chat_answers FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX chat_answers_user_created ON public.chat_answers(user_id, created_at);