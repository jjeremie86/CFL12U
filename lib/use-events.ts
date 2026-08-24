"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EventKind, TeamEvent } from "@/types/database";

export function useEvents(kind: EventKind, initial: TeamEvent[]) {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<TeamEvent[]>(initial);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("kind", kind)
        .order("event_date", { ascending: true });
      if (data) setEvents(data);
    }

    const channel = supabase
      .channel(`events-${kind}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, kind]);

  async function addEvent(input: { title: string; event_date: string; event_time?: string | null; location?: string | null }) {
    setError(null);
    const { error: insertError } = await supabase.from("events").insert({
      kind,
      title: input.title,
      event_date: input.event_date,
      event_time: input.event_time ?? null,
      location: input.location ?? null,
    });
    if (insertError) {
      setError(insertError.message);
      return false;
    }
    return true;
  }

  async function addEvents(inputs: { title: string; event_date: string; event_time?: string | null; location?: string | null }[]) {
    if (inputs.length === 0) return true;
    setError(null);
    const { error: insertError } = await supabase.from("events").insert(
      inputs.map((input) => ({
        kind,
        title: input.title,
        event_date: input.event_date,
        event_time: input.event_time ?? null,
        location: input.location ?? null,
      }))
    );
    if (insertError) {
      setError(insertError.message);
      return false;
    }
    return true;
  }

  async function updateEvent(id: string, patch: Partial<Pick<TeamEvent, "title" | "event_date" | "event_time" | "location">>) {
    setError(null);
    const { error: updateError } = await supabase.from("events").update(patch).eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return false;
    }
    return true;
  }

  async function removeEvent(id: string) {
    setError(null);
    const { error: deleteError } = await supabase.from("events").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    return true;
  }

  return { events, error, addEvent, addEvents, updateEvent, removeEvent };
}
