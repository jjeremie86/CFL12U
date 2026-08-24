"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EventKind, TeamEvent } from "@/types/database";

/** Live-synced list of events of a given kind. */
export function useEvents(kind: EventKind, initial: TeamEvent[]) {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<TeamEvent[]>(initial);

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

  return { events };
}
