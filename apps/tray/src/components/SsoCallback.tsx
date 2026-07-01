import { useEffect } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { LoadingShell } from "./Shell";

const isTauri = "__TAURI_INTERNALS__" in window;

// Uses signIn.reload() + setActive() instead of handleRedirectCallback.
// Clerk's backend completes the Google exchange before redirecting to our loopback
// port, so reload() immediately returns status "complete". We activate the session
// and navigate ourselves — Clerk never controls the WebView URL.
export function SsoCallbackHandler() {
  const { signIn, isLoaded, setActive } = useSignIn();

  useEffect(() => {
    if (!isLoaded || !signIn || !setActive) return;
    void (async () => {
      try {
        const updated = await signIn.reload();
        if (updated.status === "complete" && updated.createdSessionId) {
          await setActive({ session: updated.createdSessionId });
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
