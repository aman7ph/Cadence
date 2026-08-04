import { useState } from "react";
import { isValidRepeatIntervalMinutes, isValidRepeatTarget } from "@cadence/shared";

export type RepeatArgs = {
  repeatTarget?: number;
  repeatIntervalMinutes?: number;
};

// Shared state + validation for the repeat inputs, so every creation form
// (tasks, routines, and the staged-task assign flow later) behaves identically
// and rejects exactly what the mutations reject.
export function useRepeatFields(initialTarget?: number, initialInterval?: number) {
  const [enabled, setEnabled] = useState(initialTarget !== undefined);
  const [target, setTarget] = useState(initialTarget?.toString() ?? "");
  const [interval, setInterval] = useState((initialInterval ?? 60).toString());
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEnabled(false);
    setTarget("");
    setInterval("60");
    setError(null);
  };

  // The args to send, or null when the entry is invalid — in which case the
  // error message is set and the caller should abandon the submit.
  const collect = (): RepeatArgs | null => {
    if (!enabled) return {};
    const t = Number(target);
    const i = Number(interval);
    if (!isValidRepeatTarget(t)) {
      setError("Enter how many times — a whole number from 2 to 100.");
      return null;
    }
    if (!isValidRepeatIntervalMinutes(i)) {
      setError("Enter the wait as whole minutes from 0 to 1440 (24h).");
      return null;
    }
    setError(null);
    return { repeatTarget: t, repeatIntervalMinutes: i };
  };

  return {
    enabled,
    toggle: () => setEnabled((v) => !v),
    target,
    interval,
    error,
    setTarget: (v: string) => { setTarget(v); setError(null); },
    setInterval: (v: string) => { setInterval(v); setError(null); },
    reset,
    collect,
  };
}
