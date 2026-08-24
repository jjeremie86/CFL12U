"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

const links = [
  { href: "/roster", label: "Roster" },
  { href: "/schedule", label: "Schedule" },
  { href: "/depth-chart", label: "Depth Chart" },
  { href: "/practice-attendance", label: "Practice" },
  { href: "/game-day", label: "Game Day" },
  { href: "/coaches", label: "Coaches" },
];

export function Nav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-field-600/60 bg-field-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="stencil text-sm font-bold tracking-[0.3em] text-gold">CFL12U</span>
          <nav className="flex flex-wrap gap-1">
            {links.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`stencil rounded-md px-3 py-1.5 text-xs tracking-wider transition ${
                    active ? "bg-field-700 text-chalk" : "text-chalk-faint hover:bg-field-800 hover:text-chalk"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-chalk-faint sm:inline">{email}</span>
          <Button variant="ghost" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
