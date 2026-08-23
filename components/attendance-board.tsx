"use client";

import type { Player, TeamEvent } from "@/types/database";
import { useAttendance, formatEventDate } from "@/lib/use-attendance";
import { Badge, Card, EmptyState, Select } from "@/components/ui";

export function AttendanceBoard({
  events,
  players,
  eventLabel,
}: {
  events: TeamEvent[];
  players: Player[];
  eventLabel: string;
}) {
  const { selectedEventId, setSelectedEventId, attendance, togglePresent, error, presentCount } = useAttendance(
    events,
    players
  );

  if (events.length === 0) {
    return <EmptyState>No {eventLabel.toLowerCase()}s on the schedule yet. Add one on the Schedule screen first.</EmptyState>;
  }

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-[240px] flex-1">
          <Select value={selectedEventId ?? ""} onChange={(e) => setSelectedEventId(e.target.value || null)}>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} — {formatEventDate(event.event_date)}
              </option>
            ))}
          </Select>
        </div>
        {selectedEventId ? (
          <Badge tone="gold">
            {presentCount} / {players.length} present
          </Badge>
        ) : null}
      </Card>

      {error ? <p className="text-sm text-flag">{error}</p> : null}

      {players.length === 0 ? (
        <EmptyState>No players on the roster yet.</EmptyState>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => {
            const present = attendance[player.id]?.present ?? false;
            return (
              <button
                key={player.id}
                onClick={() => togglePresent(player)}
                disabled={!selectedEventId}
                className={`flex items-center justify-between rounded-md border p-3 text-left transition disabled:opacity-50 ${
                  present ? "border-field-500/70 bg-field-700/50" : "border-flag/40 bg-flag/10 hover:bg-flag/20"
                }`}
              >
                <span>
                  <span className="mr-2 font-mono text-gold">#{player.jersey_number}</span>
                  <span className="text-chalk">{player.name}</span>
                  <span className="ml-2 text-xs text-chalk-faint">{player.position}</span>
                </span>
                <Badge tone={present ? "good" : "bad"}>{present ? "Present" : "Absent"}</Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
