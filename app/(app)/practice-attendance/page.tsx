import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { AttendanceBoard } from "@/components/attendance-board";

export default async function PracticeAttendancePage() {
  const supabase = await createClient();
  const [{ data: events }, { data: players }] = await Promise.all([
    supabase.from("events").select("*").eq("kind", "practice").order("event_date", { ascending: true }),
    supabase.from("players").select("*").order("jersey_sort", { ascending: true }),
  ]);

  return (
    <div>
      <PageHeader title="Practice Attendance" subtitle="Tap a player to mark present or absent. Saves instantly for every coach." />
      <AttendanceBoard events={events ?? []} players={players ?? []} eventLabel="Practice" />
    </div>
  );
}
