CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  kind text NOT NULL DEFAULT 'text',
  content text NOT NULL DEFAULT '',
  image_path text,
  summary text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '기타',
  has_date boolean NOT NULL DEFAULT false,
  detected_date timestamptz,
  remind_at timestamptz,
  remind_message text,
  tags text[] NOT NULL DEFAULT '{}',
  secretary_reply text NOT NULL DEFAULT '',
  reminded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes select" ON public.notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notes insert" ON public.notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own notes update" ON public.notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notes delete" ON public.notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX notes_user_created ON public.notes (user_id, created_at DESC);
CREATE INDEX notes_remind ON public.notes (remind_at) WHERE reminded = false;

CREATE POLICY "own shots read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'shots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own shots write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shots' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own shots delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shots' AND (storage.foldername(name))[1] = auth.uid()::text);