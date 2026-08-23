// Creates one Supabase auth account per coach listed in scripts/coaches.json.
// Run locally (never in the browser or CI logs) with the service role key:
//
//   1. Edit scripts/coaches.json with each coach's real email address.
//   2. Put SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
//      (find both under Project Settings -> API in the Supabase dashboard).
//   3. npm run seed:coaches
//
// Each coach gets a random temporary password printed to your terminal once.
// Share it with them out-of-band and have them change it after first login
// (Supabase's password-reset email flow works for this).

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const coaches = JSON.parse(readFileSync(path.join(__dirname, "coaches.json"), "utf8"));

const placeholderCoaches = coaches.filter((c) => c.email.includes("replace-with-real-email.com"));
if (placeholderCoaches.length > 0) {
  console.error(
    `Edit scripts/coaches.json first — these still have placeholder emails: ${placeholderCoaches
      .map((c) => c.name)
      .join(", ")}`
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generatePassword() {
  return randomBytes(9).toString("base64url");
}

const results = [];

for (const coach of coaches) {
  const password = generatePassword();
  const { data, error } = await supabase.auth.admin.createUser({
    email: coach.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: coach.name },
  });

  if (error) {
    results.push({ name: coach.name, email: coach.email, status: `FAILED: ${error.message}` });
    continue;
  }

  results.push({ name: coach.name, email: coach.email, status: "created", password, id: data.user.id });
}

console.log("\nSeed results:\n");
for (const r of results) {
  if (r.status === "created") {
    console.log(`  ${r.name.padEnd(20)} ${r.email.padEnd(35)} temp password: ${r.password}`);
  } else {
    console.log(`  ${r.name.padEnd(20)} ${r.email.padEnd(35)} ${r.status}`);
  }
}
console.log("\nShare each temp password with its coach out-of-band, then have them sign in and reset it.\n");
