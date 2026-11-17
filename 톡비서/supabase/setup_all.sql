-- === 0000_migration.sql ===
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

-- === 0001_notes_audio_path.sql ===
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS audio_path text;

-- === 0002_notes_confirm_and_link_preview.sql ===
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS confirmed boolean NOT NULL DEFAULT true;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS link_url text;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS link_title text;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS link_description text;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS link_image text;

-- === 0003_chat_answers.sql ===
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

-- === 0004_notes_file_attachment.sql ===
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS file_path text, ADD COLUMN IF NOT EXISTS file_name text;

-- === 0005_user_categories.sql ===
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
-- === storage bucket ===
INSERT INTO storage.buckets (id, name, public) VALUES ('shots', 'shots', false) ON CONFLICT (id) DO NOTHING;
