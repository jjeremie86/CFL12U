"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Player, TeamEvent } from "@/types/database";

export type PlayerAttendanceRow = {
  player: Player;
  present: number;
  excused: number;
  absent: number;
  total: number;
  pct: number;
};

type Counts = { present: number; excused: number };

export function usePlayerAttendanceSummary(events: TeamEvent[], players: Player[]) {
  const supabase = useMemo(() => createClient(), []);
  const [counts, setCounts] = useState<Record<string, Counts>>({});
  const eventIds = useMemo(() => events.map((e) => e.id), [events]);
  const eventIdsKey = eventIds.join(",");

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      if (eventIds.length === 0) {
        setCounts({});
        return;
      }
      const { data } = await supabase
        .from("attendance")
        .select("player_id, status")
        .in("event_id", eventIds)
        .in("status", ["present", "excused"]);
      if (!cancelled && data) {
        const next: Record<string, Counts> = {};
        for (const row of data) {
          const bucket = next[row.player_id] ?? { present: 0, excused: 0 };
          if (row.status === "present") bucket.present += 1;
          else if (row.status === "excused") bucket.excused += 1;
          next[row.player_id] = bucket;
        }
        setCounts(next);
      }
    }
    loadCounts();

    if (eventIds.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    const channel = supabase
      .channel(`player-attendance-summary-${eventIdsKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, () => loadCounts())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eventIdsKey captures changes to the underlying id list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, eventIdsKey]);

  const summary = useMemo<PlayerAttendanceRow[]>(() => {
    const total = events.length;
    return players.map((player) => {
      const present = counts[player.id]?.present ?? 0;
      const excused = counts[player.id]?.excused ?? 0;
      const absent = Math.max(total - present - excused, 0);
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      return { player, present, excused, absent, total, pct };
    });
  }, [players, counts, events.length]);

  return summary;
}
