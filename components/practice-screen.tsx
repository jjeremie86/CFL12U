"use client";

import { useState } from "react";
import type { Player, TeamEvent } from "@/types/database";
import { useEvents } from "@/lib/use-events";
import { usePracticeDay } from "@/lib/use-practice-day";
import { useAttendanceHistory } from "@/lib/use-attendance-history";
import { usePlayerAttendanceSummary } from "@/lib/use-player-attendance-summary";
import { AttendanceHistoryTable, AttendanceStatTiles, PlayerAttendanceTable } from "@/components/attendance-stats";
import { defaultPracticeDate, formatLongDate, nextWeekdayOnOrAfter, toIsoDate, weekdayName, PRACTICE_WEEKDAYS } from "@/lib/practice-dates";
import { Card, Input } from "@/components/ui";

export function PracticeScreen({ initialEvents, players }: { initialEvents: TeamEvent[]; players: Player[] }) {
  const { events } = useEvents("practice", initialEvents);
  const [selectedDate, setSelectedDate] = useState(defaultPracticeDate());

  const { resolving, statusOf, setStatus, presentCount, absentCount, total, pct, error } = usePracticeDay(
    selectedDate,
    players
  );
  const history = useAttendanceHistory(events, players.length);
  const playerSummary = usePlayerAttendanceSummary(events, players);

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <p className="stencil text-[11px] tracking-wider text-chalk-faint">Practice Date</p>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-chalk">{formatLongDate(selectedDate)}</h2>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {PRACTICE_WEEKDAYS.map((weekday) => (
            <button
              key={weekday}
              onClick={() => setSelectedDate(toIsoDate(nextWeekdayOnOrAfter(new Date(), weekday)))}
              className={`stencil rounded-full border px-3 py-1 text-[11px] tracking-wider transition ${
                new Date(`${selectedDate}T00:00:00`).getDay() === weekday
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-field-600 text-chalk-faint hover:text-chalk"
              }`}
            >
              {weekdayName(weekday)}
            </button>
          ))}
        </div>
      </Card>

      {error ? <p className="text-sm text-flag">{error}</p> : null}

      <AttendanceStatTiles present={presentCount} absent={absentCount} total={total} />

      <section>
        {players.length === 0 ? (
          <p className="text-sm text-chalk-faint">No players on the roster yet.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => {
              const present = statusOf(player.id) === "present";
              return (
                <Card key={player.id} className="flex items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <span className="mr-2 font-mono text-gold">#{player.jersey_number}</span>
                    <span className="text-chalk">{player.name}</span>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      disabled={resolving}
                      onClick={() => setStatus(player, "present")}
                      className={`stencil rounded-md border px-2.5 py-1.5 text-[11px] tracking-wider transition disabled:opacity-50 ${
                        present
                          ? "border-field-500 bg-field-600/70 text-chalk"
                          : "border-field-600 bg-field-950/40 text-chalk-faint hover:text-chalk"
                      }`}
                    >
                      ✓ Present
                    </button>
                    <button
                      disabled={resolving}
                      onClick={() => setStatus(player, "absent")}
                      className={`stencil rounded-md border px-2.5 py-1.5 text-[11px] tracking-wider transition disabled:opacity-50 ${
                        !present
                          ? "border-flag/60 bg-flag/25 text-chalk"
                          : "border-field-600 bg-field-950/40 text-chalk-faint hover:text-chalk"
                      }`}
                    >
                      ✕ Absent
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="stencil mb-3 text-sm tracking-widest text-chalk-dim">Player Attendance</h2>
        <PlayerAttendanceTable summary={playerSummary} emptyLabel="No practices recorded yet." showExcused={false} />
      </section>

      <section>
        <h2 className="stencil mb-3 text-sm tracking-widest text-chalk-dim">Attendance History</h2>
        <AttendanceHistoryTable history={history} emptyLabel="No attendance recorded yet." showExcused={false} />
      </section>
    </div>
  );
}
