import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client for coach account management. Bypasses RLS — only
 * ever import this from server-only code (Server Components, Server
 * Actions, Route Handlers). The `server-only` import makes any accidental
 * client-side import a build error.
 */
export function createAdminClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
