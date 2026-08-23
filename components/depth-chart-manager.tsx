"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DepthChartSlot, Player, Side } from "@/types/database";
import { Card, Select } from "@/components/ui";

export function DepthChartManager({ initialSlots, players }: { initialSlots: DepthChartSlot[]; players: Player[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [slots, setSlots] = useState<DepthChartSlot[]>(initialSlots);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("depth-chart-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "depth_chart_slots" }, () => {
        supabase
          .from("depth_chart_slots")
          .select("*")
          .order("side")
          .order("slot_order")
          .then(({ data }) => {
            if (data) setSlots(data);
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function assignPlayer(slotId: string, playerId: string) {
    setError(null);
    const { error: updateError } = await supabase
      .from("depth_chart_slots")
      .update({ player_id: playerId || null })
      .eq("id", slotId);
    if (updateError) setError(updateError.message);
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-flag">{error}</p> : null}
      <div className="grid gap-6 sm:grid-cols-2">
        {(["offense", "defense"] as Side[]).map((side) => (
          <Card key={side} className="p-4">
            <p className="stencil mb-4 text-sm tracking-widest text-chalk-dim">{side}</p>
            <div className="space-y-2">
              {slots
                .filter((slot) => slot.side === side)
                .map((slot) => (
                  <div key={slot.id} className="flex items-center gap-3">
                    <span className="stencil w-14 shrink-0 text-xs tracking-wider text-chalk-faint">
                      {slot.slot_label}
                    </span>
                    <Select value={slot.player_id ?? ""} onChange={(e) => assignPlayer(slot.id, e.target.value)}>
                      <option value="">— unassigned —</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          #{player.jersey_number} {player.name} ({player.position})
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
