const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const PRACTICE_WEEKDAYS = [1, 2, 4] as const; // Monday, Tuesday, Thursday

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function nextWeekdayOnOrAfter(from: Date, weekday: number) {
  const date = new Date(from);
  const diff = (weekday - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + diff);
  return date;
}

export function weekdayName(weekday: number) {
  return WEEKDAY_NAMES[weekday];
}

/** Generates Monday/Tuesday/Thursday dates starting today through `weeks` weeks out. */
export function generatePracticeDates(weeks: number, startFrom: Date = new Date()) {
  const start = new Date(startFrom);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + weeks * 7);

  const dates: { date: Date; iso: string; weekday: number }[] = [];
  for (const weekday of PRACTICE_WEEKDAYS) {
    let d = nextWeekdayOnOrAfter(start, weekday);
    while (d < end) {
      dates.push({ date: new Date(d), iso: toIsoDate(d), weekday });
      d = new Date(d);
      d.setDate(d.getDate() + 7);
    }
  }
  return dates.sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0));
}

export { toIsoDate };
