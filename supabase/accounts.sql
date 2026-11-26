-- WalkBCN accounts (optional): keep a visitor's progress on any device.
--
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to run again.
-- Setup steps (email, Google, Apple, addresses): docs/cuentas.md
--
-- One row per signed-in person with what the app already keeps in the browser: stories heard,
-- the learning loop (picks, plays, ratings, opt-out), challenge progress and the language.
-- Nothing else: no location, no route history, no analytics.
-- Anonymous "Play with friends" sessions cannot read or write it.

create table if not exists public.user_progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_progress_size check (pg_column_size(data) < 200000)
);

alter table public.user_progress enable row level security;

-- Only the owner, and only with a real account (not an anonymous game session).
drop policy if exists "own progress: read" on public.user_progress;
drop policy if exists "own progress: insert" on public.user_progress;
drop policy if exists "own progress: update" on public.user_progress;
drop policy if exists "own progress: delete" on public.user_progress;

create policy "own progress: read" on public.user_progress for select to authenticated
  using (user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy "own progress: insert" on public.user_progress for insert to authenticated
  with check (user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
create policy "own progress: update" on public.user_progress for update to authenticated
  using (user_id = auth.uid() and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false)
  with check (user_id = auth.uid());
create policy "own progress: delete" on public.user_progress for delete to authenticated
  using (user_id = auth.uid());

revoke all on public.user_progress from anon;
grant select, insert, update, delete on public.user_progress to authenticated;

-- "Delete my account" in the app: removes the account and, through the foreign key, its progress.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'not_signed_in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
