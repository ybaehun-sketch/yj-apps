CREATE TABLE public.admin_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email text NOT NULL,
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_adjustments TO service_role;
ALTER TABLE public.admin_adjustments ENABLE ROW LEVEL SECURITY;