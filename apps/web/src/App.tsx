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
import { Sidebar } from "@/components/sidebar";
import { TodayView } from "@/components/today-view";
import { RoutinesPage } from "@/components/routines-page";
import { InsightsPage } from "@/components/insights-page";
import { HistoryPage } from "@/components/history-page";
import { SettingsPage } from "@/components/settings-page";
import { GoalsPage } from "@/components/goals-page";
import { Logo } from "@/components/ui/logo";

export type AppView = "today" | "routines" | "history" | "insights" | "settings" | "goals";

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
  const rolloverOpenTasks = useMutation(api.dailyTasks.rolloverOpenTasks);
  const lastRolloverDate = useRef<string | null>(null);

  useEffect(() => {
    if (!me) return;

    const rollIfNeeded = () => {
      const today = todayLocal();
      if (lastRolloverDate.current === today) return;
      lastRolloverDate.current = today;
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
  }, [me, rolloverOpenTasks]);

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
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar view={view} onNavigate={setView} />
      <main className="flex-1 min-w-0 overflow-y-auto px-6 py-8 md:px-8 md:py-9">
        <div className="w-full">
          <EnsureProvisioned />
          <RolloverOnForeground />
          {view === "today" && <TodayView onNavigate={setView} />}
          {view === "routines" && <RoutinesPage />}
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
  if (window.location.pathname === "/sso-callback") {
    return <AuthenticateWithRedirectCallback />;
  }

  return (
    <>
      <AuthLoading>
        <div className="min-h-screen w-full grid place-items-center">
          <p className="text-sm text-muted-foreground">Loading session…</p>
        </div>
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
