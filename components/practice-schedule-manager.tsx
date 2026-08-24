"use client";

import { useState } from "react";
import type { TeamEvent } from "@/types/database";
import { useEvents } from "@/lib/use-events";
import { generatePracticeDates, nextWeekdayOnOrAfter, weekdayName, toIsoDate, PRACTICE_WEEKDAYS } from "@/lib/practice-dates";
import { formatEventDate } from "@/lib/use-attendance";
import { Badge, Button, Card, EmptyState, Input } from "@/components/ui";

const emptyDraft = { event_date: "", event_time: "", location: "" };

export function PracticeScheduleManager({ events, error, addEvent, addEvents, updateEvent, removeEvent }: ReturnType<typeof useEvents>) {
  const [draft, setDraft] = useState(emptyDraft);
  const [weeksToGenerate, setWeeksToGenerate] = useState("4");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);
  const [localError, setLocalError] = useState<string | null>(null);

  function titleFor(iso: string) {
    const [year, month, day] = iso.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return `${weekdayName(date.getDay())} Practice`;
  }

  function quickFill(weekday: number) {
    const date = nextWeekdayOnOrAfter(new Date(), weekday);
    setDraft((d) => ({ ...d, event_date: toIsoDate(date) }));
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!draft.event_date) {
      setLocalError("Pick a date.");
      return;
    }
    setSaving(true);
    await addEvent({
      title: titleFor(draft.event_date),
      event_date: draft.event_date,
      event_time: draft.event_time || null,
      location: draft.location.trim() || null,
    });
    setSaving(false);
    setDraft(emptyDraft);
  }

  async function generateWeeks() {
    setLocalError(null);
    const weeks = Number(weeksToGenerate);
    if (!Number.isFinite(weeks) || weeks <= 0) {
      setLocalError("Enter a valid number of weeks.");
      return;
    }
    const existingDates = new Set(events.map((e) => e.event_date));
    const candidates = generatePracticeDates(weeks).filter((d) => !existingDates.has(d.iso));
    if (candidates.length === 0) {
      setLocalError("Those practice dates are already on the schedule.");
      return;
    }
    setSaving(true);
    await addEvents(candidates.map((d) => ({ title: titleFor(d.iso), event_date: d.iso })));
    setSaving(false);
  }

  function startEdit(event: TeamEvent) {
    setEditingId(event.id);
    setEditDraft({
      event_date: event.event_date,
      event_time: event.event_time ?? "",
      location: event.location ?? "",
    });
  }

  async function saveEdit(id: string) {
    if (!editDraft.event_date) {
      setLocalError("Pick a date.");
      return;
    }
    setLocalError(null);
    const ok = await updateEvent(id, {
      event_date: editDraft.event_date,
      event_time: editDraft.event_time || null,
      location: editDraft.location.trim() || null,
      title: titleFor(editDraft.event_date),
    });
    if (ok) setEditingId(null);
  }

  async function handleRemove(id: string, label: string) {
    if (!window.confirm(`Remove ${label} from the practice schedule?`)) return;
    await removeEvent(id);
  }

  const shownError = error || localError;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <p className="stencil mb-3 text-[11px] tracking-wider text-chalk-faint">
          Typical practice days: Monday, Tuesday, Thursday
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {PRACTICE_WEEKDAYS.map((weekday) => (
            <Button key={weekday} type="button" variant="secondary" onClick={() => quickFill(weekday)}>
              Next {weekdayName(weekday)}
            </Button>
          ))}
        </div>

        <form onSubmit={submitAdd} className="flex flex-wrap items-end gap-3">
          <div>
            <Input
              type="date"
              value={draft.event_date}
              onChange={(e) => setDraft((d) => ({ ...d, event_date: e.target.value }))}
            />
          </div>
          <div>
            <Input
              type="time"
              value={draft.event_time}
              onChange={(e) => setDraft((d) => ({ ...d, event_time: e.target.value }))}
            />
          </div>
          <div className="min-w-[160px]">
            <Input
              placeholder="Location"
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Adding…" : "Add Practice"}
          </Button>
        </form>

        <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-field-700/50 pt-4">
          <div className="w-24">
            <Input
              type="number"
              min={1}
              value={weeksToGenerate}
              onChange={(e) => setWeeksToGenerate(e.target.value)}
            />
          </div>
          <Button type="button" variant="secondary" onClick={generateWeeks} disabled={saving}>
            Generate Mon/Tue/Thu practices
          </Button>
          <span className="text-xs text-chalk-faint">weeks ahead, skipping dates already scheduled</span>
        </div>

        {shownError ? <p className="mt-3 text-sm text-flag">{shownError}</p> : null}
      </Card>

      {events.length === 0 ? (
        <EmptyState>No practices scheduled yet. Add one above, or generate the next few weeks.</EmptyState>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <Card key={event.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              {editingId === event.id ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      type="date"
                      value={editDraft.event_date}
                      onChange={(e) => setEditDraft((d) => ({ ...d, event_date: e.target.value }))}
                    />
                    <Input
                      type="time"
                      value={editDraft.event_time}
                      onChange={(e) => setEditDraft((d) => ({ ...d, event_time: e.target.value }))}
                    />
                    <Input
                      placeholder="Location"
                      value={editDraft.location}
                      onChange={(e) => setEditDraft((d) => ({ ...d, location: e.target.value }))}
                    />
                  </div>
                  <div className="space-x-2">
                    <Button variant="secondary" onClick={() => saveEdit(event.id)}>
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Badge tone="default">{formatEventDate(event.event_date)}</Badge>
                    <div>
                      <p className="text-sm text-chalk">{event.title}</p>
                      {event.location ? <p className="text-xs text-chalk-faint">{event.location}</p> : null}
                    </div>
                  </div>
                  <div className="space-x-2">
                    <Button variant="secondary" onClick={() => startEdit(event)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleRemove(event.id, event.title)}>
                      Remove
                    </Button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
