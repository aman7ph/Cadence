export function todayLocal(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: string, delta: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + delta);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

export type DayString = string;

// ─── Date range type ─────────────────────────────────────────────────────────

export type DateRange = { from: string; to: string };

// ─── Range arithmetic ─────────────────────────────────────────────────────────

// Inclusive day count: daysBetween("2026-06-01", "2026-06-01") === 1
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const fromMs = Date.UTC(fy!, fm! - 1, fd!);
  const toMs = Date.UTC(ty!, tm! - 1, td!);
  return Math.round((toMs - fromMs) / 86_400_000) + 1;
}

// ISO week: Monday is the first day. Returns the Monday of the week containing date.
export function startOfWeek(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  const dow = dt.getUTCDay(); // 0=Sun … 6=Sat
  const offset = dow === 0 ? 6 : dow - 1; // Sun → back 6, Mon → back 0
  dt.setUTCDate(dt.getUTCDate() - offset);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function endOfWeek(date: string): string {
  return addDays(startOfWeek(date), 6);
}

export function startOfMonth(date: string): string {
  const [y, m] = date.split("-");
  return `${y}-${m}-01`;
}

export function endOfMonth(date: string): string {
  const [y, m] = date.split("-").map(Number);
  // Day 0 of the next month equals the last day of this month
  const dt = new Date(Date.UTC(y!, m!, 0));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function startOfYear(date: string): string {
  const [y] = date.split("-");
  return `${y}-01-01`;
}

export function endOfYear(date: string): string {
  const [y] = date.split("-");
  return `${y}-12-31`;
}

// ─── Month navigation (YYYY-MM strings) ──────────────────────────────────────

export function prevMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-").map(Number);
  if (m === 1) return `${y! - 1}-12`;
  return `${y}-${String(m! - 1).padStart(2, "0")}`;
}

export function nextMonth(yyyyMM: string): string {
  const [y, m] = yyyyMM.split("-").map(Number);
  if (m === 12) return `${y! + 1}-01`;
  return `${y}-${String(m! + 1).padStart(2, "0")}`;
}

// Number of calendar days in a given YYYY-MM
export function daysInMonth(yyyyMM: string): number {
  const [y, m] = yyyyMM.split("-").map(Number);
  return new Date(Date.UTC(y!, m!, 0)).getUTCDate();
}

// UTC weekday (0=Sun) of the 1st of the given YYYY-MM — used to offset calendar grids
export function firstWeekdayOfMonth(yyyyMM: string): number {
  const [y, m] = yyyyMM.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, 1)).getUTCDay();
}

// ─── Display formatting ───────────────────────────────────────────────────────

// "June 2026" — uses browser locale but UTC midnight to avoid DST shifts
export function formatMonthYear(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

// "Jun 25" — uses browser locale but UTC midnight to avoid DST shifts
export function formatDateShort(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
