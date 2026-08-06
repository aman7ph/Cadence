import { useState } from "react";
import { isValidRepeatIntervalMinutes, isValidRepeatTarget } from "@cadence/shared";

export type RepeatArgs = {
  repeatTarget?: number;
  repeatIntervalMinutes?: number;
};

// Mobile twin of apps/web/src/lib/use-repeat-fields.ts. Duplicated rather than
// shared because packages/shared is framework-agnostic — the backend imports
// it, so it cannot take a React dependency. Same reason useCountdown exists
// twice. The *validation* itself is shared; only the state plumbing is local.
export function useRepeatFields(initialTarget?: number, initialInterval?: number) {
  const [enabled, setEnabled] = useState(initialTarget !== undefined);
  const [target, setTargetRaw] = useState(initialTarget?.toString() ?? "");
  const [interval, setIntervalRaw] = useState((initialInterval ?? 60).toString());
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setEnabled(false);
    setTargetRaw("");
    setIntervalRaw("60");
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
    setTarget: (v: string) => { setTargetRaw(v); setError(null); },
    setInterval: (v: string) => { setIntervalRaw(v); setError(null); },
    reset,
    collect,
  };
}
