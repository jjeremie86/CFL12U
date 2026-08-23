"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Attendance, TeamEvent, Player } from "@/types/database";
import { pickDefaultEvent } from "@/lib/pick-default-event";

export function useAttendance(events: TeamEvent[], players: Player[]) {
  const supabase = useMemo(() => createClient(), []);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(pickDefaultEvent(events)?.id ?? null);
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  useEffect(() => {
    const eventId = selectedEventId;
    let cancelled = false;

    async function loadAttendance() {
      if (!eventId) {
        setAttendance({});
        return;
      }
      const { data } = await supabase.from("attendance").select("*").eq("event_id", eventId);
      if (!cancelled && data) {
        setAttendance(Object.fromEntries(data.map((row) => [row.player_id, row])));
      }
    }
    loadAttendance();

    if (!eventId) {
      return () => {
        cancelled = true;
      };
    }

    const channel = supabase
      .channel(`attendance-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance", filter: `event_id=eq.${eventId}` },
        () => loadAttendance()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedEventId]);

  async function togglePresent(player: Player) {
    if (!selectedEventId) return;
    setError(null);
    const current = attendance[player.id];
    const nextPresent = !current?.present;
    const { error: upsertError } = await supabase.from("attendance").upsert(
      {
        event_id: selectedEventId,
        player_id: player.id,
        present: nextPresent,
        checked_in_at: nextPresent ? new Date().toISOString() : null,
        checked_in_by: userId,
      },
      { onConflict: "event_id,player_id" }
    );
    if (upsertError) setError(upsertError.message);
  }

  const presentCount = Object.values(attendance).filter((a) => a.present).length;

  return { selectedEventId, setSelectedEventId, attendance, togglePresent, error, presentCount };
}

export function formatEventDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
