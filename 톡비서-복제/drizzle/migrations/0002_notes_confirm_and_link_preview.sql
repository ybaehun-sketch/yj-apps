ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS confirmed boolean NOT NULL DEFAULT true;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS link_url text;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS link_title text;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS link_description text;
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS link_image text;