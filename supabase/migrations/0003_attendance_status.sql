-- Replace the boolean `present` flag with a three-state status so coaches can
-- mark players Present, Absent, or Excused for practices and games.

alter table public.attendance add column status text;

update public.attendance set status = case when present then 'present' else 'absent' end;

alter table public.attendance alter column status set not null;
alter table public.attendance alter column status set default 'absent';
alter table public.attendance add constraint attendance_status_check
  check (status in ('present', 'absent', 'excused'));

alter table public.attendance drop column present;
