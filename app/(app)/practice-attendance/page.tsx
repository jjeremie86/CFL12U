import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { PracticeScreen } from "@/components/practice-screen";

export default async function PracticeAttendancePage() {
  const supabase = await createClient();
  const [{ data: events }, { data: players }] = await Promise.all([
    supabase.from("events").select("*").eq("kind", "practice").order("event_date", { ascending: true }),
    supabase.from("players").select("*").order("jersey_sort", { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader
        title="Practice"
        subtitle="Schedule practices, mark Present / Absent / Excused, and track attendance over the season."
      />
      <PracticeScreen initialEvents={events ?? []} players={players ?? []} />
    </div>
  );
}
