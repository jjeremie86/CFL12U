"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { EventKind, TeamEvent } from "@/types/database";
import { Badge, Button, Card, EmptyState, Input, Select } from "@/components/ui";

const emptyDraft = {
  kind: "practice" as EventKind,
  title: "",
  opponent: "",
  event_date: "",
  event_time: "",
  location: "",
};

export function ScheduleManager({ initialEvents }: { initialEvents: TeamEvent[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<TeamEvent[]>(initialEvents);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("events-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        supabase
          .from("events")
          .select("*")
          .order("event_date", { ascending: true })
          .then(({ data }) => {
            if (data) setEvents(data);
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!draft.title.trim() || !draft.event_date) {
      setError("Title and date are required.");
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from("events").insert({
      kind: draft.kind,
      title: draft.title.trim(),
      opponent: draft.kind === "game" ? draft.opponent.trim() || null : null,
      event_date: draft.event_date,
      event_time: draft.event_time || null,
      location: draft.location.trim() || null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDraft(emptyDraft);
  }

  async function removeEvent(id: string, title: string) {
    if (!window.confirm(`Remove "${title}" from the schedule?`)) return;
    const { error: deleteError } = await supabase.from("events").delete().eq("id", id);
    if (deleteError) setError(deleteError.message);
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <form onSubmit={addEvent} className="grid gap-3 sm:grid-cols-6">
          <div className="sm:col-span-1">
            <Select value={draft.kind} onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as EventKind }))}>
              <option value="practice">Practice</option>
              <option value="game">Game</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Input
              placeholder="Title"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            />
          </div>
          {draft.kind === "game" ? (
            <div className="sm:col-span-2">
              <Input
                placeholder="Opponent"
                value={draft.opponent}
                onChange={(e) => setDraft((d) => ({ ...d, opponent: e.target.value }))}
              />
            </div>
          ) : (
            <div className="sm:col-span-2" />
          )}
          <div className="sm:col-span-1">
            <Input
              type="date"
              value={draft.event_date}
              onChange={(e) => setDraft((d) => ({ ...d, event_date: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-1">
            <Input
              type="time"
              value={draft.event_time}
              onChange={(e) => setDraft((d) => ({ ...d, event_time: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              placeholder="Location"
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-6">
            <Button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add to Schedule"}
            </Button>
          </div>
        </form>
        {error ? <p className="mt-3 text-sm text-flag">{error}</p> : null}
      </Card>

      {events.length === 0 ? (
        <EmptyState>Nothing on the schedule yet. Add a practice or game above.</EmptyState>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-4">
                <Badge tone={event.kind === "game" ? "gold" : "default"}>{event.kind}</Badge>
                <div>
                  <p className="font-semibold text-chalk">
                    {event.title}
                    {event.opponent ? <span className="text-chalk-faint"> vs {event.opponent}</span> : null}
                  </p>
                  <p className="text-xs text-chalk-faint">
                    {formatDate(event.event_date)}
                    {event.event_time ? ` · ${formatTime(event.event_time)}` : ""}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
              </div>
              <Button variant="danger" onClick={() => removeEvent(event.id, event.title)}>
                Remove
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
