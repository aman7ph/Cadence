import { useEffect, useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { LoadingShell } from "./Shell";

const isTauri = "__TAURI_INTERNALS__" in window;

// The whole Google OAuth exchange happens on the web app's desktop-sign-in bridge
// pages (see apps/web/src/components/desktop-sign-in.tsx) — this window never talks
// to Clerk's OAuth callback directly. Our loopback server instead receives a
// one-time sign-in ticket, which we exchange here for a session in this window's
// own Clerk client via the "ticket" strategy.
//
// On failure we deliberately show the error instead of silently redirecting to "/":
// window.location.href is a full page reload, which would wipe any console.error
// before it could be read, and a previous bare `catch {}` here silently swallowed
// exactly this kind of failure until it was undiagnosable.
export function SsoCallbackHandler() {
  const { signIn, isLoaded, setActive } = useSignIn();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !signIn || !setActive) return;
    void (async () => {
      try {
        const ticket = new URLSearchParams(window.location.search).get("ticket");
        if (!ticket) throw new Error("Missing ticket in callback URL");
        const result = await signIn.create({ strategy: "ticket", ticket });
        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          window.location.href = "/";
        } else {
          setError(`Sign-in did not complete (status: ${result.status})`);
        }
      } catch (err) {
        const clerkErr = err as {
          errors?: Array<{ message?: string; longMessage?: string; code?: string }>;
        };
        const first = clerkErr?.errors?.[0];
        setError(
          first
            ? `${first.longMessage ?? first.message} (${first.code})`
            : err instanceof Error
              ? err.message
              : "Unknown error",
        );
      }
    })();
  }, [isLoaded, signIn, setActive]);

  if (error) {
    return (
      <div className="sign-in-screen">
        <p className="sign-in-error">{error}</p>
        <button className="sign-in-btn-text" onClick={() => (window.location.href = "/")}>
          Back to sign in
        </button>
      </div>
    );
  }

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
