-- Some rosters use non-numeric jersey "numbers" (e.g. "X" for an unassigned
-- number). Store jersey_number as text, and add a generated sort key so the
-- roster/dropdowns can still order numerically with non-numeric entries last.

alter table public.players
  alter column jersey_number type text using jersey_number::text;

alter table public.players
  add column if not exists jersey_sort integer generated always as (
    case when jersey_number ~ '^[0-9]+$' then jersey_number::integer else 999999 end
  ) stored;
