import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { todayLocal } from "@cadence/shared";

const isTauri = "__TAURI_INTERNALS__" in window;

export function EnsureProvisioned() {
  const me = useQuery(api.users.getMe);
  const ensureProvisioned = useMutation(api.users.ensureProvisioned);
  const rollover = useMutation(api.dailyTasks.rolloverOpenTasks);

  // Provision user record on first sign-in
  useEffect(() => {
    if (me === null) {
      void ensureProvisioned({});
    }
  }, [me, ensureProvisioned]);

  // Roll over open tasks immediately, then again each time the overlay opens
  useEffect(() => {
    if (!me) return;

    void rollover({ today: todayLocal() });

    if (!isTauri) return;

    let unlisten: (() => void) | undefined;
    import("@tauri-apps/api/event").then(({ listen }) => {
      listen("overlay-shown", () => {
        void rollover({ today: todayLocal() });
      }).then((fn) => {
        unlisten = fn;
      });
    });

    return () => {
      unlisten?.();
    };
  }, [me, rollover]);

  return null;
}
