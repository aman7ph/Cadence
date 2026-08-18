import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  DEFAULT_REMINDER,
  type ReminderAlertMode,
  type ReminderSettings,
  reminderValidationError,
} from "@cadence/shared";
import { requestNotificationPermission } from "./notificationChannels";

// The interval is held as text, not a number, for the same reason
// the Stepper does it: a TextInput mid-edit legitimately contains "" or
// "1", neither of which is a valid setting but both of which the user must be
// allowed to type through.
interface Draft {
  enabled: boolean;
  intervalText: string;
  startMinute: number;
  endMinute: number;
  alertMode: ReminderAlertMode;
}

const toDraft = (s: ReminderSettings): Draft => ({
  enabled: s.enabled,
  intervalText: String(s.intervalMinutes),
  startMinute: s.startMinute,
  endMinute: s.endMinute,
  alertMode: s.alertMode,
});

const toSettings = (d: Draft): ReminderSettings => ({
  enabled: d.enabled,
  // "" → 0 and "abc" → NaN both fail the shared validator, so a half-typed
  // field surfaces as an error rather than being persisted.
  intervalMinutes: Number(d.intervalText),
  startMinute: d.startMinute,
  endMinute: d.endMinute,
  alertMode: d.alertMode,
});

// Settings persist on every valid change, with no save button — the idiom the
// rest of this screen already uses (theme and routine weight both write
// straight through). Rescheduling is deliberately NOT done here: ReminderSync
// watches the Convex value instead, so a change made on another device
// reschedules on this one too.
export function useReminderSettings() {
  const me = useQuery(api.users.getMe);
  const persist = useMutation(api.users.setReminder);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Server value seeds the draft, then the draft wins. Letting a server echo
  // overwrite it mid-edit would fight the user's typing.
  const current: Draft = draft ?? toDraft(me?.reminder ?? DEFAULT_REMINDER);
  const settings = toSettings(current);
  const error = reminderValidationError(settings);

  const update = (patch: Partial<Draft>) => {
    const next = { ...current, ...patch };
    setDraft(next);

    // Asked for at the moment the reminder is switched on, where the prompt
    // has obvious context — not on app launch.
    if (patch.enabled === true) {
      void requestNotificationPermission().then((granted) =>
        setPermissionDenied(!granted),
      );
    }

    const nextSettings = toSettings(next);
    if (reminderValidationError(nextSettings) === null) {
      void persist({ reminder: nextSettings });
    }
  };

  return {
    ready: me !== undefined,
    draft: current,
    settings,
    error,
    // True only when the user turned the reminder on and then declined the
    // permission, so the UI can say nothing will fire instead of looking fine.
    permissionDenied: permissionDenied && current.enabled,
    update,
  };
}
