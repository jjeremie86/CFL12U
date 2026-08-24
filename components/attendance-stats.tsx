import type { ReactNode } from "react";
import type { AttendanceHistoryRow } from "@/lib/use-attendance-history";
import type { PlayerAttendanceRow } from "@/lib/use-player-attendance-summary";
import { formatEventDate } from "@/lib/use-attendance";
import { Card, EmptyState } from "@/components/ui";

export function AttendanceStatTiles({
  present,
  absent,
  excused,
  total,
}: {
  present: number;
  absent: number;
  excused?: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className={`grid grid-cols-2 gap-3 ${excused === undefined ? "sm:grid-cols-4" : "sm:grid-cols-5"}`}>
      <StatTile label="Expected" value={total} />
      <StatTile label="Present" value={present} tone="good" />
      <StatTile label="Absent" value={absent} tone="bad" />
      {excused !== undefined ? <StatTile label="Excused" value={excused} tone="default" /> : null}
      <StatTile label="Attendance" value={`${pct}%`} tone="gold" />
    </div>
  );
}

function StatTile({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "good" | "bad" | "gold" }) {
  const toneClasses: Record<string, string> = {
    default: "text-chalk",
    good: "text-chalk",
    bad: "text-flag",
    gold: "text-gold",
  };
  return (
    <Card className="p-4 text-center">
      <p className="stencil text-[11px] tracking-wider text-chalk-faint">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClasses[tone]}`}>{value}</p>
    </Card>
  );
}

export function AttendanceHistoryTable({
  history,
  emptyLabel,
  showExcused = true,
}: {
  history: AttendanceHistoryRow[];
  emptyLabel: string;
  showExcused?: boolean;
}) {
  if (history.length === 0) {
    return <EmptyState>{emptyLabel}</EmptyState>;
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="stencil border-b border-field-600/60 bg-field-800/60 text-[11px] tracking-wider text-chalk-faint">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Present</th>
            <th className="px-4 py-3">Absent</th>
            {showExcused ? <th className="px-4 py-3">Excused</th> : null}
            <th className="px-4 py-3 text-right">Attendance</th>
          </tr>
        </thead>
        <tbody>
          {history.map((row) => (
            <tr key={row.event.id} className="border-b border-field-700/50 last:border-0">
              <td className="px-4 py-3 text-chalk">
                {formatEventDate(row.event.event_date)}
                <span className="ml-2 text-xs text-chalk-faint">{row.event.title}</span>
              </td>
              <td className="px-4 py-3 text-chalk">
                {row.present} / {row.total}
              </td>
              <td className="px-4 py-3 text-chalk-faint">{row.absent}</td>
              {showExcused ? <td className="px-4 py-3 text-chalk-faint">{row.excused}</td> : null}
              <td className="px-4 py-3 text-right font-mono text-gold">{row.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function PlayerAttendanceTable({
  summary,
  emptyLabel,
  showExcused = true,
}: {
  summary: PlayerAttendanceRow[];
  emptyLabel: string;
  showExcused?: boolean;
}) {
  if (summary.length === 0) {
    return <EmptyState>{emptyLabel}</EmptyState>;
  }

  return (
    <Card className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="stencil border-b border-field-600/60 bg-field-800/60 text-[11px] tracking-wider text-chalk-faint">
          <tr>
            <th className="px-4 py-3">Player</th>
            <th className="px-4 py-3">Present</th>
            <th className="px-4 py-3">Absent</th>
            {showExcused ? <th className="px-4 py-3">Excused</th> : null}
            <th className="px-4 py-3 text-right">Attendance %</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row) => (
            <tr key={row.player.id} className="border-b border-field-700/50 last:border-0">
              <td className="px-4 py-3">
                <span className="mr-2 font-mono text-gold">#{row.player.jersey_number}</span>
                <span className="text-chalk">{row.player.name}</span>
              </td>
              <td className="px-4 py-3 text-chalk">{row.present}</td>
              <td className="px-4 py-3 text-chalk-faint">{row.absent}</td>
              {showExcused ? <td className="px-4 py-3 text-chalk-faint">{row.excused}</td> : null}
              <td className="px-4 py-3 text-right font-mono text-gold">{row.pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
