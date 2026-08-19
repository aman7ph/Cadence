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
//
// The window arithmetic lives in ./reminderWindow and is re-exported here, so
// this module stays the one import site for everything reminder-shaped.

import { isValidReminderWindow, reminderSlotCount } from "./reminderWindow";

export * from "./reminderWindow";

export type ReminderAlertMode = "sound" | "vibration" | "both";

export interface ReminderSettings {
  enabled: boolean;
  intervalMinutes: number;
  startMinute: number; // 0..1439, minutes from local midnight
  endMinute: number; // ditto; may be < startMinute to cross midnight
  alertMode: ReminderAlertMode;
}

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

export function isValidReminderInterval(minutes: number): boolean {
  return (
    Number.isInteger(minutes) &&
    minutes >= MIN_REMINDER_INTERVAL_MINUTES &&
    minutes <= MAX_REMINDER_INTERVAL_MINUTES
  );
}

// Validation shared by the Convex mutation and the settings form, so the two
// cannot disagree about what is acceptable. Returns the message to show, or
// null when the settings are good.
export function reminderValidationError(
  settings: ReminderSettings,
): string | null {
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
