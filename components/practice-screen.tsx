"use client";

import type { AttendanceStatus, Player, TeamEvent } from "@/types/database";
import { useEvents } from "@/lib/use-events";
import { useAttendance, formatEventDate } from "@/lib/use-attendance";
import { useAttendanceHistory } from "@/lib/use-attendance-history";
import { usePlayerAttendanceSummary } from "@/lib/use-player-attendance-summary";
import { AttendanceHistoryTable, AttendanceStatTiles, PlayerAttendanceTable } from "@/components/attendance-stats";
import { PracticeScheduleManager } from "@/components/practice-schedule-manager";
import { Badge, Card, EmptyState, Select } from "@/components/ui";

const STATUS_OPTIONS: { status: AttendanceStatus; label: string }[] = [
  { status: "present", label: "Present" },
  { status: "absent", label: "Absent" },
  { status: "excused", label: "Excused" },
];

export function PracticeScreen({ initialEvents, players }: { initialEvents: TeamEvent[]; players: Player[] }) {
  const eventsApi = useEvents("practice", initialEvents);
  const { events } = eventsApi;

  const { selectedEventId, setSelectedEventId, statusOf, setStatus, error, presentCount, absentCount, excusedCount } =
    useAttendance(events, players);
  const history = useAttendanceHistory(events, players.length);
  const playerSummary = usePlayerAttendanceSummary(events, players);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="stencil mb-3 text-sm tracking-widest text-chalk-dim">Practice Schedule</h2>
        <PracticeScheduleManager {...eventsApi} />
      </section>

      <section>
        <h2 className="stencil mb-3 text-sm tracking-widest text-chalk-dim">Mark Attendance</h2>

        {events.length === 0 ? (
          <EmptyState>No practices scheduled yet. Add one above to start tracking attendance.</EmptyState>
        ) : (
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

            <AttendanceStatTiles present={presentCount} absent={absentCount} excused={excusedCount} total={players.length} />

            {players.length === 0 ? (
              <EmptyState>No players on the roster yet.</EmptyState>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((player) => {
                  const status = statusOf(player.id);
                  return (
                    <Card key={player.id} className="flex flex-col gap-2 p-3">
                      <div>
                        <span className="mr-2 font-mono text-gold">#{player.jersey_number}</span>
                        <span className="text-chalk">{player.name}</span>
                        <span className="ml-2 text-xs text-chalk-faint">{player.position}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.status}
                            disabled={!selectedEventId}
                            onClick={() => setStatus(player, opt.status)}
                            className={`stencil flex-1 rounded-md border px-2 py-1.5 text-[11px] tracking-wider transition disabled:opacity-50 ${
                              status === opt.status
                                ? opt.status === "present"
                                  ? "border-field-500 bg-field-600/60 text-chalk"
                                  : opt.status === "absent"
                                    ? "border-flag/60 bg-flag/25 text-chalk"
                                    : "border-gold/60 bg-gold/20 text-chalk"
                                : "border-field-600 bg-field-950/40 text-chalk-faint hover:text-chalk"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="stencil mb-3 text-sm tracking-widest text-chalk-dim">Player Attendance Summary</h2>
        <PlayerAttendanceTable summary={playerSummary} emptyLabel="No practices recorded yet." />
      </section>

      <section>
        <h2 className="stencil mb-3 text-sm tracking-widest text-chalk-dim">Attendance History</h2>
        <AttendanceHistoryTable history={history} emptyLabel="No attendance recorded yet." />
      </section>
    </div>
  );
}
