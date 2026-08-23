"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Player } from "@/types/database";
import { Button, Card, EmptyState, Input } from "@/components/ui";

const emptyDraft = { jersey_number: "", name: "", position: "" };

export function RosterManager({ initialPlayers }: { initialPlayers: Player[] }) {
  const supabase = useMemo(() => createClient(), []);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);

  useEffect(() => {
    const channel = supabase
      .channel("players-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => {
        supabase
          .from("players")
          .select("*")
          .order("jersey_number", { ascending: true })
          .then(({ data }) => {
            if (data) setPlayers(data);
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const jersey = Number(draft.jersey_number);
    if (!draft.name.trim() || !draft.position.trim() || Number.isNaN(jersey)) {
      setError("Jersey #, name, and position are required.");
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase
      .from("players")
      .insert({ jersey_number: jersey, name: draft.name.trim(), position: draft.position.trim() });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDraft(emptyDraft);
  }

  function startEdit(player: Player) {
    setEditingId(player.id);
    setEditDraft({
      jersey_number: String(player.jersey_number),
      name: player.name,
      position: player.position,
    });
  }

  async function saveEdit(id: string) {
    const jersey = Number(editDraft.jersey_number);
    if (!editDraft.name.trim() || !editDraft.position.trim() || Number.isNaN(jersey)) {
      setError("Jersey #, name, and position are required.");
      return;
    }
    setError(null);
    const { error: updateError } = await supabase
      .from("players")
      .update({ jersey_number: jersey, name: editDraft.name.trim(), position: editDraft.position.trim() })
      .eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditingId(null);
  }

  async function removePlayer(id: string, name: string) {
    if (!window.confirm(`Remove ${name} from the roster?`)) return;
    const { error: deleteError } = await supabase.from("players").delete().eq("id", id);
    if (deleteError) setError(deleteError.message);
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <form onSubmit={addPlayer} className="flex flex-wrap items-end gap-3">
          <div className="w-24">
            <Input
              type="number"
              placeholder="#"
              value={draft.jersey_number}
              onChange={(e) => setDraft((d) => ({ ...d, jersey_number: e.target.value }))}
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <Input
              placeholder="Player name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div className="w-40">
            <Input
              placeholder="Position"
              value={draft.position}
              onChange={(e) => setDraft((d) => ({ ...d, position: e.target.value }))}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Adding…" : "Add Player"}
          </Button>
        </form>
        {error ? <p className="mt-3 text-sm text-flag">{error}</p> : null}
      </Card>

      {players.length === 0 ? (
        <EmptyState>No players on the roster yet. Add your first player above.</EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="stencil border-b border-field-600/60 bg-field-800/60 text-[11px] tracking-wider text-chalk-faint">
              <tr>
                <th className="px-4 py-3 w-20">#</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3 w-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id} className="border-b border-field-700/50 last:border-0">
                  {editingId === player.id ? (
                    <>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          value={editDraft.jersey_number}
                          onChange={(e) => setEditDraft((d) => ({ ...d, jersey_number: e.target.value }))}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={editDraft.position}
                          onChange={(e) => setEditDraft((d) => ({ ...d, position: e.target.value }))}
                        />
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <Button variant="secondary" onClick={() => saveEdit(player.id)}>
                          Save
                        </Button>
                        <Button variant="ghost" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-mono text-gold">{player.jersey_number}</td>
                      <td className="px-4 py-3 text-chalk">{player.name}</td>
                      <td className="px-4 py-3 text-chalk-dim">{player.position}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Button variant="secondary" onClick={() => startEdit(player)}>
                          Edit
                        </Button>
                        <Button variant="danger" onClick={() => removePlayer(player.id, player.name)}>
                          Remove
                        </Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
