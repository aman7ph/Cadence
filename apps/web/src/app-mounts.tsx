import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { todayLocal } from "@cadence/shared";

/**
 * Invisible mounts the signed-in shell needs: provisioning the user document,
 * and rolling the day over when the tab comes back to the foreground.
 *
 * They render nothing, so keeping them beside the layout only made the entry
 * file longer than the app it starts.
 */

export function EnsureProvisioned() {
  const me = useQuery(api.users.getMe);
  const ensureProvisioned = useMutation(api.users.ensureProvisioned);
  useEffect(() => {
    if (me === null) {
      void ensureProvisioned({});
    }
  }, [me, ensureProvisioned]);
  return null;
}

export function RolloverOnForeground() {
  const me = useQuery(api.users.getMe);
  const rolloverOpenTasks = useMutation(api.taskDays.rolloverOpenTasks);
  const promoteDueStagedTasks = useMutation(
    api.stagedTaskScheduling.promoteDue,
  );
  const lastRolloverDate = useRef<string | null>(null);

  useEffect(() => {
    if (!me) return;

    const rollIfNeeded = () => {
      const today = todayLocal();
      if (lastRolloverDate.current === today) return;
      lastRolloverDate.current = today;
      // Promote before rollover: promoted tasks land with currentDate = today,
      // so they are never subject to same-day carryover.
      void promoteDueStagedTasks({ today });
      void rolloverOpenTasks({ today });
    };

    rollIfNeeded();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") rollIfNeeded();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [me, rolloverOpenTasks, promoteDueStagedTasks]);

  return null;
}
