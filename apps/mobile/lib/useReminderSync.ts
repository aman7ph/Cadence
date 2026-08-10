import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { DEFAULT_REMINDER, reminderSlotCount } from "@cadence/shared";
import { countScheduledReminders, syncReminderNotifications } from "./reminderScheduler";

// Keeps the device's scheduled notifications in step with the saved settings.
//
// This lives here rather than in useReminderSettings so it reacts to the
// Convex value itself: settings changed on another device arrive as a normal
// subscription update and reschedule here too (D6).
export function useReminderSync() {
  const me = useQuery(api.users.getMe);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    if (me === undefined) return; // still loading — don't cancel a live schedule
    const settings = me?.reminder ?? DEFAULT_REMINDER;
    const key = JSON.stringify(settings);

    // A settings change always rebuilds, because a change that leaves the slot
    // count identical — switching alert mode, or shifting the window without
    // resizing it — still needs different notifications.
    if (lastKey.current !== key) {
      lastKey.current = key;
      void syncReminderNotifications(settings);
    }

    // Foreground repair. Force-stopping an Android app clears its pending
    // alarms and nothing else restores them, so on every return to the app the
    // live count is compared against what the settings imply and rebuilt only
    // when they disagree. Rebuilding unconditionally would churn dozens of
    // notifications on every foreground, and risks cancelling one that is
    // about to fire.
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void (async () => {
        const expected = settings.enabled
          ? reminderSlotCount(
              settings.startMinute,
              settings.endMinute,
              settings.intervalMinutes,
            )
          : 0;
        if ((await countScheduledReminders()) !== expected) {
          await syncReminderNotifications(settings);
        }
      })();
    });
    return () => sub.remove();
  }, [me]);
}
