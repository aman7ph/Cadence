import { useEffect, useState } from "react";
import { useSignIn, useAuth, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Bridge pages that let the Tauri desktop app sign in via this real web domain
// instead of its own embedded webview. Clerk's production instance ties the OAuth
// callback to a session cookie scoped to whichever browser started the flow; running
// the whole flow here (in the user's actual, already-logged-in-to-Google browser)
// keeps that cookie context consistent end to end. Once signed in, we mint a
// one-time Clerk sign-in token and hand it back to the desktop app's local redirect
// URL so it can establish its own session via the "ticket" strategy.

function getRedirectUrl(): string {
  return new URLSearchParams(window.location.search).get("redirect_url") ?? "";
}

export function DesktopSignIn() {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const redirectUrl = getRedirectUrl();

  // Clerk refuses to start a new sign-in attempt while this browser already has an
  // active session (e.g. the user already uses the main Cadence site here) — it
  // errors with "session_exists" rather than just reusing it. If we're already
  // signed in, skip Google entirely and go straight to minting a ticket for the
  // current session.
  useEffect(() => {
    if (authLoaded && isSignedIn && redirectUrl) {
      window.location.href = `/desktop-sign-in-complete?redirect_url=${encodeURIComponent(redirectUrl)}`;
    }
  }, [authLoaded, isSignedIn, redirectUrl]);

  const handleGoogle = async () => {
    if (!signIn || !signInLoaded) return;
    setLoading(true);
    setError("");
    try {
      const encoded = encodeURIComponent(redirectUrl);
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/desktop-sign-in-callback?redirect_url=${encoded}`,
        redirectUrlComplete: `${window.location.origin}/desktop-sign-in-complete?redirect_url=${encoded}`,
      });
    } catch {
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  if (!authLoaded || (isSignedIn && redirectUrl)) {
    return (
      <div className="min-h-screen w-full grid place-items-center px-4">
        <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full grid place-items-center px-4">
      <Card className="w-full max-w-md overflow-hidden">
        <CardHeader>
          <CardTitle>Sign in to Cadence</CardTitle>
          <CardDescription>
            Continue here, then return to the desktop app.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 pt-0 pb-8">
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogle}
            disabled={!signInLoaded || loading || !redirectUrl}
          >
            {loading ? "Opening Google…" : "Continue with Google"}
          </Button>
          {!redirectUrl && (
            <p className="text-xs text-destructive">
              Missing redirect_url — open this page from the desktop app.
            </p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export function DesktopSignInCallback() {
  const encoded = encodeURIComponent(getRedirectUrl());
  return (
    <AuthenticateWithRedirectCallback
      signInFallbackRedirectUrl={`/desktop-sign-in-complete?redirect_url=${encoded}`}
      signUpFallbackRedirectUrl={`/desktop-sign-in-complete?redirect_url=${encoded}`}
    />
  );
}

export function DesktopSignInComplete() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [error, setError] = useState("");
  const redirectUrl = getRedirectUrl();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !redirectUrl) return;
    void (async () => {
      try {
        const token = await getToken({ template: "convex" });
        const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
        const siteUrl = convexUrl.replace(".convex.cloud", ".convex.site");
        const res = await fetch(`${siteUrl}/mint-sign-in-token`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to mint sign-in token");
        const { token: ticket } = (await res.json()) as { token: string };
        window.location.href = `${redirectUrl}?ticket=${encodeURIComponent(ticket)}`;
      } catch {
        setError("Something went wrong completing sign-in. You can close this tab and try again in the app.");
      }
    })();
  }, [isLoaded, isSignedIn, redirectUrl, getToken]);

  return (
    <div className="min-h-screen w-full grid place-items-center px-4">
      <p className="text-sm text-muted-foreground">{error || "Finishing sign-in…"}</p>
    </div>
  );
}
