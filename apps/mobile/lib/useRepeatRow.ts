import { useState } from "react";
import { useCountdown } from "./useCountdown";

// The repeat bookkeeping shared by TaskItem and RoutineItem: is this a repeat
// entity, is the gate closed right now, and the error surfaced when the server
// rejects a rep anyway (clock skew is exactly when that happens).
export function useRepeatRow(repeatTarget?: number, nextRepAllowedAt?: number) {
  const [error, setError] = useState<string | null>(null);
  const remaining = useCountdown(nextRepAllowedAt);

  return {
    isRepeat: repeatTarget !== undefined,
    remaining,
    gated: remaining > 0,
    error,
    clearError: () => setError(null),
    fail: (e: unknown) =>
      setError(
        e instanceof Error ? e.message.split("\n")[0]! : "Something went wrong",
      ),
  };
}
