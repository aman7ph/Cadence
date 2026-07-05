# Authentication across platforms

Every Cadence surface — web, mobile, desktop — offers exactly one sign-in method: "Continue with Google," via Clerk. That sounds like it should be identical everywhere. It isn't, and the reason is worth understanding properly before you touch sign-in code on any platform, because the failure modes only show up in **production**, work fine in **development**, and produce error messages that look nothing like "you're on the wrong platform."

## The root cause: how Clerk tracks a sign-in attempt differs by environment

Clerk instances come in two flavors, and the difference matters enormously here:

- **Development instances** (`pk_test_...` keys) use something Clerk calls **URL-based session syncing**. Since a local dev app usually runs on `localhost` while Clerk's dev Frontend API lives on a completely different domain (`*.accounts.dev`), cookies can't reliably cross that boundary. So Clerk avoids cookies entirely in dev and instead passes session/client identity as a **query string parameter** through every redirect in the OAuth chain. Because the identity travels *in the URL itself*, it doesn't matter which browser, tab, or window completes the flow — anything that follows the URL chain carries the necessary state with it.
- **Production instances** (`pk_live_...` keys) use real, first-party `HttpOnly` cookies scoped to your Clerk Frontend API domain, because in production your app and Clerk's Frontend API are same-site (Clerk's Frontend API is a CNAME under your own domain). Clerk's own docs are explicit that the URL-token approach is **not secure enough for production** — a session token sitting in a URL is a real security smell — so production disables it entirely.

The practical consequence: **anything that depends on one browser/window/context handing off to a different one will work in development purely by accident, and will break in production**, because production requires a consistent, cookie-carrying context from the moment a sign-in attempt starts to the moment Google redirects back.

This is exactly why mobile and desktop each need extra configuration that doesn't exist for web, and why "it worked when I tested it in dev" is not evidence it'll work once you flip to production keys.

---

## Web

Nothing special. `signIn.authenticateWithRedirect({ strategy: "oauth_google", redirectUrl, redirectUrlComplete })` (see `apps/web/src/components/sign-in-card.tsx`) does a same-tab redirect to Google and back. One browser tab, one cookie context, start to finish — this is exactly the case Clerk's SDK is built for, in both development and production.

---

## Mobile

Mobile uses `useSSO` from `@clerk/clerk-expo` (see `apps/mobile/app/sign-in.tsx`), which opens the OAuth flow in an OS-managed auth session (Chrome Custom Tabs on Android, `ASWebAuthenticationSession` on iOS) and redirects back to the app via a custom URL scheme (configured as `scheme` in `apps/mobile/app.config.ts`, e.g. `cadence://`).

**In development**, this works with zero extra configuration, for the URL-based-session-syncing reason above.

**In production**, Clerk validates that the redirect URL your app requests is one it explicitly trusts — and by default, your custom scheme isn't on that list. You'll see a sign-in failure with an error along the lines of:

> "The current redirect url passed in the sign in or sign up request does not match an authorized redirect URI for this instance... `yourapp:///`"

**Fix:** in the Clerk dashboard (production instance selected), go to **Developers → Native applications**, find **"Allowlist for mobile SSO redirect,"** and add your app's scheme (e.g. `yourapp://` — add both with and without a trailing slash if your framework's `Linking.createURL()` produces one, since Clerk matches the redirect URL literally).

---

## Desktop (Tauri tray app)

This is the platform where the dev/production gap actually costs real engineering, not just a dashboard checkbox — because a desktop app has no "browser tab" to stay inside of, and both obvious approaches fail in production for different reasons.

### Why the obvious approaches don't work

**Approach 1 — open the OAuth URL in the system's default browser** (the standard, RFC 8252–recommended pattern for desktop OAuth, and what Google's own "Desktop app" OAuth client type expects):

- The desktop app calls `signIn.create({ strategy: "oauth_google", redirectUrl })` inside its own embedded webview. This sets Clerk's session cookie *in that webview's cookie store*.
- It then opens the resulting Google auth URL in the OS's default browser — a completely separate process with its own, unrelated cookie store, which has never talked to your Clerk Frontend API domain before.
- Google authenticates the user fine and redirects back to Clerk's own callback endpoint (`/v1/oauth_callback`) — but that request arrives from the system browser, without the session cookie Clerk needs to correlate it to the sign-in attempt that was created in the embedded webview. Clerk rejects it as unauthorized (`authorization_invalid` / "You are not authorized to perform this request").
- This works perfectly in development (no cookies involved at all, remember) and fails **only** in production, which makes it a nasty surprise to discover after shipping.

**Approach 2 — open the OAuth URL in a second window owned by the app itself** (so it shares the embedded webview's cookie store):

- This does fix the cookie-correlation problem. But that window is a brand-new, empty browser profile that has never logged into Google before — so instead of the user's usual "choose an account" picker, they're forced through a full email/password entry, which defeats the point of "Continue with Google" for anyone who doesn't have their password memorized (which, in practice, is most people who use Google's passwordless/saved-session login day to day).
- (If you go this route on Windows specifically: creating a window via `WebviewWindowBuilder::build()` from inside a **synchronous** Tauri command deadlocks, because `build()` needs WebView2's own message loop, which a sync command handler blocks. The command must be `async fn`.)

### The actual solution: a web-hosted bridge + one-time sign-in tokens

The desktop app instead borrows the user's **real, already-logged-in browser** — but routes the entire OAuth exchange through a page hosted on the **web app's own production domain**, not through the desktop app's embedded context at all. Since the web app already has a fully working, same-site Clerk setup, there's no cookie-correlation problem to solve — the whole flow (starting the sign-in, completing Google OAuth, and Clerk's own callback) happens in one consistent browser context the entire time.

The flow, end to end (see `apps/tray/src/components/SignInScreen.tsx`, `apps/web/src/components/desktop-sign-in.tsx`, and `packages/backend/convex/http.ts`):

1. The desktop app starts a one-shot local HTTP server on a random loopback port (`apps/tray/src-tauri/src/commands.rs`, `start_oauth_callback`) — this is the RFC 8252 "loopback redirect" pattern.
2. It opens the system's default browser to `<your-web-app-url>/desktop-sign-in?redirect_url=http://localhost:<port>/sso-callback`.
3. That page (`DesktopSignIn`) checks whether the browser already has an active Clerk session (very likely, if this is the user's everyday browser) — if so, it skips straight to step 5. Otherwise it shows "Continue with Google" and runs the normal web sign-in flow.
4. `DesktopSignInCallback` renders Clerk's `<AuthenticateWithRedirectCallback>` to complete the OAuth exchange, then continues to step 5.
5. `DesktopSignInComplete`, now definitely signed in, calls a Convex HTTP action (`POST /mint-sign-in-token`) with its Convex auth token. That action calls Clerk's Backend API (`POST https://api.clerk.com/v1/sign_in_tokens`) using `CLERK_SECRET_KEY` — a **server-side-only** secret, never exposed to any client — to mint a one-time sign-in token for the authenticated user.
6. The browser is redirected to `http://localhost:<port>/sso-callback?ticket=<token>` — the desktop app's own loopback server, which is listening for exactly this.
7. The loopback server (still in `commands.rs`) emits an `"oauth-callback"` event to the desktop app's overlay window with the callback path.
8. The overlay window navigates to `/sso-callback?ticket=...` and `SsoCallbackHandler` (`apps/tray/src/components/SsoCallback.tsx`) exchanges the ticket for a real session in its own Clerk client via `signIn.create({ strategy: "ticket", ticket })`, then `setActive()`.

This requires three pieces of setup that don't exist for web or mobile:

- **Clerk dashboard → Instance settings → allowed origins** (Backend API only, not exposed in the dashboard UI): the desktop app's own webview origin must be explicitly allowlisted, since Clerk locks production keys to your configured domain and desktop app webviews (e.g. `http://tauri.localhost` on Windows) aren't a subdomain of it.

  ```powershell
  curl -X PATCH https://api.clerk.com/v1/instance -H "Authorization: Bearer sk_live_..." -H "Content-type: application/json" -d '{"allowed_origins": ["http://tauri.localhost"]}'
  ```

  (This replaces the whole `allowed_origins` list rather than appending to it — include every origin you need in one call.)

- **`CLERK_SECRET_KEY` set on the production Convex deployment** — required by the `/mint-sign-in-token` HTTP action. Never commit this or put it in any client-side env file; `npx convex env set CLERK_SECRET_KEY sk_live_... --prod` from `packages/backend`.

- **`VITE_WEB_APP_URL`** set in the tray app's env, pointing at wherever the web app is actually deployed — this is how the desktop app knows where to send the browser in step 2.

### Implementation pitfalls worth knowing about if you touch this code

- **Windows serves the bundled desktop frontend at `http://tauri.localhost`, not `tauri://localhost`.** The latter is the macOS/iOS scheme. Getting this wrong doesn't error — it silently leaves the window on a blank page, because the URL is syntactically valid but nothing is listening there.
- **`useSignIn()`'s `signIn` object changes identity every time its internal state changes** — including immediately after you call `signIn.create()`. If a `useEffect` doing the ticket exchange depends on `[signIn, ...]`, that identity change re-triggers the effect, which retries `signIn.create()` with the same (now single-use, already-consumed) ticket — repeatedly, until Clerk rate-limits the client with `429`. Guard this with a `useRef` "has this run" flag so the exchange happens exactly once per mount, independent of how many times the effect's dependencies change afterward.
- **Sign-in tokens are single-use and short-lived** (`expires_in_seconds` in the mint request — 300s is generally plenty). If a test run gets stuck in a retry loop like the one above, the token is burned; start a fresh attempt rather than reusing an old browser tab.

---

## Quick-reference: what changes between Clerk dev and prod keys

| | Development (`pk_test_...`) | Production (`pk_live_...`) |
| --- | --- | --- |
| Session/client identity | Passed via URL query param (`__clerk_db_jwt`) | First-party `HttpOnly` cookie on your Clerk domain |
| Cross-window/cross-process continuity | Works automatically (identity travels in the URL) | Requires the whole flow to stay in one cookie context |
| Origin restrictions | None — works from any origin | Locked to your configured production domain; non-browser origins need explicit `allowed_origins` |
| Mobile native redirect | No allowlist needed | Custom URL scheme must be added to Native applications → Allowlist for mobile SSO redirect |
| Desktop sign-in | Simple system-browser redirect works | Requires the web-hosted bridge + sign-in token flow described above |
