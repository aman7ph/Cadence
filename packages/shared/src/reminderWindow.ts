// The active-window arithmetic behind the nudge reminder: how long a window
// is, what times fall inside it, and how to print one. See ./reminder.ts for
// why the window is enumerated into fixed daily times rather than expressed as
// a single repeating interval.
//
// Times are minutes from *local* midnight throughout.

export const MINUTES_PER_DAY = 1440;

// Length of the active window in minutes. An end before the start means the
// window crosses midnight: 22:00 → 06:00 is 8h, not −16h.
export function reminderWindowLength(
  startMinute: number,
  endMinute: number,
): number {
  const span = endMinute - startMinute;
  return span > 0 ? span : span + MINUTES_PER_DAY;
}

// "09:00", "22:30" — 24h, so a list of interval-driven times never reads
// ambiguously. Tolerates out-of-range input rather than throwing, since it is
// only ever used to render.
export function formatMinuteOfDay(minuteOfDay: number): string {
  const m =
    ((minuteOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// Every time of day the reminder should fire, inclusive of both endpoints.
// Returns [] for a non-positive interval so a bad value can never spin the
// loop — callers read an empty result as "nothing to schedule".
export function computeReminderSlots(
  startMinute: number,
  endMinute: number,
  intervalMinutes: number,
): { hour: number; minute: number }[] {
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) return [];
  const length = reminderWindowLength(startMinute, endMinute);
  const slots: { hour: number; minute: number }[] = [];
  for (let offset = 0; offset <= length; offset += intervalMinutes) {
    const m =
      (((startMinute + offset) % MINUTES_PER_DAY) + MINUTES_PER_DAY) %
      MINUTES_PER_DAY;
    slots.push({ hour: Math.floor(m / 60), minute: m % 60 });
  }
  return slots;
}

// The same count without materializing the array — for the form's live echo
// and for the cap check. Always equal to computeReminderSlots(...).length.
export function reminderSlotCount(
  startMinute: number,
  endMinute: number,
  intervalMinutes: number,
): number {
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) return 0;
  return (
    Math.floor(reminderWindowLength(startMinute, endMinute) / intervalMinutes) +
    1
  );
}

function isMinuteOfDay(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < MINUTES_PER_DAY;
}

// Equal endpoints are rejected rather than guessed at: "zero length" and "all
// day" are both defensible readings of 09:00 → 09:00, so neither is assumed.
export function isValidReminderWindow(
  startMinute: number,
  endMinute: number,
): boolean {
  return (
    isMinuteOfDay(startMinute) &&
    isMinuteOfDay(endMinute) &&
    startMinute !== endMinute
  );
}
