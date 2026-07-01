import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "@cadence/backend/convex/_generated/api";
import { addDays, productivityScore, todayLocal } from "@cadence/shared";
import { useState } from "react";
import { AnalyticsRail } from "./analytics-rail";
import { DayNavigator } from "./day-navigator";
import { TodayStatCards } from "./today-stat-cards";
import { TodayRoutinesSection } from "./today-routines-section";
import { TodayTasksSection } from "./today-tasks-section";
import { TodayReflectionSection } from "./today-reflection-section";
import { Badge } from "@/components/ui/badge";
import type { AppView } from "@/App";

const THIRTY_DAY_WINDOW = 30;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function prettyDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export function TodayView({ onNavigate }: { onNavigate?: (view: AppView) => void }) {
  const today = todayLocal();
  const [viewedDate, setViewedDate] = useState(today);
  const isPast = viewedDate < today;
  const day = useQuery(api.days.getDay, { date: viewedDate });
  const dayStatsRows = useQuery(api.analyticsProductivity.dayStatsRange, {
    from: addDays(today, -(THIRTY_DAY_WINDOW - 1)),
    to: today,
  });
  const me = useQuery(api.users.getMe);
  const { user } = useUser();

  const thirtyDayRate =
    dayStatsRows && dayStatsRows.length > 0
      ? Math.round(dayStatsRows.reduce((sum, d) => sum + d.productivityScore, 0) / dayStatsRows.length)
      : null;

  const firstName = user?.firstName ?? user?.username ?? "friend";

  if (day === undefined) {
    return <div className="text-[13px] text-[var(--text-secondary)]">Loading your day…</div>;
  }
  if (day === null) return null;

  const routinesDone = day.routines.filter((r) => r.status === "completed").length;
  const routinesScheduled = day.routines.length;
  const dismissedTasks = day.randomTasks.filter((t) => t.status === "dismissed");
  const tasksDismissed = dismissedTasks.length;
  const visibleTasks = day.randomTasks.filter((t) => t.status !== "dismissed");
  const tasksDone = visibleTasks.filter((t) => t.status === "completed").length;
  const tasksOpen = visibleTasks.filter((t) => t.status === "open").length;

  const totalScheduled = routinesScheduled + tasksDone + tasksOpen;
  const totalDone = routinesDone + tasksDone;
  const dayPct = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : null;

  const productivity = productivityScore(
    {
      routineCompleted: routinesDone,
      routineScheduled: routinesScheduled,
      randomCompleted: tasksDone,
      randomTotal: tasksDone + tasksOpen + tasksDismissed,
    },
    me?.routineWeight,
  );

  const bestStreak = day.routines.reduce((max, r) => Math.max(max, r.longestStreak), 0);
  const bestStreakName = day.routines.find((r) => r.longestStreak === bestStreak)?.name ?? "—";

  return (
    <div className="flex flex-col gap-7">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          {isPast ? (
            <Badge tone="neutral" className="mb-1.5">Viewing past day</Badge>
          ) : (
            <p className="text-[13px] font-semibold text-[var(--text-secondary)]">{prettyDate(viewedDate)}</p>
          )}
          <h1 className="font-display text-[32px] font-bold leading-[1.1] tracking-tight text-foreground mt-1">
            {isPast ? prettyDate(viewedDate) : `${greeting()}, ${firstName}.`}
          </h1>
        </div>
        <DayNavigator viewedDate={viewedDate} today={today} onChange={setViewedDate} />
      </header>

      <TodayStatCards
        dayPct={dayPct}
        totalDone={totalDone}
        totalScheduled={totalScheduled}
        bestStreak={bestStreak}
        bestStreakName={bestStreakName}
        productivity={productivity}
        isPast={isPast}
        thirtyDayRate={thirtyDayRate}
        dayStatsLength={dayStatsRows?.length}
        routineWeight={me?.routineWeight}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-7">
          <TodayRoutinesSection
            routines={day.routines}
            routinesDone={routinesDone}
            routinesScheduled={routinesScheduled}
            viewedDate={viewedDate}
            isPast={isPast}
            onNavigate={onNavigate}
          />
          <TodayTasksSection
            visibleTasks={visibleTasks}
            dismissedTasks={dismissedTasks}
            tasksDone={tasksDone}
            tasksOpen={tasksOpen}
            tasksDismissed={tasksDismissed}
            viewedDate={viewedDate}
            isPast={isPast}
          />
        </div>
        <AnalyticsRail />
      </div>

      <TodayReflectionSection
        key={viewedDate}
        date={viewedDate}
        reflection={day.reflection}
        routines={day.routines}
        tasks={day.randomTasks}
        isPast={isPast}
      />
    </div>
  );
}
