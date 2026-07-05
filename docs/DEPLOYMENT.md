# Deployment

Each app deploys independently, but there's a dependency order worth respecting: **Convex and the web app should be deployed before you distribute a production desktop (tray) build**, since the tray app's production sign-in flow depends on the web app's `desktop-sign-in` bridge pages actually being live (see [`docs/AUTHENTICATION.md`](AUTHENTICATION.md)).

---

## 1. Convex (backend)

### Manual deploy

```bash
pnpm --filter @cadence/backend deploy
```

Pushes the schema, functions, and HTTP actions (`convex/http.ts`) to your Convex production deployment.

### Environment variables (production deployment)

Set these against the **production** deployment specifically (`--prod` flag, or the Convex dashboard with "Production" selected):

```bash
cd packages/backend
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-production-issuer --prod
npx convex env set CLERK_SECRET_KEY sk_live_... --prod
```

`CLERK_SECRET_KEY` is only needed once you're supporting desktop (tray) sign-in in production — see [`docs/AUTHENTICATION.md`](AUTHENTICATION.md) for why. Never set it as a client-exposed env var anywhere; it's read server-side only, inside `convex/http.ts`.

### Auto-deploy via the web app's build (recommended)

Convex's Vercel integration lets a single web app deployment also deploy your Convex backend, so you don't have to remember to run the manual command. In the Vercel project settings for `apps/web`:

1. Add a `CONVEX_DEPLOY_KEY` environment variable (Convex dashboard → Settings → Deploy Keys → generate a **production** deploy key).
2. Override the project's **Build Command** to run Convex's deploy step before the normal build, e.g.:
   ```
   npx convex deploy --cmd 'pnpm build'
   ```
   Convex deploys the backend first, then runs your normal `pnpm build` for the frontend, so the same push updates both.

---

## 2. Web

`apps/web` is a static Vite build — deployable to Vercel, Netlify, or any static host.

### Vercel

1. Import the repository at [vercel.com](https://vercel.com).
2. In **Project Settings → General**, set **Root Directory** to `apps/web` (this is a monorepo — Vercel needs to know where the app actually lives).
3. Add environment variables (Production environment): `VITE_CLERK_PUBLISHABLE_KEY` (your `pk_live_...` key), `VITE_CONVEX_URL` (your production Convex URL), and `CONVEX_DEPLOY_KEY` if using the auto-deploy build command above.
4. Vercel redeploys automatically on every push to `main`.

**Custom domain**: add it under Project Settings → Domains, then create the CNAME record it gives you at your DNS provider. If you also want a custom domain for Clerk's Frontend API (recommended for production — see `docs/AUTHENTICATION.md` for why production Clerk locks to your domain), Clerk's dashboard (**Developers → Domains**) will give you a set of CNAME records to add for the Frontend API, Account Portal, and email-sending subdomains; all must verify before Clerk issues SSL certificates for them.

### Vercel CLI notes (if you ever need to trigger a deploy manually)

- If the project's **Root Directory** is set to `apps/web` in the dashboard, run `vercel` commands from the **repository root**, not from inside `apps/web` — running from within the subdirectory double-applies the root directory setting and fails with a "path does not exist" error.
- Use `vercel redeploy <deployment-url>` to rebuild an existing deployment with updated environment variables, without re-uploading source. Use a normal `vercel --prod` (or a git push) only when there's actual new source code to build — `vercel --prod` uploads your local working directory as-is, which is slow and easy to accidentally point at an unintended local state for a large monorepo.

### Netlify

1. Import the repository at [netlify.com](https://netlify.com).
2. Build command: `pnpm --filter @cadence/web build`
3. Publish directory: `apps/web/dist`
4. Add the same environment variables under Site settings → Environment variables.

---

## 3. Mobile

Builds go through [EAS Build](https://docs.expo.dev/build/introduction/). One-time setup:

```bash
cd apps/mobile
pnpm exec eas login
pnpm exec eas init --force --non-interactive   # links/creates an EAS project
```

### Environment variables per build profile

`eas.json` defines `development`, `preview`, and `production` profiles. Set env vars per profile (not via `.env.local`, which only applies to local dev):

```bash
eas env:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value pk_live_... --environment production --visibility plaintext --non-interactive
eas env:create --scope project --name EXPO_PUBLIC_CONVEX_URL --value https://your-prod-deployment.convex.cloud --environment production --visibility plaintext --non-interactive
```

Repeat for the `preview` environment if you distribute internal test builds — production Clerk keys work fine in preview builds too, since a native app doesn't have the "wrong origin" problem a website preview URL would (see `docs/AUTHENTICATION.md`).

Verify what landed:

```bash
eas env:list --environment production
```

### Building

```bash
eas build --platform android --profile production --non-interactive   # Play Store .aab
eas build --platform android --profile preview --non-interactive      # sideloadable .apk
```

### Before shipping to production: the Clerk native redirect allowlist

Production Google sign-in on mobile **will fail** until you add your app's custom URL scheme under Clerk dashboard → **Developers → Native applications → Allowlist for mobile SSO redirect** (see `docs/AUTHENTICATION.md`). This is easy to miss because it works perfectly with development keys.

### Submitting

```bash
eas submit --platform android
```

### Android package size

The default EAS Android build bundles native code for all four CPU architectures and stores it uncompressed, which balloons APK size for graphics-heavy apps. `apps/mobile/app.config.ts`'s `expo-build-properties` plugin config addresses this (`buildArchs`, `useLegacyPackaging`, minification, resource shrinking). See [`MOBILE_BUILD_COMMANDS.md`](../MOBILE_BUILD_COMMANDS.md) for the full investigation and before/after numbers.

---

## 4. Tray (Windows desktop)

### Prerequisites

- Rust stable toolchain
- [Tauri prerequisites for Windows](https://v2.tauri.app/start/prerequisites/) (WebView2 runtime, MSVC build tools)
- NSIS is bundled with the Tauri CLI's build step — no separate install needed

### Environment configuration

Production values live in `apps/tray/.env.production.local` (gitignored) — Vite applies this on top of `.env.local` specifically for production builds:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_CONVEX_URL=https://your-prod-deployment.convex.cloud
VITE_WEB_APP_URL=https://your-deployed-web-app.com
```

`VITE_WEB_APP_URL` must point at an **already-deployed** web app with the `desktop-sign-in` bridge pages live — the tray app's production sign-in flow depends on it (see `docs/AUTHENTICATION.md`).

### Also required before production sign-in works: Clerk allowed origins

```powershell
curl -X PATCH https://api.clerk.com/v1/instance -H "Authorization: Bearer sk_live_..." -H "Content-type: application/json" -d '{"allowed_origins": ["http://tauri.localhost"]}'
```

This is a Backend API–only setting (not in the dashboard UI) — see `docs/AUTHENTICATION.md` for the full explanation of why it's needed.

### Building

```bash
pnpm --filter @cadence/tray build
```

Produces:

- Raw executable: `apps/tray/src-tauri/target/release/cadence-tray.exe`
- NSIS installer: `apps/tray/src-tauri/target/release/bundle/nsis/CadenceTray_<version>_x64-setup.exe`

`tauri.conf.json`'s `bundle.targets` is scoped to `["nsis"]` (Windows-only, single installer format) — this project doesn't currently target macOS or Linux.

### Distribution notes

- **The installer is unsigned.** Windows SmartScreen will show a warning on first run ("Windows protected your PC") — the user needs to click "More info" → "Run anyway." Code-signing requires either a paid certificate (~$100–500/yr) or a subscription service like Azure Trusted Signing; not currently set up.
- **Autostart** is handled by `tauri-plugin-autostart`, enabled automatically on first launch (see `apps/tray/src-tauri/src/setup.rs`) and toggleable afterward from the tray's right-click menu. If you rebuild the app to a **different file path** than a previous install, the old registry autostart entry will still point at the old (now-missing) path — uninstall the old version first, or manually clear `%APPDATA%\<your-app-identifier>\.autostart_initialized` so the app re-registers itself against the new path on next launch.
- The app is Windows-only; `tauri.conf.json`'s window config (`transparent`, `decorations: false`, custom tray icon rendering in `tray.rs`) is not tested on other platforms.
