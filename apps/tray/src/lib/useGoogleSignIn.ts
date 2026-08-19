import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";

const isTauri = "__TAURI_INTERNALS__" in window;

export type SignInStatus = "idle" | "opening" | "waiting" | "error";

/**
 * Google sign-in for the tray, which needs two different flows.
 *
 * Kept out of the screen because the desktop path is a protocol, not UI: a
 * loopback server, a bridge page and a one-time ticket have to happen in order,
 * and reading that between JSX branches hid it.
 */
export function useGoogleSignIn() {
  const { signIn, isLoaded } = useSignIn();
  const [status, setStatus] = useState<SignInStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const start = async () => {
    if (!signIn || !isLoaded) return;
    setStatus("opening");
    setErrorMsg("");

    try {
      if (isTauri) {
        // Desktop flow (RFC 8252 loopback), routed through a real web page instead
        // of signIn.create() here: Clerk's production instance ties the OAuth
        // callback to a session cookie scoped to whichever browser started the
        // flow. Doing the whole flow in the system browser against our own web
        // domain keeps that cookie context consistent end to end (unlike either
        // starting it here and finishing in the system browser, or embedding it
        // in this window's own webview, which would lose the user's existing
        // logged-in Google session). See apps/web's desktop-sign-in* pages.
        // 1. Start a one-shot HTTP server on a random loopback port
        // 2. Open the web app's bridge page in the system browser, passing the
        //    loopback URL as where it should hand back a one-time sign-in ticket
        // 3. That page signs in with Google, mints the ticket, and redirects to
        //    http://localhost:{port}/sso-callback?ticket=...
        // 4. Our server catches it and emits "oauth-callback" to this window
        const webAppUrl = import.meta.env.VITE_WEB_APP_URL;
        if (!webAppUrl) throw new Error("Missing VITE_WEB_APP_URL");

        const { invoke } = await import("@tauri-apps/api/core");
        const port = await invoke<number>("start_oauth_callback");
        const redirectUrl = `http://localhost:${port}/sso-callback`;
        const bridgeUrl = `${webAppUrl}/desktop-sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`;

        const { open } = await import("@tauri-apps/plugin-shell");
        await open(bridgeUrl);
        setStatus("waiting");
      } else {
        // Browser dev preview: standard in-window redirect
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: window.location.origin,
        });
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      const msg = err instanceof Error ? err.message : "";
      setErrorMsg(msg || "Sign-in failed. Please try again.");
      setStatus("error");
    }
  };

  return {
    status,
    errorMsg,
    isLoaded,
    start,
    cancel: () => setStatus("idle"),
  };
}
