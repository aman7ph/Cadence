import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  type ReminderSettings,
  computeReminderSlots,
  reminderValidationError,
} from "@cadence/shared";
import { REMINDER_CHANNEL_IDS, ensureReminderChannels } from "./notificationChannels";

const CONTENT = {
  title: "Cadence",
  body: "Check your list.",
};

// The active window is enumerated into fixed times of day, each scheduled as
// its own daily-repeating notification — see the module comment in
// packages/shared/src/reminder.ts for why a single repeating interval trigger
// cannot express "not while I'm asleep".
//
// Reconciling the existing schedule against new settings would mean tracking
// notification IDs and diffing them. Cancelling everything and rebuilding is
// idempotent instead, so this can run on every settings change and every app
// foreground with no bookkeeping, and it repairs itself if the OS ever drops a
// pending notification.
//
// Android restores pending notifications across a reboot on its own — the
// library registers a BOOT_COMPLETED receiver — so nothing here has to.
//
// Returns how many notifications are now scheduled, which the caller can show
// back to the user and the tests can assert against.
export async function syncReminderNotifications(
  settings: ReminderSettings,
): Promise<number> {
  // Android-only feature. Bailing before the cancel matters: on any other
  // platform this must not touch a schedule it does not own.
  if (Platform.OS !== "android") return 0;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.enabled) return 0;

  // Defensive: the form and the mutation both reject invalid settings, so
  // reaching here with bad values means something upstream changed. Schedule
  // nothing rather than a wrong or unbounded set of times.
  if (reminderValidationError(settings) !== null) return 0;

  const slots = computeReminderSlots(
    settings.startMinute,
    settings.endMinute,
    settings.intervalMinutes,
  );
  if (slots.length === 0) return 0;

  await ensureReminderChannels();

  const channelId = REMINDER_CHANNEL_IDS[settings.alertMode];
  for (const { hour, minute } of slots) {
    await Notifications.scheduleNotificationAsync({
      content: CONTENT,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        channelId,
        hour,
        minute,
      },
    });
  }

  return slots.length;
}

// Used by the settings screen to report the live state, and to verify a sync
// landed the expected number of triggers.
export async function countScheduledReminders(): Promise<number> {
  if (Platform.OS !== "android") return 0;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}
