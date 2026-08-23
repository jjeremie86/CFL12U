import type { TeamEvent } from "@/types/database";

/** Prefer the nearest upcoming event; fall back to the most recent past one. */
export function pickDefaultEvent(events: TeamEvent[]): TeamEvent | null {
  if (events.length === 0) return null;
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => e.event_date >= todayIso);
  if (upcoming.length > 0) return upcoming[0];
  return events[events.length - 1];
}
