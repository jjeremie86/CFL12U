import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/ui";
import { CoachesManager, type Coach } from "@/components/coaches-manager";

export default async function CoachesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();

  const coaches: Coach[] = error
    ? []
    : data.users
        .map((u) => ({
          id: u.id,
          email: u.email ?? "",
          name: (u.user_metadata as { full_name?: string } | null)?.full_name ?? null,
          lastSignInAt: u.last_sign_in_at ?? null,
        }))
        .sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div>
      <PageHeader title="Coaches" subtitle="Everyone with sideline access. Add a coach to generate their login." />
      {error ? (
        <p className="text-sm text-flag">Couldn&apos;t load coaches: {error.message}</p>
      ) : (
        <CoachesManager initialCoaches={coaches} currentUserId={user?.id ?? ""} />
      )}
    </div>
  );
}
