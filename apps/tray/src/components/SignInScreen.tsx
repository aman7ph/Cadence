import { useGoogleSignIn } from "../lib/useGoogleSignIn";
import { GoogleIcon } from "./GoogleIcon";
import { TrayLogo } from "./TrayLogo";

export function SignInScreen() {
  const { status, errorMsg, isLoaded, start, cancel } = useGoogleSignIn();

  return (
    <div className="sign-in-screen">
      <TrayLogo />
      <h1 className="sign-in-title">Cadence</h1>
      <p className="sign-in-sub">
        {status === "waiting"
          ? "Complete sign-in in your browser, then return here."
          : "Sign in to sync your tasks"}
      </p>

      {status !== "waiting" && (
        <button
          className="sign-in-btn"
          onClick={start}
          disabled={!isLoaded || status === "opening"}
        >
          {status === "opening" ? (
            <span className="sign-in-spinner" />
          ) : (
            <GoogleIcon />
          )}
          {status === "opening" ? "Opening browser…" : "Continue with Google"}
        </button>
      )}

      {status === "waiting" && (
        <div className="sign-in-waiting">
          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
          <button className="sign-in-btn-text" onClick={cancel}>
            Cancel
          </button>
        </div>
      )}

      {status === "error" && <p className="sign-in-error">{errorMsg}</p>}
    </div>
  );
}
