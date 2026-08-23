"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TeamEvent } from "@/types/database";

export type AttendanceHistoryRow = {
  event: TeamEvent;
  present: number;
  absent: number;
  total: number;
  pct: number;
};

export function useAttendanceHistory(events: TeamEvent[], totalPlayers: number) {
  const supabase = useMemo(() => createClient(), []);
  const [presentCounts, setPresentCounts] = useState<Record<string, number>>({});
  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
  const eventIdsKey = eventIds.join(",");

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      if (eventIds.length === 0) {
        setPresentCounts({});
        return;
      }
      const { data } = await supabase
        .from("attendance")
        .select("event_id")
        .in("event_id", eventIds)
        .eq("present", true);
      if (!cancelled && data) {
        const counts: Record<string, number> = {};
        for (const row of data) {
          counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
        }
        setPresentCounts(counts);
      }
    }
    loadCounts();

    if (eventIds.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    const channel = supabase
      .channel(`attendance-history-${eventIdsKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => loadCounts())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eventIdsKey captures changes to the underlying id list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, eventIdsKey]);

  const history = useMemo<AttendanceHistoryRow[]>(() => {
    return [...events]
      .sort((a, b) => (a.event_date < b.event_date ? 1 : a.event_date > b.event_date ? -1 : 0))
      .map((event) => {
        const present = presentCounts[event.id] ?? 0;
        const total = totalPlayers;
        const absent = Math.max(total - present, 0);
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        return { event, present, absent, total, pct };
      });
  }, [events, presentCounts, totalPlayers]);

  return history;
}
