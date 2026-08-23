import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { GameDayBoard } from "@/components/game-day-board";

export default async function GameDayPage() {
  const supabase = await createClient();
  const [{ data: events }, { data: players }] = await Promise.all([
    supabase.from("events").select("*").eq("kind", "game").order("event_date", { ascending: true }),
    supabase.from("players").select("*").order("jersey_sort", { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader title="Game Day" subtitle="Check players in and see who's missing from the starting lineup." />
      <GameDayBoard events={events ?? []} players={players ?? []} />
    </div>
  );
}
