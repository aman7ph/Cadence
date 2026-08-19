import { Platform } from "react-native";
// MUST stay above the expo-notifications import — see lib/devLogFilters.ts.
import "./devLogFilters";
import * as Notifications from "expo-notifications";
import type { ReminderAlertMode } from "@cadence/shared";

// Android decides a notification's sound and vibration from its *channel*, and
// a channel is immutable once created — the app cannot change either after the
// fact. So the three alert modes cannot be three settings on one channel; they
// have to be three channels, picked at schedule time.
//
// The `-v1` suffix is the escape hatch that immutability forces. If a channel's
// behaviour ever needs to change, the only route is to create `-v2` and delete
// `-v1`, so the version belongs in the ID from the start rather than being
// retrofitted once it is already on people's devices.
export const REMINDER_CHANNEL_IDS: Record<ReminderAlertMode, string> = {
  sound: "cadence-reminder-sound-v1",
  vibration: "cadence-reminder-vibration-v1",
  both: "cadence-reminder-both-v1",
};

// Wait 0ms, buzz 400ms. One short pulse — a nudge, not an alarm.
const VIBRATION_PATTERN = [0, 400];

const CHANNELS: Record<
  ReminderAlertMode,
  Notifications.NotificationChannelInput
> = {
  sound: {
    name: "Reminder (sound)",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    enableVibrate: false,
  },
  vibration: {
    name: "Reminder (vibration)",
    importance: Notifications.AndroidImportance.HIGH,
    sound: null,
    enableVibrate: true,
    vibrationPattern: VIBRATION_PATTERN,
  },
  both: {
    name: "Reminder (sound + vibration)",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    enableVibrate: true,
    vibrationPattern: VIBRATION_PATTERN,
  },
};

// Idempotent: re-registering an existing channel is a no-op for the properties
// Android has frozen, so this can run on every launch without special-casing.
export async function ensureReminderChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Promise.all(
    (Object.keys(CHANNELS) as ReminderAlertMode[]).map((mode) =>
      Notifications.setNotificationChannelAsync(
        REMINDER_CHANNEL_IDS[mode],
        CHANNELS[mode],
      ),
    ),
  );
}

export async function hasNotificationPermission(): Promise<boolean> {
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

// Asked for by the settings UI when the reminder is switched on, not on
// launch — a permission prompt with no context attached is the kind users
// reflexively decline. Returns the resulting state either way, so the form can
// say the reminder will not fire rather than appearing to have worked.
export async function requestNotificationPermission(): Promise<boolean> {
  const { granted } = await Notifications.requestPermissionsAsync();
  return granted;
}
