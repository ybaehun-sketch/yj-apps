-- Bamboo Forest (bambooforest.app) stories table and private image bucket
create table if not exists public.bamboo_stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  body text not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bamboo_stories_published_created_idx
  on public.bamboo_stories (published, created_at desc);

alter table public.bamboo_stories enable row level security;

drop policy if exists "Public can read published bamboo stories" on public.bamboo_stories;
create policy "Public can read published bamboo stories"
  on public.bamboo_stories
  for select
  to anon, authenticated
  using (published = true);

grant usage on schema public to anon, authenticated, service_role;
grant select on public.bamboo_stories to anon, authenticated;
grant all on public.bamboo_stories to service_role;

insert into storage.buckets (id, name, public)
values ('bamboo-story-images', 'bamboo-story-images', false)
on conflict (id) do nothing;
