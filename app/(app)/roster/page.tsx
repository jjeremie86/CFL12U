import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { RosterManager } from "@/components/roster-manager";

export default async function RosterPage() {
  const supabase = await createClient();
  const { data: players } = await supabase.from("players").select("*").order("jersey_number", { ascending: true });

  return (
    <div>
      <PageHeader title="Roster" subtitle="Shared across every coach. Changes save instantly." />
      <RosterManager initialPlayers={players ?? []} />
    </div>
  );
}
