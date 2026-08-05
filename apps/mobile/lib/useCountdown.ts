import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { remainingMs } from "@cadence/shared";

// Milliseconds left until `deadline` (epoch ms), ticking once a second.
// Returns 0 when there is no deadline or it has already passed.
//
// Client-driven because Convex pushes on data changes, and a deadline merely
// elapsing is not one. The AppState listener matters more here than on web:
// a backgrounded app must not keep a 1s timer alive, and on return the
// remaining time is recomputed from the clock rather than from missed ticks.
export function useCountdown(deadline: number | undefined): number {
  const [remaining, setRemaining] = useState(() =>
    remainingMs(deadline, Date.now()),
  );

  useEffect(() => {
    setRemaining(remainingMs(deadline, Date.now()));
    if (deadline === undefined) return;

    let timer: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    };

    const start = () => {
      stop();
      setRemaining(remainingMs(deadline, Date.now()));
      timer = setInterval(() => {
        const left = remainingMs(deadline, Date.now());
        setRemaining(left);
        if (left === 0) stop();
      }, 1000);
    };

    start();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") start();
      else stop();
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [deadline]);

  return remaining;
}
