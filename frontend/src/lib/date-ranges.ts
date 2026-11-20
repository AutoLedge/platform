// Date ranges for the transactions Date filter. Everything is in the user's LOCAL time zone,
// because the API filters by calendar date (YYYY-MM-DD).
import { parseLocalDate } from "@/lib/format";

/** Local calendar date → "2026-10-20". */
export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type DateRange = { from: string; to: string };

export type DatePreset = { id: string; label: string; range: (today: Date) => DateRange };

const day = (y: number, m: number, d: number) => toISODate(new Date(y, m, d));

export const DATE_PRESETS: DatePreset[] = [
  {
    id: "this-month",
    label: "This month",
    range: (t) => ({ from: day(t.getFullYear(), t.getMonth(), 1), to: day(t.getFullYear(), t.getMonth() + 1, 0) }),
  },
  {
    id: "last-month",
    label: "Last month",
    range: (t) => ({ from: day(t.getFullYear(), t.getMonth() - 1, 1), to: day(t.getFullYear(), t.getMonth(), 0) }),
  },
  {
    id: "last-7-days",
    label: "Last 7 days",
    range: (t) => ({ from: day(t.getFullYear(), t.getMonth(), t.getDate() - 6), to: toISODate(t) }),
  },
  {
    id: "year-to-date",
    label: "Year to date",
    range: (t) => ({ from: day(t.getFullYear(), 0, 1), to: toISODate(t) }),
  },
];

/** The preset whose dates equal the filter's, if any. */
export function matchPreset(from: string | undefined, to: string | undefined, today = new Date()) {
  if (!from || !to) return undefined;
  return DATE_PRESETS.find((p) => {
    const r = p.range(today);
    return r.from === from && r.to === to;
  });
}

const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const monthDayYear = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** "Oct 1–31, 2026", "Sep 18 – Oct 21, 2026", "Dec 20, 2025 – Jan 5, 2026", "From Oct 1, 2026", "Until …". */
export function formatRange(from: string | undefined, to: string | undefined) {
  if (!from && !to) return "Any time";
  if (from && !to) return `From ${monthDayYear.format(parseLocalDate(from))}`;
  if (!from && to) return `Until ${monthDayYear.format(parseLocalDate(to))}`;
  const a = parseLocalDate(from!);
  const b = parseLocalDate(to!);
  if (from === to) return monthDayYear.format(a);
  if (a.getFullYear() === b.getFullYear()) {
    if (a.getMonth() === b.getMonth()) {
      return `${monthDay.format(a)}–${b.getDate()}, ${b.getFullYear()}`;
    }
    return `${monthDay.format(a)} – ${monthDayYear.format(b)}`;
  }
  return `${monthDayYear.format(a)} – ${monthDayYear.format(b)}`;
}
