"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Attendance, Player, TeamEvent } from "@/types/database";
import { weekdayName } from "@/lib/practice-dates";

type BinaryStatus = "present" | "absent";

function titleFor(dateIso: string) {
  const [year, month, day] = dateIso.split("-").map(Number);
  return `${weekdayName(new Date(year, month - 1, day).getDay())} Practice`;
}

/** Resolves (creating if needed) the practice event for a date, and tracks attendance for it. */
export function usePracticeDay(dateIso: string, players: Player[]) {
  const supabase = useMemo(() => createClient(), []);
  const [event, setEvent] = useState<TeamEvent | null>(null);
  const [resolving, setResolving] = useState(true);
  const [attendance, setAttendance] = useState<Record<string, Attendance>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setResolving(true);
      setEvent(null);
      setAttendance({});
      setError(null);

      const { data: existing, error: selectError } = await supabase
        .from("events")
        .select("*")
        .eq("kind", "practice")
        .eq("event_date", dateIso)
        .maybeSingle();
      if (cancelled) return;
      if (existing) {
        setEvent(existing);
        setResolving(false);
        return;
      }
      if (selectError) {
        setError(selectError.message);
        setResolving(false);
        return;
      }

      const { data: created, error: insertError } = await supabase
        .from("events")
        .insert({ kind: "practice", title: titleFor(dateIso), event_date: dateIso })
        .select()
        .single();
      if (cancelled) return;
      if (insertError) {
        // Another coach may have created the same date's practice at the same moment.
        const { data: raceWinner } = await supabase
          .from("events")
          .select("*")
          .eq("kind", "practice")
          .eq("event_date", dateIso)
          .maybeSingle();
        if (!cancelled && raceWinner) {
          setEvent(raceWinner);
          setResolving(false);
          return;
        }
        setError(insertError.message);
        setResolving(false);
        return;
      }
      setEvent(created);
      setResolving(false);
    }
    resolve();

    return () => {
      cancelled = true;
    };
  }, [supabase, dateIso]);

  useEffect(() => {
    if (!event) return;
    let cancelled = false;

    async function loadAttendance() {
      const { data } = await supabase.from("attendance").select("*").eq("event_id", event!.id);
      if (!cancelled && data) {
        setAttendance(Object.fromEntries(data.map((row) => [row.player_id, row])));
      }
    }
    loadAttendance();

    const channel = supabase
      .channel(`practice-day-${event.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance", filter: `event_id=eq.${event.id}` },
        () => loadAttendance()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase, event]);

  async function setStatus(player: Player, status: BinaryStatus) {
    if (!event) return;
    setError(null);
    const { error: upsertError } = await supabase.from("attendance").upsert(
      {
        event_id: event.id,
        player_id: player.id,
        status,
        checked_in_at: status === "present" ? new Date().toISOString() : null,
        checked_in_by: userId,
      },
      { onConflict: "event_id,player_id" }
    );
    if (upsertError) setError(upsertError.message);
  }

  const statusOf = (playerId: string): BinaryStatus => (attendance[playerId]?.status === "present" ? "present" : "absent");
  const presentCount = players.filter((p) => statusOf(p.id) === "present").length;
  const total = players.length;
  const absentCount = Math.max(total - presentCount, 0);
  const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  return { event, resolving, statusOf, setStatus, presentCount, absentCount, total, pct, error };
}
