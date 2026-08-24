const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const PRACTICE_WEEKDAYS = [1, 2, 4] as const; // Monday, Tuesday, Thursday

export function toIsoDate(date: Date) {
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

/** The soonest upcoming Monday, Tuesday, or Thursday (today counts if it's one of those). */
export function defaultPracticeDate(from: Date = new Date()) {
  const candidates = PRACTICE_WEEKDAYS.map((weekday) => nextWeekdayOnOrAfter(from, weekday));
  const earliest = candidates.reduce((a, b) => (a < b ? a : b));
  return toIsoDate(earliest);
}

export function formatLongDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
