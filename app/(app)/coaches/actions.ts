"use server";

import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InviteResult = { ok: true; id: string; email: string; password: string } | { ok: false; error: string };

export async function inviteCoach(email: string, name: string): Promise<InviteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };

  const trimmedEmail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmedEmail)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const password = randomBytes(9).toString("base64url");
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: trimmedEmail,
    password,
    email_confirm: true,
    user_metadata: name.trim() ? { full_name: name.trim() } : undefined,
  });

  if (error || !data.user) {
    return { ok: false, error: error?.message ?? "Failed to create coach account." };
  }

  return { ok: true, id: data.user.id, email: trimmedEmail, password };
}

export async function removeCoach(userId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in." };
  if (user.id === userId) return { ok: false, error: "You can't remove your own account." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
