import { useEffect } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { LoadingShell } from "./Shell";

const isTauri = "__TAURI_INTERNALS__" in window;

// The whole Google OAuth exchange happens on the web app's desktop-sign-in bridge
// pages (see apps/web/src/components/desktop-sign-in.tsx) — this window never talks
// to Clerk's OAuth callback directly. Our loopback server instead receives a
// one-time sign-in ticket, which we exchange here for a session in this window's
// own Clerk client via the "ticket" strategy.
export function SsoCallbackHandler() {
  const { signIn, isLoaded, setActive } = useSignIn();

  useEffect(() => {
    if (!isLoaded || !signIn || !setActive) return;
    void (async () => {
      try {
        const ticket = new URLSearchParams(window.location.search).get("ticket");
        if (!ticket) throw new Error("Missing ticket");
        const result = await signIn.create({ strategy: "ticket", ticket });
        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
        }
        window.location.href = "/";
      } catch {
        window.location.href = "/";
      }
    })();
  }, [isLoaded, signIn, setActive]);

  return <LoadingShell />;
}

export function useDeepLinkCallback() {
  useEffect(() => {
    if (!isTauri) return;
    let unlisten: (() => void) | undefined;
    import("@tauri-apps/api/event").then(({ listen }) => {
      // Real navigation so Clerk SDK re-initializes fresh at the callback URL.
      listen<string>("oauth-callback", ({ payload: path }) => {
        window.location.href = path;
      }).then((fn) => { unlisten = fn; });
    });
    return () => { unlisten?.(); };
  }, []);
}
