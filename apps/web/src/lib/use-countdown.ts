import { useEffect, useState } from "react";
import { remainingMs } from "@cadence/shared";

// Milliseconds left until `deadline` (epoch ms), ticking once a second.
// Returns 0 when there is no deadline or it has already passed.
//
// This has to be client-driven: Convex pushes on data changes, and a deadline
// merely elapsing is not one. Without a local tick, a gated task would stay
// visibly locked until something unrelated invalidated the query.
export function useCountdown(deadline: number | undefined): number {
  const [remaining, setRemaining] = useState(() =>
    remainingMs(deadline, Date.now()),
  );

  useEffect(() => {
    setRemaining(remainingMs(deadline, Date.now()));
    if (deadline === undefined) return;

    const id = setInterval(() => {
      const left = remainingMs(deadline, Date.now());
      setRemaining(left);
      // Nothing left to count — stop waking the tab up.
      if (left === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}
