create table if not exists public.dream_guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  body text not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dream_guides enable row level security;

drop policy if exists "dream_guides public read published" on public.dream_guides;
create policy "dream_guides public read published"
  on public.dream_guides for select
  to anon, authenticated
  using (published = true);

insert into storage.buckets (id, name, public)
values ('dream-guide-images', 'dream-guide-images', false)
on conflict (id) do nothing;

grant select on public.dream_guides to anon, authenticated;
grant all on public.dream_guides to service_role;
