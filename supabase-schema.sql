create table if not exists public.daily_growth_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.daily_growth_profiles enable row level security;

drop policy if exists "daily_growth_profiles_select_own" on public.daily_growth_profiles;
create policy "daily_growth_profiles_select_own"
on public.daily_growth_profiles
for select
using (auth.uid() = user_id);

drop policy if exists "daily_growth_profiles_insert_own" on public.daily_growth_profiles;
create policy "daily_growth_profiles_insert_own"
on public.daily_growth_profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "daily_growth_profiles_update_own" on public.daily_growth_profiles;
create policy "daily_growth_profiles_update_own"
on public.daily_growth_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
