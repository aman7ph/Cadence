# Cadence

A personal productivity app for tracking daily routines, one-off tasks, and long-term goals — with a reflection journal, activity heatmap, and performance insights.

Designed to be self-hosted: clone the repo, connect your own Convex and Clerk accounts, and run it as your own.

---

## Tech Stack

| Layer    | Technology                                       |
| -------- | ------------------------------------------------ |
| Frontend | React 19 + Vite + TypeScript                     |
| UI       | shadcn/ui + Tailwind CSS v3                      |
| Backend  | Convex (serverless database + real-time queries) |
| Auth     | Clerk                                            |
| Monorepo | pnpm workspaces + Turborepo                      |

---

## Prerequisites

- **Node.js** 20 or higher
- **pnpm** 10 or higher (`npm install -g pnpm`)
- A **Convex** account — [convex.dev](https://convex.dev) (free tier available)
- A **Clerk** account — [clerk.com](https://clerk.com) (free tier available)

---

## Local Development

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd cadence
pnpm install
```

### 2. Create a Clerk application

1. Sign in to [clerk.com](https://clerk.com) and create a new application.
2. In the Clerk dashboard, go to **User & Authentication** → **Social Connections** and enable **Google**. Then go to **Email, Phone, Username** and disable email/password and email code — this app's UI only offers "Continue with Google" on every platform (web, mobile, tray).
3. Go to **JWT Templates** → **New template** → select **Convex**.
4. Name the template exactly **`convex`** and save. Note the **Issuer URL** shown on that page — it looks like `https://your-app.clerk.accounts.dev`.
5. From **API Keys**, copy your **Publishable key** (`pk_test_...` or `pk_live_...`).

### 3. Create a Convex project

1. Sign in to [convex.dev](https://convex.dev) and create a new project.
2. From the repo root, run:

```bash
pnpm convex:dev
```

The Convex CLI will prompt you to log in and link the repo to your project. It then generates `packages/backend/.env.local` automatically and starts watching for changes. Leave this running, or press `Ctrl+C` and continue — the `.env.local` file has been created.

3. The deployment URL is printed in the terminal output and also available in **Convex dashboard → Settings → URL & Deploy Key**. You will need it in the next step.

4. Set your Clerk issuer URL as an environment variable in Convex. Either run:

```bash
pnpm --filter @cadence/backend exec convex env set CLERK_JWT_ISSUER_DOMAIN <your-clerk-issuer-url>
```

or go to **Convex dashboard → Settings → Environment Variables** and add `CLERK_JWT_ISSUER_DOMAIN` manually.

### 4. Configure the web app

Copy the example env file:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Open `apps/web/.env.local` and fill in both values:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_CONVEX_URL=https://....convex.cloud
```

`VITE_CONVEX_URL` is the same URL printed by `pnpm convex:dev` (or in `packages/backend/.env.local` as `CONVEX_URL`).

### 5. Run

```bash
pnpm dev
```

This starts the Convex backend and the Vite dev server simultaneously via Turborepo. Open [http://localhost:5173](http://localhost:5173).

---

## Environment Variables

### `apps/web/.env.local`

| Variable                     | Description           | Where to get it                               |
| ---------------------------- | --------------------- | --------------------------------------------- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Clerk dashboard → API Keys                    |
| `VITE_CONVEX_URL`            | Convex deployment URL | `pnpm convex:dev` output, or Convex dashboard |

### Convex deployment environment

Set via `convex env set` or the Convex dashboard → Settings → Environment Variables:

| Variable                  | Description          | Where to get it                                   |
| ------------------------- | -------------------- | ------------------------------------------------- |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer URL | Clerk dashboard → JWT Templates → convex → Issuer |

> `packages/backend/.env.local` is generated automatically by `pnpm convex:dev`. Do not create it manually.

---

## Deployment

### 1. Deploy the Convex backend (production)

```bash
pnpm --filter @cadence/backend deploy
```

This pushes the schema and all backend functions to a Convex production deployment.

### 2. Deploy the web app

Build the frontend:

```bash
pnpm build
```

Then deploy `apps/web/dist` to any static host.

**Vercel** :

1. Import the repository on [vercel.com](https://vercel.com).
2. Set **Root Directory** to `apps/web` in the project settings.
3. Add environment variables: `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_CONVEX_URL` (use the **production** Convex URL from your Convex dashboard).
4. Vercel will run `pnpm build` and redeploy automatically on every push to `main`.

**Netlify**:

1. Import the repository on [netlify.com](https://netlify.com).
2. Build command: `pnpm --filter @cadence/web build`
3. Publish directory: `apps/web/dist`
4. Add the same two environment variables in Site settings → Environment variables.

---

## Project Structure

```
cadence/
├── apps/
│   └── web/                   # Vite + React frontend
│       ├── src/
│       │   ├── components/    # All UI components
│       │   ├── lib/           # Theme, chart helpers, utilities
│       │   └── App.tsx        # Root component and view routing
│       └── .env.example       # Required environment variable template
├── packages/
│   ├── backend/               # Convex backend
│   │   └── convex/
│   │       ├── schema.ts      # Full database schema
│   │       ├── lib/           # Auth, streak, schedule, dayStats helpers
│   │       └── *.ts           # Query and mutation functions per domain
│   └── shared/                # Utilities shared between frontend and backend
│       └── src/
│           └── *.ts           # Date helpers, scoring formulas, schedule logic
├── docs/                      # Architecture decisions and implementation notes
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Available Scripts

From the repo root:

| Command                                 | Description                         |
| --------------------------------------- | ----------------------------------- |
| `pnpm dev`                              | Start everything (Convex + Vite)    |
| `pnpm build`                            | Build the frontend for production   |
| `pnpm typecheck`                        | Type-check all packages             |
| `pnpm convex:dev`                       | Start Convex backend only           |
| `pnpm web:dev`                          | Start Vite frontend only            |
| `pnpm --filter @cadence/backend deploy` | Deploy backend to Convex production |

---

## License

MIT — see [LICENSE](LICENSE).
