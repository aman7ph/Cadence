import { useEffect, useState } from "react";
import { remainingMs } from "@cadence/shared";

// Milliseconds left until `deadline` (epoch ms), ticking once a second.
// Returns 0 when there is no deadline or it has already passed.
//
// Client-driven because Convex pushes on data changes, and a deadline merely
// elapsing is not one. Mirrors the web app's hook; the tray is a separate Vite
// app with no shared component layer, and packages/shared cannot hold React
// code because the Convex backend imports it.
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
      if (left === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}
