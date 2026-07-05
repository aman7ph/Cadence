# Cadence

A personal productivity system for tracking daily routines, one-off tasks, and long-term goals — with a reflection journal, activity heatmap, and performance insights. Cadence isn't just a web app: it's one product delivered as **three native surfaces** (web, mobile, and a Windows desktop tray companion) that all read and write the same data in real time.

Designed to be self-hosted: clone the repo, connect your own Convex and Clerk accounts, and run the whole system as your own.

---

## Table of contents

- [How the system fits together](#how-the-system-fits-together)
- [The apps](#the-apps)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Local development setup](#local-development-setup)
- [Environment variables reference](#environment-variables-reference)
- [Authentication across platforms](#authentication-across-platforms)
- [Development vs. production](#development-vs-production)
- [Deployment](#deployment)
- [Available scripts](#available-scripts)
- [Further reading](#further-reading)
- [License](#license)

---

## How the system fits together

Cadence is a pnpm/Turborepo monorepo with a single shared backend and three independent frontends:

```
                        ┌─────────────────────────┐
                        │   Convex (backend)      │
                        │   packages/backend       │
                        │   schema + queries +     │
                        │   mutations + HTTP       │
                        │   actions, real-time     │
                        └────────────┬─────────────┘
                                     │  (queries/mutations, real-time sync)
                ┌────────────────────┼────────────────────┐
                │                    │                     │
        ┌───────▼───────┐   ┌────────▼────────┐   ┌────────▼────────┐
        │   apps/web    │   │   apps/mobile   │   │   apps/tray     │
        │  Vite + React │   │  Expo / React   │   │  Tauri (Rust +  │
        │  (browser)    │   │  Native (iOS/   │   │  React) Windows │
        │               │   │  Android)       │   │  system tray    │
        └───────┬───────┘   └────────┬────────┘   └────────┬────────┘
                │                    │                     │
                └──────────┬─────────┴──────────┬──────────┘
                           │                     │
                    ┌──────▼──────┐              │
                    │    Clerk    │◄─────────────┘
                    │    (auth)   │
                    └─────────────┘
```

Every app talks to the **same Convex deployment** (per environment — see [Development vs. production](#development-vs-production)) and authenticates through the **same Clerk instance**. The data model, business logic, and real-time sync all live in `packages/backend`; the three apps are thin, platform-specific clients on top of it.

The one wrinkle: **each platform authenticates differently**, because a browser tab, a native mobile app, and a desktop app opening a system browser window all have fundamentally different relationships with cookies and redirect URLs. That's significant enough to warrant its own section — see [Authentication across platforms](#authentication-across-platforms) and the full deep dive in [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md).

---

## The apps

| App | Path | Platform | Purpose |
| --- | --- | --- | --- |
| **Web** | `apps/web` | Browser | The primary, full-featured surface — routines, tasks, goals, history calendar, insights charts, settings. Everything else (mobile, tray) is a companion to this. |
| **Mobile** | `apps/mobile` | iOS / Android (Expo) | A pocket-sized version for checking off tasks and routines on the go. |
| **Tray** | `apps/tray` | Windows (Tauri) | An always-available desktop overlay that lives in the system tray — click the icon to pop open a small panel for quick task/routine capture without switching windows. Also doubles as the web app's "bridge" host for desktop authentication (see below). |
| **Backend** | `packages/backend` | Convex | Shared schema, queries, mutations, and HTTP actions. The single source of truth every frontend reads from and writes to. |
| **Shared** | `packages/shared` | — | Framework-agnostic utilities (date math, streak/scoring logic, schedule calculations) used by both the frontend apps and the Convex backend. |

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Web frontend | React 19 + Vite + TypeScript, shadcn/ui + Tailwind CSS |
| Mobile frontend | Expo (React Native), expo-router |
| Desktop frontend | Tauri 2 (Rust) + React + Vite |
| Backend | Convex (serverless database, real-time queries, HTTP actions) |
| Auth | Clerk (`@clerk/clerk-react`, `@clerk/clerk-expo`) |
| Monorepo tooling | pnpm workspaces + Turborepo |

---

## Repository structure

```
cadence/
├── apps/
│   ├── web/                       # Vite + React frontend (primary app)
│   │   ├── src/
│   │   │   ├── components/        # UI components, incl. desktop-sign-in.tsx
│   │   │   │                      #   (auth bridge pages used by the tray app)
│   │   │   ├── lib/                # Theme, chart helpers, utilities
│   │   │   └── App.tsx             # Root component, view + auth-bridge routing
│   │   └── .env.example
│   ├── mobile/                    # Expo / React Native app
│   │   ├── app/                   # expo-router screens (incl. sign-in.tsx)
│   │   ├── app.config.ts          # Expo config — custom URL scheme, EAS project id
│   │   ├── eas.json               # EAS Build profiles (development/preview/production)
│   │   └── .env.example
│   └── tray/                      # Tauri desktop app (Windows)
│       ├── src/                    # React overlay UI
│       │   └── components/
│       │       ├── SignInScreen.tsx   # Opens the web app's auth bridge
│       │       └── SsoCallback.tsx    # Exchanges the returned ticket for a session
│       ├── src-tauri/               # Rust backend for the desktop app
│       │   └── src/
│       │       ├── commands.rs      # Tauri commands, incl. the OAuth loopback server
│       │       ├── setup.rs         # Tray icon, autostart, window setup
│       │       └── tray.rs          # Tray icon rendering + overlay show/hide
│       └── .env.example
├── packages/
│   ├── backend/                   # Convex backend
│   │   └── convex/
│   │       ├── schema.ts          # Full database schema
│   │       ├── auth.config.ts     # Trusts Clerk as the JWT issuer
│   │       ├── http.ts            # HTTP actions (incl. desktop sign-in token minting)
│   │       └── *.ts               # Query/mutation functions per domain
│   └── shared/                    # Utilities shared across every app + backend
│       └── src/*.ts               # Date helpers, scoring formulas, schedule logic
├── docs/
│   ├── AUTHENTICATION.md          # Deep dive: how auth differs per platform & environment
│   └── DEPLOYMENT.md              # Full production deployment steps per app
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Prerequisites

- **Node.js** 20 or higher
- **pnpm** 10 or higher (`npm install -g pnpm`)
- A **Convex** account — [convex.dev](https://convex.dev) (free tier available)
- A **Clerk** account — [clerk.com](https://clerk.com) (free tier available)

Only needed if you're working on a specific app:

- **Mobile**: [Expo Application Services (EAS)](https://expo.dev) account, Android Studio and/or Xcode for local native builds
- **Tray**: Windows machine, [Rust toolchain](https://www.rust-lang.org/tools/install) (stable), [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) (WebView2 runtime — preinstalled on modern Windows, and the MSVC build tools)

---

## Local development setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd cadence
pnpm install
```

### 2. Create a Clerk application

1. Sign in to [clerk.com](https://clerk.com) and create a new application.
2. Under **User & authentication → Social connections**, enable **Google**. Under **Email, phone, username**, disable password and email-code sign-in — every Cadence surface only offers "Continue with Google."
3. Go to **Sessions → JWT Templates → New template → Convex**. Name it exactly **`convex`** and save. Note the **Issuer URL** shown there (looks like `https://your-app.clerk.accounts.dev`) — Convex needs this to trust Clerk-issued tokens.
4. From **Developers → API keys**, copy your **Publishable key** (`pk_test_...` in development).

This gets you a working **development** instance. Production requires a few additional steps per platform — see [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md) before you deploy anything live.

### 3. Create a Convex project and connect it

```bash
pnpm convex:dev
```

The CLI prompts you to log in and link (or create) a Convex project, then generates `packages/backend/.env.local` automatically and starts watching for changes. Leave it running, or `Ctrl+C` once it's connected — the env file has already been written.

Then set the Clerk issuer URL from step 2 as a Convex environment variable:

```bash
pnpm --filter @cadence/backend exec convex env set CLERK_JWT_ISSUER_DOMAIN <your-clerk-issuer-url>
```

### 4. Configure the app(s) you want to run

Each app reads its own `.env.local` — copy the matching `.env.example` and fill in the values (see the [environment variables reference](#environment-variables-reference) below for exactly what each key means and where to find it).

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
cp apps/tray/.env.example apps/tray/.env.local
```

### 5. Run

```bash
pnpm dev            # Convex + web, via Turborepo
pnpm mobile:dev      # Expo, in a separate terminal
pnpm tray:dev         # Tauri, in a separate terminal
```

Open the web app at [http://localhost:5173](http://localhost:5173). Mobile runs through Expo's dev tooling (scan the QR code or launch an emulator). The tray app's icon appears in the Windows system tray — click it to open the overlay.

---

## Environment variables reference

### `apps/web/.env.local`

| Variable | Description | Where to get it |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Clerk dashboard → API keys |
| `VITE_CONVEX_URL` | Convex deployment URL | `pnpm convex:dev` output, or Convex dashboard |

### `apps/mobile/.env.local` (and EAS env vars for cloud builds)

| Variable | Description | Where to get it |
| --- | --- | --- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Clerk dashboard → API keys |
| `EXPO_PUBLIC_CONVEX_URL` | Convex deployment URL | Convex dashboard |

For EAS cloud builds, these are set per build profile (`development`/`preview`/`production`) with `eas env:create`/`eas env:update`, not read from `.env.local`. See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

### `apps/tray/.env.local` and `.env.production.local`

| Variable | Description | Where to get it |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Clerk dashboard → API keys |
| `VITE_CONVEX_URL` | Convex deployment URL | Convex dashboard |
| `VITE_WEB_APP_URL` | The URL of the deployed **web app** (e.g. `http://localhost:5173` in dev, `https://your-domain.com` in production) | Wherever you deploy `apps/web` |

`VITE_WEB_APP_URL` exists specifically because of how desktop sign-in works — see [Authentication across platforms](#authentication-across-platforms) below. Vite loads `.env.local` in every mode and `.env.production.local` on top of it for production builds only, so you can point dev and production builds at different web app URLs without extra config.

### Convex deployment environment

Set via `npx convex env set <KEY> <VALUE> [--prod]` or the Convex dashboard → Settings → Environment Variables:

| Variable | Description | Required for | Where to get it |
| --- | --- | --- | --- |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer URL | Dev + prod | Clerk dashboard → JWT Templates → convex → Issuer |
| `CLERK_SECRET_KEY` | Clerk secret key | **Production only** | Clerk dashboard → API keys (production environment). Used server-side by `convex/http.ts` to mint one-time sign-in tokens for the desktop app's auth handoff — never exposed to any client. |

> `packages/backend/.env.local` is generated automatically by `pnpm convex:dev`. Do not create it manually.

---

## Authentication across platforms

All three apps use the same Clerk instance and the same "Continue with Google" flow, but **how each one completes that flow is different**, and the difference only shows up once you switch from Clerk's development keys to production keys:

- **Web** uses Clerk's standard browser redirect flow (`signIn.authenticateWithRedirect`) — this just works, because a browser tab redirecting to Clerk and back is exactly what Clerk's SDK is designed for.
- **Mobile** uses Clerk's native SSO flow (`useSSO` from `@clerk/clerk-expo`), which opens an OS-level auth session. In production, this requires explicitly allowlisting the app's custom URL scheme in the Clerk dashboard — it is **not** required in development.
- **Desktop (tray)** cannot safely do either of those: opening a system browser window from a desktop app breaks Clerk's production session-cookie handling, and embedding the flow in the app's own webview throws away the user's already-logged-in Google session. The tray app instead sends the user to a small "bridge" flow hosted on the **web app** itself, which hands back a one-time Clerk sign-in token over a local loopback server.

This is genuinely one of the more subtle parts of the system, and getting it wrong produces confusing, environment-specific failures (things that work perfectly in development and fail only in production). The full explanation — including *why* each failure mode happens and the exact Clerk dashboard configuration each platform needs — is in **[`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md)**. Read it before touching sign-in code on any platform.

---

## Development vs. production

| | Development | Production |
| --- | --- | --- |
| **Clerk keys** | `pk_test_...` — unrestricted origin, works from any localhost port or app shell | `pk_live_...` — locked to your production domain (and explicitly allowlisted origins/redirect URLs for non-browser apps) |
| **Clerk session handling** | URL-based session syncing (session state travels in the URL as a query param) — works across any browser/window because nothing depends on cookies | First-party `HttpOnly` cookies scoped to your Clerk domain — requires the whole OAuth flow to happen in one consistent browser/cookie context |
| **Convex deployment** | A `dev:` deployment, created automatically by `pnpm convex:dev`, one per developer | A single shared production deployment, updated via `convex deploy` (see [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)) |
| **Mobile native redirect** | No allowlist needed | App's custom URL scheme must be added under Clerk → Developers → Native applications → Allowlist for mobile SSO redirect |
| **Desktop (tray) sign-in** | Works with the simple redirect-based flow, because dev's URL-based session syncing tolerates the system browser | Requires the web app's `desktop-sign-in` bridge pages + a Convex HTTP action minting one-time sign-in tokens (`CLERK_SECRET_KEY` must be set on the **production** Convex deployment) |
| **Web app origin** | Any localhost port | Must match your Clerk instance's configured production domain |

See [`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md) for the mechanics behind every row in this table.

---

## Deployment

Each app deploys independently. Short version below; full step-by-step instructions (including custom domain setup, EAS build profiles, and building/signing the Windows installer) live in **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**.

1. **Convex (backend)** — `pnpm --filter @cadence/backend deploy`, or let it auto-deploy as part of the web app's Vercel build (recommended — see deployment doc).
2. **Web** — deploy `apps/web` to Vercel, Netlify, or any static host that can run `pnpm build`. Needs `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL` set to their **production** values.
3. **Mobile** — build via EAS (`eas build --platform android/ios --profile production`), submit to the Play Store / App Store via `eas submit`.
4. **Tray** — build via `pnpm --filter @cadence/tray build` (`tauri build`), producing an NSIS installer under `apps/tray/src-tauri/target/release/bundle/nsis/`. Requires the web app to already be deployed (its `desktop-sign-in` bridge pages are load-bearing for tray auth in production).

---

## Available scripts

From the repo root:

| Command | Description |
| --- | --- |
| `pnpm dev` | Start Convex + web via Turborepo |
| `pnpm build` | Build all apps for production |
| `pnpm typecheck` | Type-check every package |
| `pnpm lint` | Lint every package |
| `pnpm convex:dev` | Start the Convex backend only |
| `pnpm web:dev` | Start the web app only |
| `pnpm mobile:dev` | Start the Expo dev server (Android) |
| `pnpm tray:dev` | Start the Tauri app in dev mode |
| `pnpm --filter @cadence/backend deploy` | Deploy the backend to Convex production |
| `pnpm --filter @cadence/tray build` | Build the Windows tray app installer |

---

## Further reading

- **[`docs/AUTHENTICATION.md`](docs/AUTHENTICATION.md)** — why each platform authenticates differently, what breaks in production and why, and the exact Clerk configuration each one needs.
- **[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)** — full production deployment walkthrough for every app, including custom domains, EAS build profiles, and packaging the desktop app.
- **[`MOBILE_BUILD_COMMANDS.md`](MOBILE_BUILD_COMMANDS.md)** — a command-by-command log of the mobile EAS build setup, crash debugging, and Android package size optimization (117MB → ~18MB).

---

## License

MIT — see [LICENSE](LICENSE).
