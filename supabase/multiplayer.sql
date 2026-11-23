-- WalkBCN multiplayer (Phase 3B): private rooms + Speed Race, for Supabase (Postgres 15+).
-- Paste the whole file in Supabase → SQL Editor → Run. Safe to run again.
--
-- Design
-- - Players are Supabase anonymous users (no account, no email): each phone gets its own id.
-- - Nobody writes to the tables directly: RLS is on with no policies, and table rights are
--   revoked. Everything goes through the functions below (security definer), which check that
--   the caller is in the room, act only on the caller's own row and use the server clock.
-- - Shared room logic (create, join, ready, start, leave, state) is separate from the Speed Race
--   rules (hint, complete), so other modes can reuse the room part later.
-- - Times and results come from the database clock (now()), not from the phones.
-- - Rooms expire 24 h after creation; expired rooms are deleted lazily when a room is created.

-- ---------- configuration (one place) ----------
create table if not exists public.mp_modes (
  mode text primary key,
  config jsonb not null              -- {min_players, max_players, hint_penalty_s}
);
insert into public.mp_modes (mode, config) values
  ('speed_race', '{"min_players": 2, "max_players": 5, "hint_penalty_s": 60}'),
  -- Time Attack: points per mission come from mp_challenges.points; an extra clue costs
  -- hint_cost points on that mission (never below min_points); the host picks a duration.
  ('time_attack', '{"min_players": 2, "max_players": 5, "hint_cost": 50, "min_points": 50, "durations": [30, 60, 90]}'),
  -- Bingo Battle: the first player with a full line (row, column or diagonal of the 3 × 3 board)
  -- wins; the game also ends when time runs out, then without a winner.
  ('bingo_battle', '{"min_players": 2, "max_players": 5, "durations": [60], "win": "first_line"}')
on conflict (mode) do update set config = excluded.config;

-- Challenges that can be played in a room: how many missions and extra clues each has
-- (must match data/challenges.js; scripts/check.mjs compares them).
create table if not exists public.mp_challenges (
  id text primary key,
  missions int not null,
  clues int[] not null               -- number of clues per mission
);
alter table public.mp_challenges add column if not exists mode text not null default 'speed_race';
alter table public.mp_challenges add column if not exists points int[];   -- Time Attack: points per mission
insert into public.mp_challenges (id, missions, clues, mode, points) values
  ('modernisme-hunt', 4, '{2,2,2,2}', 'speed_race', null),
  ('modernist-hunter', 7, '{2,2,2,2,2,2,2}', 'time_attack', '{150,100,100,150,150,200,150}'),
  ('rambla-bingo-battle', 9, '{1,1,1,1,1,1,1,1,1}', 'bingo_battle', null)
on conflict (id) do update set missions = excluded.missions, clues = excluded.clues, mode = excluded.mode, points = excluded.points;

-- ---------- tables ----------
create table if not exists public.mp_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  challenge_id text not null references public.mp_challenges(id),
  mode text not null references public.mp_modes(mode),
  host_id uuid not null,
  status text not null default 'waiting' check (status in ('waiting', 'running', 'finished')),
  config jsonb not null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz not null default now() + interval '24 hours'
);
alter table public.mp_rooms add column if not exists ends_at timestamptz;   -- Time Attack / Bingo Battle: scoring closes then
alter table public.mp_rooms add column if not exists winner_id uuid;         -- Bingo Battle
alter table public.mp_rooms add column if not exists winner_line int[];      -- Bingo Battle: the winning cells
create table if not exists public.mp_players (
  room_id uuid not null references public.mp_rooms(id) on delete cascade,
  user_id uuid not null,
  name text not null,
  ready boolean not null default false,
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished', 'left')),
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  progress int not null default 0,     -- missions completed
  hints int not null default 0,        -- extra clues used (each one adds the mode's penalty)
  alt int not null default 0,          -- missions completed without a location check
  finished_at timestamptz,
  primary key (room_id, user_id)
);
alter table public.mp_players add column if not exists points int not null default 0;          -- Time Attack
alter table public.mp_players add column if not exists last_score_at timestamptz;              -- Time Attack tie-break
-- One row per counted action: the unique key stops double clicks or retries counting twice.
create table if not exists public.mp_events (
  room_id uuid not null references public.mp_rooms(id) on delete cascade,
  user_id uuid not null,
  mission int not null,
  kind text not null check (kind in ('hint', 'complete')),
  n int not null default 0,            -- clue number for hints, 0 for completions
  method text,                         -- 'gps' or 'alt' for completions
  at timestamptz not null default now(),
  primary key (room_id, user_id, mission, kind, n)
);

alter table public.mp_modes enable row level security;
alter table public.mp_challenges enable row level security;
alter table public.mp_rooms enable row level security;
alter table public.mp_players enable row level security;
alter table public.mp_events enable row level security;
revoke all on public.mp_modes, public.mp_challenges, public.mp_rooms, public.mp_players, public.mp_events from anon, authenticated;

-- ---------- helpers ----------
create or replace function public.mp_me() returns uuid language sql stable as $$ select auth.uid() $$;

create or replace function public.mp_room_for(p_code text, p_member boolean default true)
returns public.mp_rooms language plpgsql stable security definer set search_path = public as $$
declare r public.mp_rooms;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select * into r from mp_rooms where code = upper(trim(p_code));
  if r.id is null or r.expires_at < now() then raise exception 'room_not_found'; end if;
  if p_member and not exists (select 1 from mp_players where room_id = r.id and user_id = auth.uid()) then
    raise exception 'not_in_room';
  end if;
  return r;
end $$;

create or replace function public.mp_clean_name(p_name text) returns text language plpgsql immutable as $$
declare n text := left(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'), 20);
begin
  n := trim(n);
  if length(n) < 1 then raise exception 'name_required'; end if;
  return n;
end $$;

-- A room ends when nobody is still playing.
create or replace function public.mp_maybe_finish(p_room uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from mp_players where room_id = p_room and status = 'playing') then
    update mp_rooms set status = 'finished', finished_at = coalesce(finished_at, now()) where id = p_room and status = 'running';
  end if;
end $$;

-- ---------- room (shared by every mode) ----------
drop function if exists public.mp_create_room(text, text, text);   -- replaced by the version with a duration
create or replace function public.mp_create_room(p_challenge text, p_mode text, p_name text, p_duration int default null)
returns text language plpgsql security definer set search_path = public as $$
declare c text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; i int; cfg jsonb; rid uuid;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select config into cfg from mp_modes where mode = p_mode;
  if cfg is null then raise exception 'unknown_mode'; end if;
  if not exists (select 1 from mp_challenges where id = p_challenge and mode = p_mode) then raise exception 'unknown_challenge'; end if;
  if cfg ? 'durations' then   -- timed modes (Time Attack, Bingo Battle)
    if p_duration is null or not (cfg->'durations') @> to_jsonb(p_duration) then raise exception 'bad_duration'; end if;
    cfg := cfg || jsonb_build_object('duration_min', p_duration);
  end if;
  if p_mode = 'time_attack' then cfg := cfg || jsonb_build_object('points', (select to_jsonb(points) from mp_challenges where id = p_challenge)); end if;
  delete from mp_rooms where expires_at < now() - interval '1 day';   -- lazy clean-up
  loop
    c := '';
    for i in 1..6 loop c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1); end loop;
    exit when not exists (select 1 from mp_rooms where code = c);
  end loop;
  insert into mp_rooms (code, challenge_id, mode, host_id, config)
    values (c, p_challenge, p_mode, auth.uid(), cfg || jsonb_build_object('missions', (select missions from mp_challenges where id = p_challenge)))
    returning id into rid;
  insert into mp_players (room_id, user_id, name) values (rid, auth.uid(), mp_clean_name(p_name));
  return c;
end $$;

create or replace function public.mp_join_room(p_code text, p_name text)
returns text language plpgsql security definer set search_path = public as $$
declare r public.mp_rooms; p public.mp_players;
begin
  r := mp_room_for(p_code, false);
  select * into p from mp_players where room_id = r.id and user_id = auth.uid();
  if p.user_id is not null then                       -- same phone coming back: no duplicate
    if p.status = 'left' and r.status = 'waiting' then
      update mp_players set status = 'waiting', ready = false, name = mp_clean_name(p_name), last_seen = now() where room_id = r.id and user_id = auth.uid();
    end if;
    return r.code;
  end if;
  if r.status <> 'waiting' then raise exception 'room_started'; end if;
  if (select count(*) from mp_players where room_id = r.id and status <> 'left') >= (r.config->>'max_players')::int then
    raise exception 'room_full';
  end if;
  insert into mp_players (room_id, user_id, name) values (r.id, auth.uid(), mp_clean_name(p_name));
  return r.code;
end $$;

create or replace function public.mp_set_ready(p_code text, p_ready boolean)
returns void language plpgsql security definer set search_path = public as $$
declare r public.mp_rooms;
begin
  r := mp_room_for(p_code);
  if r.status <> 'waiting' then raise exception 'room_started'; end if;
  update mp_players set ready = p_ready, last_seen = now() where room_id = r.id and user_id = auth.uid() and status = 'waiting';
end $$;

-- Only the host, only while waiting, only with enough players and all of them ready.
create or replace function public.mp_start(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.mp_rooms; n int; notready int;
begin
  r := mp_room_for(p_code);
  if r.host_id <> auth.uid() then raise exception 'not_host'; end if;
  if r.status <> 'waiting' then raise exception 'room_started'; end if;
  select count(*), count(*) filter (where not ready) into n, notready from mp_players where room_id = r.id and status = 'waiting';
  if n < (r.config->>'min_players')::int then raise exception 'not_enough_players'; end if;
  if notready > 0 then raise exception 'not_all_ready'; end if;
  update mp_rooms set status = 'running', started_at = now(),
    ends_at = case when r.config ? 'duration_min' then now() + make_interval(mins => (r.config->>'duration_min')::int) end where id = r.id;
  update mp_players set status = 'playing' where room_id = r.id and status = 'waiting';
end $$;

-- Leaving while waiting frees the place (the host role passes to the next player); leaving
-- during a game marks the player as abandoned.
create or replace function public.mp_leave(p_code text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.mp_rooms; next_host uuid;
begin
  r := mp_room_for(p_code);
  if r.status = 'waiting' then
    delete from mp_players where room_id = r.id and user_id = auth.uid();
    if r.host_id = auth.uid() then
      select user_id into next_host from mp_players where room_id = r.id and status <> 'left' order by joined_at limit 1;
      if next_host is null then delete from mp_rooms where id = r.id;
      else update mp_rooms set host_id = next_host where id = r.id; end if;
    end if;
  else
    update mp_players set status = 'left' where room_id = r.id and user_id = auth.uid() and status = 'playing';
    perform mp_maybe_finish(r.id);
  end if;
end $$;

-- Everything a phone needs to draw the room, with the server clock for the timer.
create or replace function public.mp_state(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.mp_rooms; pen int;
begin
  r := mp_room_for(p_code);
  if r.status = 'running' and r.ends_at is not null and now() >= r.ends_at then   -- Time Attack: time is up
    update mp_players set status = 'finished', finished_at = coalesce(finished_at, r.ends_at) where room_id = r.id and status = 'playing';
    update mp_rooms set status = 'finished', finished_at = r.ends_at where id = r.id;
    r := mp_room_for(p_code);
  end if;
  update mp_players set last_seen = now() where room_id = r.id and user_id = auth.uid();
  pen := coalesce((r.config->>'hint_penalty_s')::int, 0);
  return jsonb_build_object(
    'code', r.code, 'challenge', r.challenge_id, 'mode', r.mode, 'status', r.status, 'config', r.config,
    'host', r.host_id = auth.uid(), 'started_at', r.started_at, 'finished_at', r.finished_at, 'ends_at', r.ends_at, 'server_now', now(),
    'my_done', coalesce((select jsonb_agg(mission order by mission) from mp_events where room_id = r.id and user_id = auth.uid() and kind = 'complete'), '[]'::jsonb),
    'my_hints', coalesce((select jsonb_agg(distinct mission) from mp_events where room_id = r.id and user_id = auth.uid() and kind = 'hint'), '[]'::jsonb),
    'winner', (select name from mp_players where room_id = r.id and user_id = r.winner_id), 'winner_me', r.winner_id = auth.uid(), 'winner_line', to_jsonb(r.winner_line),
    'players', coalesce((select jsonb_agg(jsonb_build_object(
      'me', p.user_id = auth.uid(), 'name', p.name, 'host', p.user_id = r.host_id, 'ready', p.ready, 'status', p.status,
      'online', p.last_seen > now() - interval '20 seconds', 'progress', p.progress, 'hints', p.hints, 'alt', p.alt,
      'points', p.points, 'last_score_s', round(extract(epoch from p.last_score_at - r.started_at)),
      'time_s', case when p.finished_at is not null then round(extract(epoch from p.finished_at - r.started_at)) end,
      'adjusted_s', case when p.finished_at is not null then round(extract(epoch from p.finished_at - r.started_at)) + p.hints * pen end
    ) order by p.joined_at) from mp_players p where p.room_id = r.id), '[]'::jsonb));
end $$;

-- ---------- Speed Race rules ----------
-- An extra clue for the mission the player is on: counted once per clue, adds the penalty.
create or replace function public.mp_hint(p_code text, p_mission int, p_n int)
returns void language plpgsql security definer set search_path = public as $$
declare r public.mp_rooms; p public.mp_players; maxn int;
begin
  r := mp_room_for(p_code);
  select * into p from mp_players where room_id = r.id and user_id = auth.uid();
  if r.mode <> 'speed_race' then raise exception 'wrong_mode'; end if;
  if r.status <> 'running' or p.status <> 'playing' then raise exception 'not_playing'; end if;
  if p_mission <> p.progress then raise exception 'wrong_mission'; end if;
  select clues[p_mission + 1] into maxn from mp_challenges where id = r.challenge_id;
  if p_n < 2 or p_n > maxn then raise exception 'no_such_clue'; end if;
  insert into mp_events (room_id, user_id, mission, kind, n) values (r.id, auth.uid(), p_mission, 'hint', p_n) on conflict do nothing;
  if found then update mp_players set hints = hints + 1, last_seen = now() where room_id = r.id and user_id = auth.uid(); end if;
end $$;

-- Missions are completed in order, once each. 'gps' = location checked on the phone;
-- 'alt' = answered without a location check (listed apart from verified results).
create or replace function public.mp_complete(p_code text, p_mission int, p_method text)
returns void language plpgsql security definer set search_path = public as $$
declare r public.mp_rooms; p public.mp_players;
begin
  r := mp_room_for(p_code);
  if r.mode <> 'speed_race' then raise exception 'wrong_mode'; end if;
  if p_method not in ('gps', 'alt') then raise exception 'bad_method'; end if;
  select * into p from mp_players where room_id = r.id and user_id = auth.uid();
  if r.status <> 'running' or p.status <> 'playing' then raise exception 'not_playing'; end if;
  if p_mission <> p.progress then
    if p_mission < p.progress then return; end if;   -- already counted (a retry): nothing to do
    raise exception 'wrong_mission';
  end if;
  insert into mp_events (room_id, user_id, mission, kind, method) values (r.id, auth.uid(), p_mission, 'complete', p_method) on conflict do nothing;
  if not found then return; end if;
  update mp_players set progress = progress + 1, alt = alt + (p_method = 'alt')::int, last_seen = now(),
    status = case when progress + 1 >= (r.config->>'missions')::int then 'finished' else status end,
    finished_at = case when progress + 1 >= (r.config->>'missions')::int then now() else finished_at end
    where room_id = r.id and user_id = auth.uid();
  perform mp_maybe_finish(r.id);
end $$;

-- ---------- Time Attack rules ----------
-- Any mission, any order, once each, only while the clock runs (server time). Only missions
-- with a location check score: in a points race an answer alone must not replace being there.
create or replace function public.mp_ta_hint(p_code text, p_mission int)
returns void language plpgsql security definer set search_path = public as $$
declare r public.mp_rooms; p public.mp_players;
begin
  r := mp_room_for(p_code);
  select * into p from mp_players where room_id = r.id and user_id = auth.uid();
  if r.mode <> 'time_attack' then raise exception 'wrong_mode'; end if;
  if r.status <> 'running' or p.status <> 'playing' then raise exception 'not_playing'; end if;
  if now() >= r.ends_at then raise exception 'time_up'; end if;
  if p_mission < 0 or p_mission >= (r.config->>'missions')::int then raise exception 'wrong_mission'; end if;
  if exists (select 1 from mp_events where room_id = r.id and user_id = auth.uid() and mission = p_mission and kind = 'complete') then return; end if;
  insert into mp_events (room_id, user_id, mission, kind, n) values (r.id, auth.uid(), p_mission, 'hint', 2) on conflict do nothing;
  if found then update mp_players set hints = hints + 1, last_seen = now() where room_id = r.id and user_id = auth.uid(); end if;
end $$;

create or replace function public.mp_ta_complete(p_code text, p_mission int, p_method text)
returns int language plpgsql security definer set search_path = public as $$
declare r public.mp_rooms; p public.mp_players; base int; pts int;
begin
  r := mp_room_for(p_code);
  select * into p from mp_players where room_id = r.id and user_id = auth.uid();
  if r.mode <> 'time_attack' then raise exception 'wrong_mode'; end if;
  if r.status <> 'running' or p.status <> 'playing' then raise exception 'not_playing'; end if;
  if now() >= r.ends_at then raise exception 'time_up'; end if;
  if p_mission < 0 or p_mission >= (r.config->>'missions')::int then raise exception 'wrong_mission'; end if;
  if p_method <> 'gps' then raise exception 'location_required'; end if;
  insert into mp_events (room_id, user_id, mission, kind, method) values (r.id, auth.uid(), p_mission, 'complete', p_method) on conflict do nothing;
  if not found then return 0; end if;                       -- already scored: nothing more
  base := (r.config->'points'->>p_mission)::int;
  pts := greatest(base - (r.config->>'hint_cost')::int * (select count(*) from mp_events where room_id = r.id and user_id = auth.uid() and mission = p_mission and kind = 'hint')::int,
                  least(base, (r.config->>'min_points')::int));
  update mp_players set points = points + pts, progress = progress + 1, last_score_at = now(), last_seen = now() where room_id = r.id and user_id = auth.uid();
  return pts;
end $$;

-- ---------- Bingo Battle rules ----------
-- Any square, any order, once each, only with a location check, while the game runs. The room
-- row is locked while a square is counted, so two deciding squares at the same moment are
-- settled one after the other: only the first full line wins and the game ends there.
create or replace function public.mp_bb_lines() returns int[][] language sql immutable as $$
  select '{{0,1,2},{3,4,5},{6,7,8},{0,3,6},{1,4,7},{2,5,8},{0,4,8},{2,4,6}}'::int[][]
$$;
create or replace function public.mp_bb_complete(p_code text, p_cell int, p_method text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.mp_rooms; p public.mp_players; cells int[]; lines int[][] := mp_bb_lines(); i int; line int[];
begin
  r := mp_room_for(p_code);
  select * into r from mp_rooms where id = r.id for update;           -- one square at a time per room
  select * into p from mp_players where room_id = r.id and user_id = auth.uid();
  if r.mode <> 'bingo_battle' then raise exception 'wrong_mode'; end if;
  if r.status <> 'running' or p.status <> 'playing' then raise exception 'not_playing'; end if;
  if now() >= r.ends_at then raise exception 'time_up'; end if;
  if p_cell < 0 or p_cell >= (r.config->>'missions')::int then raise exception 'wrong_mission'; end if;
  if p_method <> 'gps' then raise exception 'location_required'; end if;
  insert into mp_events (room_id, user_id, mission, kind, method) values (r.id, auth.uid(), p_cell, 'complete', p_method) on conflict do nothing;
  if not found then return jsonb_build_object('counted', false); end if;
  update mp_players set progress = progress + 1, last_score_at = now(), last_seen = now() where room_id = r.id and user_id = auth.uid();
  select array_agg(mission) into cells from mp_events where room_id = r.id and user_id = auth.uid() and kind = 'complete';
  for i in 1..array_length(lines, 1) loop
    line := array[lines[i][1], lines[i][2], lines[i][3]];
    if line <@ cells then
      update mp_rooms set status = 'finished', finished_at = now(), winner_id = auth.uid(), winner_line = line where id = r.id;
      update mp_players set status = 'finished', finished_at = now() where room_id = r.id and status = 'playing';
      return jsonb_build_object('counted', true, 'line', line);
    end if;
  end loop;
  return jsonb_build_object('counted', true);
end $$;

-- ---------- rights ----------
revoke all on function public.mp_room_for(text, boolean), public.mp_maybe_finish(uuid) from public, anon, authenticated;
grant execute on function public.mp_create_room(text, text, text, int), public.mp_join_room(text, text), public.mp_set_ready(text, boolean),
  public.mp_start(text), public.mp_leave(text), public.mp_state(text), public.mp_hint(text, int, int), public.mp_complete(text, int, text),
  public.mp_ta_hint(text, int), public.mp_ta_complete(text, int, text), public.mp_bb_complete(text, int, text)
  to authenticated;
revoke execute on function public.mp_create_room(text, text, text, int), public.mp_join_room(text, text), public.mp_set_ready(text, boolean),
  public.mp_start(text), public.mp_leave(text), public.mp_state(text), public.mp_hint(text, int, int), public.mp_complete(text, int, text),
  public.mp_ta_hint(text, int), public.mp_ta_complete(text, int, text), public.mp_bb_complete(text, int, text)
  from public, anon;
