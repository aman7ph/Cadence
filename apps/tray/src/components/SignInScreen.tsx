import { useEffect, useRef, useState } from "react";
import { useSignIn } from "@clerk/clerk-react";

const isTauri = "__TAURI_INTERNALS__" in window;

function Logo() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const s = 32;
    c.width = s * dpr;
    c.height = s * dpr;
    c.style.width = `${s}px`;
    c.style.height = `${s}px`;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.beginPath();
    ctx.arc(12, 12, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#4a9eff";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(20, 20, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#3dd68c";
    ctx.fill();
  }, []);
  return <canvas ref={ref} aria-hidden="true" />;
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function SignInScreen() {
  const { signIn, isLoaded } = useSignIn();
  const [status, setStatus] = useState<"idle" | "opening" | "waiting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogle = async () => {
    if (!signIn || !isLoaded) return;
    setStatus("opening");
    setErrorMsg("");

    try {
      if (isTauri) {
        // Desktop flow (RFC 8252 loopback):
        // 1. Start a one-shot HTTP server on a random loopback port
        // 2. Get OAuth URL from Clerk using that port as the redirect
        // 3. Open OAuth URL in system browser
        // 4. Browser redirects to http://localhost:{port}/sso-callback?...
        // 5. Our server catches it and emits "oauth-callback" to the WebView
        const { invoke } = await import("@tauri-apps/api/core");
        const port = await invoke<number>("start_oauth_callback");
        const redirectUrl = `http://localhost:${port}/sso-callback`;

        const result = await signIn.create({
          strategy: "oauth_google",
          redirectUrl,
        });

        const oauthUrl = result.firstFactorVerification.externalVerificationRedirectURL;
        if (!oauthUrl) throw new Error("No OAuth URL returned from Clerk");

        const { open } = await import("@tauri-apps/plugin-shell");
        await open(oauthUrl.toString());
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

  return (
    <div className="sign-in-screen">
      <Logo />
      <h1 className="sign-in-title">Cadence</h1>
      <p className="sign-in-sub">
        {status === "waiting"
          ? "Complete sign-in in your browser, then return here."
          : "Sign in to sync your tasks"}
      </p>

      {status !== "waiting" && (
        <button
          className="sign-in-btn"
          onClick={handleGoogle}
          disabled={!isLoaded || status === "opening"}
        >
          {status === "opening" ? <span className="sign-in-spinner" /> : <GoogleIcon />}
          {status === "opening" ? "Opening browser…" : "Continue with Google"}
        </button>
      )}

      {status === "waiting" && (
        <div className="sign-in-waiting">
          <div className="loading-dots">
            <span /><span /><span />
          </div>
          <button className="sign-in-btn-text" onClick={() => setStatus("idle")}>
            Cancel
          </button>
        </div>
      )}

      {status === "error" && <p className="sign-in-error">{errorMsg}</p>}
    </div>
  );
}
