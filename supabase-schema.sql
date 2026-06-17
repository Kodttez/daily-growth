-- Daily Growth Cloud Sync schema
-- Run this in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  nickname_updated_at timestamptz,
  total_exp integer not null default 0,
  current_streak integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.daily_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  tasks jsonb not null default '[]'::jsonb,
  good_things jsonb not null default '["", "", ""]'::jsonb,
  improvements jsonb not null default '["", "", ""]'::jsonb,
  mood text not null default '',
  visited boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, entry_date)
);

create table if not exists public.reason_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('deleted', 'rescheduled', 'missed')),
  reason text not null,
  task_title text,
  category text,
  source_date date,
  target_date date,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.daily_entries enable row level security;
alter table public.reason_logs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_delete_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "profiles_delete_own"
on public.profiles for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "daily_entries_select_own" on public.daily_entries;
drop policy if exists "daily_entries_insert_own" on public.daily_entries;
drop policy if exists "daily_entries_update_own" on public.daily_entries;
drop policy if exists "daily_entries_delete_own" on public.daily_entries;

create policy "daily_entries_select_own"
on public.daily_entries for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "daily_entries_insert_own"
on public.daily_entries for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "daily_entries_update_own"
on public.daily_entries for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "daily_entries_delete_own"
on public.daily_entries for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "reason_logs_select_own" on public.reason_logs;
drop policy if exists "reason_logs_insert_own" on public.reason_logs;
drop policy if exists "reason_logs_update_own" on public.reason_logs;
drop policy if exists "reason_logs_delete_own" on public.reason_logs;

create policy "reason_logs_select_own"
on public.reason_logs for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "reason_logs_insert_own"
on public.reason_logs for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "reason_logs_update_own"
on public.reason_logs for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "reason_logs_delete_own"
on public.reason_logs for delete
to authenticated
using ((select auth.uid()) = user_id);
