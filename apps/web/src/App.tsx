import { useEffect, useRef, useState } from "react";
import { AuthenticateWithRedirectCallback, SignedOut } from "@clerk/clerk-react";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { todayLocal } from "@cadence/shared";

import { SignInCard } from "@/components/sign-in-card";
import {
  DesktopSignIn,
  DesktopSignInCallback,
  DesktopSignInComplete,
} from "@/components/desktop-sign-in";
import { Sidebar } from "@/components/sidebar";
import { TodayView } from "@/components/today-view";
import { RoutinesPage } from "@/components/routines-page";
import { InsightsPage } from "@/components/insights-page";
import { HistoryPage } from "@/components/history-page";
import { SettingsPage } from "@/components/settings-page";
import { GoalsPage } from "@/components/goals-page";
import { StagingPage } from "@/components/staging-page";
import { Logo } from "@/components/ui/logo";
import { DevPrimitives } from "@/components/dev-primitives";
import { AppLoader } from "@/components/app-loader";
import { DevShell } from "@/components/dev-shell";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export type AppView = "today" | "routines" | "staging" | "history" | "insights" | "settings" | "goals";

function EnsureProvisioned() {
  const me = useQuery(api.users.getMe);
  const ensureProvisioned = useMutation(api.users.ensureProvisioned);
  useEffect(() => {
    if (me === null) {
      void ensureProvisioned({});
    }
  }, [me, ensureProvisioned]);
  return null;
}

function RolloverOnForeground() {
  const me = useQuery(api.users.getMe);
  const rolloverOpenTasks = useMutation(api.taskDays.rolloverOpenTasks);
  const promoteDueStagedTasks = useMutation(api.stagedTaskScheduling.promoteDue);
  const lastRolloverDate = useRef<string | null>(null);

  useEffect(() => {
    if (!me) return;

    const rollIfNeeded = () => {
      const today = todayLocal();
      if (lastRolloverDate.current === today) return;
      lastRolloverDate.current = today;
      // Promote before rollover: promoted tasks land with currentDate = today,
      // so they are never subject to same-day carryover.
      void promoteDueStagedTasks({ today });
      void rolloverOpenTasks({ today });
    };

    rollIfNeeded();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") rollIfNeeded();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [me, rolloverOpenTasks, promoteDueStagedTasks]);

  return null;
}

function SignedOutLayout() {
  return (
    <div className="min-h-screen w-full grid place-items-center px-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex items-center justify-center gap-2.5">
          <Logo size={28} />
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            Cadence
          </span>
        </div>
        <SignInCard />
        <p className="text-center text-xs text-muted-foreground font-mono">
          cadence · convex + clerk + vite + shadcn
        </p>
      </div>
    </div>
  );
}

function SignedInLayout() {
  const [view, setView] = useState<AppView>("today");
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar view={view} onNavigate={setView} />
      <main className="flex-1 min-w-0 overflow-y-auto px-5 py-6 md:px-8 md:py-9">
        <div className="w-full">
          {/* Shell-level controls: the burger (mobile only) and the theme
              toggle, which the prototype puts in the page header rather than
              the sidebar. Rendered once here, not repeated by seven pages. */}
          <div className="mb-4 flex items-center justify-between gap-3 md:mb-0 md:h-0 md:justify-end">
            <MobileNav
              view={view}
              onNavigate={setView}
              open={navOpen}
              onOpenChange={setNavOpen}
            />
            {/* Desktop shows it in the sidebar brand row; this is the
                mobile placement, beside the burger. */}
            <span className="md:hidden">
              <ThemeToggle />
            </span>
          </div>
          <EnsureProvisioned />
          <RolloverOnForeground />
          {view === "today" && <TodayView />}
          {view === "routines" && <RoutinesPage />}
          {view === "staging" && <StagingPage />}
          {view === "history" && <HistoryPage />}
          {view === "insights" && <InsightsPage />}
          {view === "settings" && <SettingsPage />}
          {view === "goals" && <GoalsPage />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  // Dev-only style guide. The real pages sit behind auth, so this is how a
  // change to a shared primitive gets seen. Stripped from production builds:
  // import.meta.env.DEV is statically false there, so the import is shaken out.
  if (import.meta.env.DEV && window.location.pathname === "/preview") {
    // ?loader renders the full-screen opening state, which is otherwise only
    // visible during the brief AuthLoading window.
    const q = window.location.search;
    if (q.includes("loader")) return <AppLoader />;
    if (q.includes("shell")) return <DevShell />;
    return <DevPrimitives />;
  }
  if (window.location.pathname === "/sso-callback") {
    return <AuthenticateWithRedirectCallback />;
  }
  if (window.location.pathname === "/desktop-sign-in") {
    return <DesktopSignIn />;
  }
  if (window.location.pathname === "/desktop-sign-in-callback") {
    return <DesktopSignInCallback />;
  }
  if (window.location.pathname === "/desktop-sign-in-complete") {
    return <DesktopSignInComplete />;
  }

  return (
    <>
      <AuthLoading>
        <AppLoader />
      </AuthLoading>

      <Unauthenticated>
        <SignedOut>
          <SignedOutLayout />
        </SignedOut>
      </Unauthenticated>

      <Authenticated>
        <SignedInLayout />
      </Authenticated>
    </>
  );
}
