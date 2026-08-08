// The nudge reminder — a single recurring "go look at Cadence" prompt. It is
// deliberately NOT per-task: one reminder exists per user, and its only job is
// to get the app opened. Nothing here knows what is on the list.
//
// The scheduling model is the load-bearing decision. A naive "every N minutes,
// forever" repeating trigger cannot express an active window, so it would fire
// at 03:00. Instead the window is *enumerated* into fixed times of day, each
// scheduled as its own daily-repeating notification:
//
//   09:00–21:00 every 90m → 09:00 10:30 12:00 … 21:00  (9 daily triggers)
//
// Sleeping hours are then excluded by construction, and the schedule sustains
// itself with no server, no cron, and no push infrastructure.
//
// Times are minutes from *local* midnight. Like the YYYY-MM-DD day strings
// used everywhere else in the app, they are interpreted on the device, so
// travelling across timezones shifts the reminders with the user.

export type ReminderAlertMode = "sound" | "vibration" | "both";

export interface ReminderSettings {
  enabled: boolean;
  intervalMinutes: number;
  startMinute: number; // 0..1439, minutes from local midnight
  endMinute: number;   // ditto; may be < startMinute to cross midnight
  alertMode: ReminderAlertMode;
}

export const MINUTES_PER_DAY = 1440;

export const MIN_REMINDER_INTERVAL_MINUTES = 15;
export const MAX_REMINDER_INTERVAL_MINUTES = 480; // 8h

// A guard against a typo scheduling hundreds of notifications — a 5-minute
// interval across 12 hours is 145 of them. Android imposes no equivalent hard
// limit, so this is a sanity bound rather than a platform one.
export const MAX_REMINDER_SLOTS = 60;

export const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  intervalMinutes: 120,
  startMinute: 9 * 60,
  endMinute: 22 * 60,
  alertMode: "both",
};

// Length of the active window in minutes. An end before the start means the
// window crosses midnight: 22:00 → 06:00 is 8h, not −16h.
export function reminderWindowLength(startMinute: number, endMinute: number): number {
  const span = endMinute - startMinute;
  return span > 0 ? span : span + MINUTES_PER_DAY;
}

// "09:00", "22:30" — 24h, so a list of interval-driven times never reads
// ambiguously. Tolerates out-of-range input rather than throwing, since it is
// only ever used to render.
export function formatMinuteOfDay(minuteOfDay: number): string {
  const m = ((minuteOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
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
    const m = (((startMinute + offset) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
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
  return Math.floor(reminderWindowLength(startMinute, endMinute) / intervalMinutes) + 1;
}

function isMinuteOfDay(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < MINUTES_PER_DAY;
}

export function isValidReminderInterval(minutes: number): boolean {
  return (
    Number.isInteger(minutes) &&
    minutes >= MIN_REMINDER_INTERVAL_MINUTES &&
    minutes <= MAX_REMINDER_INTERVAL_MINUTES
  );
}

// Equal endpoints are rejected rather than guessed at: "zero length" and "all
// day" are both defensible readings of 09:00 → 09:00, so neither is assumed.
export function isValidReminderWindow(startMinute: number, endMinute: number): boolean {
  return isMinuteOfDay(startMinute) && isMinuteOfDay(endMinute) && startMinute !== endMinute;
}

// Validation shared by the Convex mutation and the settings form, so the two
// cannot disagree about what is acceptable. Returns the message to show, or
// null when the settings are good.
export function reminderValidationError(settings: ReminderSettings): string | null {
  if (!isValidReminderInterval(settings.intervalMinutes)) {
    return `Remind me every ${MIN_REMINDER_INTERVAL_MINUTES} to ${MAX_REMINDER_INTERVAL_MINUTES} minutes — whole minutes only.`;
  }
  if (!isValidReminderWindow(settings.startMinute, settings.endMinute)) {
    return "Pick a start and end time that aren't the same.";
  }
  const count = reminderSlotCount(
    settings.startMinute,
    settings.endMinute,
    settings.intervalMinutes,
  );
  if (count > MAX_REMINDER_SLOTS) {
    return `That's ${count} reminders a day — the limit is ${MAX_REMINDER_SLOTS}. Use a longer interval or a shorter window.`;
  }
  return null;
}

// Throwing form used by the mutation, mirroring validateRepeatArgs in
// ./repeat, so the server rejects exactly what the form rejects.
export function validateReminder(settings: ReminderSettings): void {
  const error = reminderValidationError(settings);
  if (error) throw new Error(error);
}
