import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { DepthChartManager } from "@/components/depth-chart-manager";

export default async function DepthChartPage() {
  const supabase = await createClient();
  const [{ data: slots }, { data: players }] = await Promise.all([
    supabase.from("depth_chart_slots").select("*").order("side").order("slot_order"),
    supabase.from("players").select("*").order("jersey_sort", { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader title="Depth Chart" subtitle="Assign a player to each slot. Shared across every coach." />
      <DepthChartManager initialSlots={slots ?? []} players={players ?? []} />
    </div>
  );
}
