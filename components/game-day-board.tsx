"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DepthChartSlot, Player, TeamEvent } from "@/types/database";
import { useAttendance, formatEventDate } from "@/lib/use-attendance";
import { Badge, Card, EmptyState, Select } from "@/components/ui";

export function GameDayBoard({ events, players }: { events: TeamEvent[]; players: Player[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [slots, setSlots] = useState<DepthChartSlot[]>([]);

  const { selectedEventId, setSelectedEventId, attendance, togglePresent, error, presentCount } = useAttendance(
    events,
    players
  );

  useEffect(() => {
    async function loadSlots() {
      const { data } = await supabase.from("depth_chart_slots").select("*").order("side").order("slot_order");
      if (data) setSlots(data);
    }
    loadSlots();

    const channel = supabase
      .channel("game-day-depth-chart")
      .on("postgres_changes", { event: "*", schema: "public", table: "depth_chart_slots" }, () => loadSlots())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const playersById = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  if (events.length === 0) {
    return <EmptyState>No games on the schedule yet. Add one on the Schedule screen first.</EmptyState>;
  }

  const starters = slots.filter((slot) => slot.player_id);
  const notCheckedIn = starters.filter((slot) => !attendance[slot.player_id!]?.present);

  return (
    <div className="space-y-8">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-[240px] flex-1">
          <Select value={selectedEventId ?? ""} onChange={(e) => setSelectedEventId(e.target.value || null)}>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
                {event.opponent ? ` vs ${event.opponent}` : ""} — {formatEventDate(event.event_date)}
              </option>
            ))}
          </Select>
        </div>
        {selectedEventId ? (
          <Badge tone="gold">
            {presentCount} / {players.length} checked in
          </Badge>
        ) : null}
      </Card>

      {error ? <p className="text-sm text-flag">{error}</p> : null}

      <section>
        <h2 className="stencil mb-3 text-sm tracking-widest text-chalk-dim">Check-In</h2>
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
                  <Badge tone={present ? "good" : "bad"}>{present ? "Checked In" : "Not Checked In"}</Badge>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="stencil text-sm tracking-widest text-chalk-dim">Starting Lineup (read-only)</h2>
          {notCheckedIn.length > 0 ? (
            <Badge tone="bad">{notCheckedIn.length} starter{notCheckedIn.length === 1 ? "" : "s"} not checked in</Badge>
          ) : (
            <Badge tone="good">All starters checked in</Badge>
          )}
        </div>
        {starters.length === 0 ? (
          <EmptyState>No starters assigned yet. Set the lineup on the Depth Chart screen.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(["offense", "defense"] as const).map((side) => (
              <Card key={side} className="p-4">
                <p className="stencil mb-3 text-xs tracking-wider text-chalk-faint">{side}</p>
                <ul className="space-y-1.5">
                  {starters
                    .filter((slot) => slot.side === side)
                    .map((slot) => {
                      const player = playersById[slot.player_id!];
                      const checkedIn = attendance[slot.player_id!]?.present;
                      return (
                        <li
                          key={slot.id}
                          className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                            checkedIn ? "border-field-600/60" : "border-flag/50 bg-flag/10"
                          }`}
                        >
                          <span className="text-chalk-faint">
                            <span className="stencil mr-2 text-[11px] text-chalk-dim">{slot.slot_label}</span>
                            {player ? (
                              <>
                                <span className="font-mono text-gold">#{player.jersey_number}</span>{" "}
                                <span className="text-chalk">{player.name}</span>
                              </>
                            ) : (
                              <span className="italic text-chalk-faint">unassigned</span>
                            )}
                          </span>
                          {!checkedIn ? <Badge tone="bad">Not checked in</Badge> : null}
                        </li>
                      );
                    })}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
