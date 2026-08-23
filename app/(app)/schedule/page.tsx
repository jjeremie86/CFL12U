import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ScheduleManager } from "@/components/schedule-manager";

export default async function SchedulePage() {
  const supabase = await createClient();
  const { data: events } = await supabase.from("events").select("*").order("event_date", { ascending: true });

  return (
    <div>
      <PageHeader title="Schedule" subtitle="Practices and games. Shared across every coach." />
      <ScheduleManager initialEvents={events ?? []} />
    </div>
  );
}
