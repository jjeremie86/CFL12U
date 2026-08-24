-- The simplified Practice screen resolves a practice date directly to an
-- events row, auto-creating one if it doesn't exist yet. This guards against
-- two coaches picking the same date at the same moment and creating two
-- practice rows for it.

create unique index if not exists events_practice_date_unique
  on public.events (event_date)
  where kind = 'practice';
