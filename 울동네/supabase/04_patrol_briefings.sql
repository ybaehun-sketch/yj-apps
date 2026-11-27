-- 울동네 순찰 회차별(1차·2차·3차 / 본순찰·예비순찰) 브리핑 이력 테이블
create table if not exists public.uldongne_patrol_briefings (
  id uuid primary key default gen_random_uuid(),
  patrol_date date not null,
  slot text not null check (slot in ('slot_1', 'slot_2', 'slot_3')),
  patrol_type text not null check (patrol_type in ('main', 'reserve')),
  round_started_at text not null,
  checked_count integer not null default 0,
  success_count integer not null default 0,
  created_posts integer not null default 0,
  problem_targets jsonb not null default '[]'::jsonb,
  recovered_targets jsonb not null default '[]'::jsonb,
  failed_targets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (patrol_date, slot, patrol_type)
);

create index if not exists idx_uldongne_patrol_briefings_date
  on public.uldongne_patrol_briefings (patrol_date desc);

alter table public.uldongne_patrol_briefings enable row level security;

grant select, insert, update, delete on table public.uldongne_patrol_briefings to service_role;
grant select on table public.uldongne_patrol_briefings to anon, authenticated;

drop policy if exists "uldongne_briefings_public_read" on public.uldongne_patrol_briefings;
create policy "uldongne_briefings_public_read"
  on public.uldongne_patrol_briefings
  for select
  using (true);
