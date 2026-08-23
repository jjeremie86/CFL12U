-- CFL12U team app schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- players
-- ---------------------------------------------------------------------------
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  jersey_number integer not null,
  name text not null,
  position text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- events (practices + games)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('practice', 'game')),
  title text not null,
  opponent text,
  event_date date not null,
  event_time time,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- attendance (one row per player per event, used for both practice + game day)
-- ---------------------------------------------------------------------------
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  present boolean not null default false,
  checked_in_at timestamptz,
  checked_in_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (event_id, player_id)
);

-- ---------------------------------------------------------------------------
-- depth_chart_slots (offense/defense position slots, one assigned player each)
-- ---------------------------------------------------------------------------
create table if not exists public.depth_chart_slots (
  id uuid primary key default gen_random_uuid(),
  side text not null check (side in ('offense', 'defense')),
  slot_label text not null,
  slot_order integer not null default 0,
  player_id uuid references public.players (id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (side, slot_label)
);

-- ---------------------------------------------------------------------------
-- keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.players;
create trigger set_updated_at before update on public.players
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.events;
create trigger set_updated_at before update on public.events
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.attendance;
create trigger set_updated_at before update on public.attendance
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.depth_chart_slots;
create trigger set_updated_at before update on public.depth_chart_slots
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- All data is shared across every logged-in coach: any authenticated user
-- may read/write. There is no public signup, so "authenticated" == "coach".
-- ---------------------------------------------------------------------------
alter table public.players enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.depth_chart_slots enable row level security;

drop policy if exists "coaches read players" on public.players;
create policy "coaches read players" on public.players
  for select to authenticated using (true);
drop policy if exists "coaches write players" on public.players;
create policy "coaches write players" on public.players
  for all to authenticated using (true) with check (true);

drop policy if exists "coaches read events" on public.events;
create policy "coaches read events" on public.events
  for select to authenticated using (true);
drop policy if exists "coaches write events" on public.events;
create policy "coaches write events" on public.events
  for all to authenticated using (true) with check (true);

drop policy if exists "coaches read attendance" on public.attendance;
create policy "coaches read attendance" on public.attendance
  for select to authenticated using (true);
drop policy if exists "coaches write attendance" on public.attendance;
create policy "coaches write attendance" on public.attendance
  for all to authenticated using (true) with check (true);

drop policy if exists "coaches read depth chart" on public.depth_chart_slots;
create policy "coaches read depth chart" on public.depth_chart_slots
  for select to authenticated using (true);
drop policy if exists "coaches write depth chart" on public.depth_chart_slots;
create policy "coaches write depth chart" on public.depth_chart_slots
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Realtime: broadcast row changes so every logged-in coach sees updates live
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.players;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.attendance;
alter publication supabase_realtime add table public.depth_chart_slots;

-- ---------------------------------------------------------------------------
-- Default depth chart slots (11-man offense/defense). Coaches assign players
-- to these via the Depth Chart screen; slots stay empty (player_id null)
-- until assigned.
-- ---------------------------------------------------------------------------
insert into public.depth_chart_slots (side, slot_label, slot_order) values
  ('offense', 'QB', 1),
  ('offense', 'RB', 2),
  ('offense', 'FB', 3),
  ('offense', 'WR1', 4),
  ('offense', 'WR2', 5),
  ('offense', 'TE', 6),
  ('offense', 'LT', 7),
  ('offense', 'LG', 8),
  ('offense', 'C', 9),
  ('offense', 'RG', 10),
  ('offense', 'RT', 11),
  ('defense', 'DE1', 1),
  ('defense', 'DT1', 2),
  ('defense', 'DT2', 3),
  ('defense', 'DE2', 4),
  ('defense', 'LB1', 5),
  ('defense', 'LB2', 6),
  ('defense', 'LB3', 7),
  ('defense', 'CB1', 8),
  ('defense', 'CB2', 9),
  ('defense', 'S1', 10),
  ('defense', 'S2', 11)
on conflict (side, slot_label) do nothing;
