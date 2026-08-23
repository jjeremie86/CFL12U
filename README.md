# CFL12U Sideline

Team management app for the CFL12U coaching staff — roster, schedule, practice
attendance, game day check-in, and depth chart. Next.js (App Router) +
Supabase (Postgres + Auth + Realtime). Every screen is shared live across all
logged-in coaches.

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), create a new project.
2. In **Project Settings -> API**, copy the **Project URL**, **anon public**
   key, and **service_role** key (the last one only for local seeding, never
   for the app itself).
3. Open the **SQL Editor** and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   once. This creates the `players`, `events`, `attendance`, and
   `depth_chart_slots` tables, enables Row Level Security (any signed-in
   coach can read/write, no public access), turns on Realtime for all four
   tables, and seeds a standard 11-man offense/defense depth chart with empty
   slots.
4. In **Authentication -> Providers**, confirm Email is enabled and **turn off
   "Allow new users to sign up"** — coaches are invited manually, there's no
   public signup screen.

## 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
step 1. Leave `SUPABASE_SERVICE_ROLE_KEY` unset unless you're about to run the
coach-seeding script below (and never commit it or ship it to the browser).

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`.

## 3. Create the coach accounts

There's no signup form by design. Create the 8 seed accounts (Samson,
Shannon, Reggie, Tee, Wade, Cannon, Jackson, Lafeyett Singletary) one of two
ways:

**Dashboard (simplest for one-offs):** Authentication -> Users -> Add user,
for each coach. Set "Auto Confirm User" so they can log in immediately.

**Script (for seeding all 8 at once):**

1. Edit [`scripts/coaches.json`](scripts/coaches.json) with each coach's real
   email address.
2. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
3. `npm run seed:coaches`

The script prints a one-time temporary password per coach — send each one to
its coach out-of-band (text, Slack, etc.) and have them sign in and use
Supabase's password-reset flow to set their own.

## 4. Deploy

Any Next.js host works; [Vercel](https://vercel.com) is the path of least
resistance:

1. Push this repo to GitHub.
2. Import it in Vercel, framework preset "Next.js".
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as
   environment variables (same values as `.env.local`; do **not** add the
   service role key to the deployed app).
4. Deploy. Share the URL with the coaching staff.

## How the data model works

- **players** — jersey #, name, position. Shared roster, no owner.
- **events** — practices and games (`kind` is `practice` or `game`), with
  date/time/location and an optional opponent for games.
- **attendance** — one row per `(event, player)` with a `present` boolean;
  used by both the Practice Attendance and Game Day screens.
- **depth_chart_slots** — fixed offense/defense position slots (QB, RB, LT,
  CB1, etc.), each optionally pointing at a player.

Every table has Realtime enabled and Row Level Security scoped to
"authenticated" — since there's no public signup, any logged-in user is a
coach, and every coach sees every other coach's changes within a second or
two via a Postgres changes subscription (no manual refresh needed).

## Project structure

```
app/
  login/                  public login screen
  (app)/                  auth-gated shell (nav + sign out)
    roster/
    schedule/
    practice-attendance/
    game-day/
    depth-chart/
components/               shared UI kit + screen-specific client components
lib/supabase/             browser / server / middleware Supabase clients
supabase/migrations/      SQL schema, RLS policies, realtime, seed slots
scripts/seed-coaches.mjs  one-time coach account creation
```
