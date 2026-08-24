"use client";

import { useState, useTransition } from "react";
import { inviteCoach, removeCoach } from "@/app/(app)/coaches/actions";
import { Button, Card, EmptyState, Input, Label } from "@/components/ui";

export type Coach = {
  id: string;
  email: string;
  name: string | null;
  lastSignInAt: string | null;
};

export function CoachesManager({ initialCoaches, currentUserId }: { initialCoaches: Coach[]; currentUserId: string }) {
  const [coaches, setCoaches] = useState<Coach[]>(initialCoaches);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await inviteCoach(email, name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCreated({ email: result.email, password: result.password });
      setCoaches((c) =>
        [...c, { id: result.id, email: result.email, name: name.trim() || null, lastSignInAt: null }].sort(
          (a, b) => a.email.localeCompare(b.email)
        )
      );
      setEmail("");
      setName("");
    });
  }

  function remove(id: string, coachEmail: string) {
    if (!window.confirm(`Remove ${coachEmail}'s access?`)) return;
    setError(null);
    startTransition(async () => {
      const result = await removeCoach(id);
      if (!result.ok) {
        setError(result.error ?? "Failed to remove coach.");
        return;
      }
      setCoaches((c) => c.filter((coach) => coach.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px]">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Coach name" />
          </div>
          <div className="min-w-[220px] flex-1">
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="coach@example.com"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Adding…" : "Add Coach"}
          </Button>
        </form>
        {error ? <p className="mt-3 text-sm text-flag">{error}</p> : null}
      </Card>

      {created ? (
        <Card className="border-gold/50 bg-gold/10 p-4">
          <p className="stencil text-xs tracking-wider text-gold">Shown once — share with {created.email} now</p>
          <p className="mt-2 text-sm text-chalk">
            Email: <span className="font-mono">{created.email}</span>
          </p>
          <p className="text-sm text-chalk">
            Temporary password: <span className="font-mono">{created.password}</span>
          </p>
          <p className="mt-2 text-xs text-chalk-faint">
            Send this to them yourself (text, Slack, etc). They can sign in with it and change their password
            anytime.
          </p>
        </Card>
      ) : null}

      {coaches.length === 0 ? (
        <EmptyState>No coaches yet.</EmptyState>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="stencil border-b border-field-600/60 bg-field-800/60 text-[11px] tracking-wider text-chalk-faint">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Last Sign-In</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((coach) => (
                <tr key={coach.id} className="border-b border-field-700/50 last:border-0">
                  <td className="px-4 py-3 text-chalk">{coach.name ?? "—"}</td>
                  <td className="px-4 py-3 text-chalk-dim">{coach.email}</td>
                  <td className="px-4 py-3 text-chalk-faint">
                    {coach.lastSignInAt ? new Date(coach.lastSignInAt).toLocaleDateString() : "Never signed in"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {coach.id === currentUserId ? (
                      <span className="text-xs text-chalk-faint">You</span>
                    ) : (
                      <Button variant="danger" onClick={() => remove(coach.id, coach.email)} disabled={pending}>
                        Remove
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
