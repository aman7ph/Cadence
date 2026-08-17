import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "@cadence/backend/convex/_generated/api";
import { addDays, bestStreakOf, productivityScore, todayLocal } from "@cadence/shared";
import { useState } from "react";
import { DayNavigator } from "./day-navigator";
import { TodayStatCards } from "./today-stat-cards";
import { TodayRoutinesSection } from "./today-routines-section";
import { TodayTasksSection } from "./today-tasks-section";
import { TodayAddTask } from "./today-add-task";
import { TodayReflectionSection } from "./today-reflection-section";
import { Badge } from "@/components/ui/badge";

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

export function TodayView() {
  const today = todayLocal();
  const [viewedDate, setViewedDate] = useState(today);
  const isPast = viewedDate < today;
  const day = useQuery(api.days.getDay, { date: viewedDate });
  const dayStatsRows = useQuery(api.analyticsProductivity.dayStatsRange, {
    from: addDays(today, -(THIRTY_DAY_WINDOW - 1)),
    to: today,
  });
  const allRoutines = useQuery(api.routines.list, { today });
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

  // One set of denominators for the whole page: a skipped routine is excused
  // and leaves the fraction, while every task on the plate counts. These are
  // exactly the counts the backend scores with (lib/dayStatsDerive.foldDayStats),
  // so the tile, the heatmap and the History calendar cannot disagree.
  const countedRoutines = day.routines.filter((r) => r.status !== "skipped");
  const routinesScheduled = countedRoutines.length;
  const routinesDone = countedRoutines.filter((r) => r.status === "completed").length;
  const tasksDone = day.randomTasks.filter((t) => t.status === "completed").length;
  const tasksOpen = day.randomTasks.filter((t) => t.status === "open").length;
  const randomTotal = day.randomTasks.length;

  const totalScheduled = routinesScheduled + randomTotal;
  const totalDone = routinesDone + tasksDone;
  const dayPct = totalScheduled > 0 ? Math.round((totalDone / totalScheduled) * 100) : null;

  const productivity = productivityScore(
    {
      routineCompleted: routinesDone,
      routineScheduled: routinesScheduled,
      randomCompleted: tasksDone,
      randomTotal,
    },
    me?.routineWeight,
  );

  const best = bestStreakOf(allRoutines);

  return (
    <div className="flex flex-col gap-[22px]">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          {isPast ? (
            <Badge tone="neutral" className="mb-1.5">Viewing past day</Badge>
          ) : (
            <p className="text-[12px] text-[var(--text-secondary)]">{prettyDate(viewedDate)}</p>
          )}
          <h1 className="font-display text-[23px] font-semibold leading-[1.2] tracking-tight text-foreground mt-0.5">
            {isPast ? prettyDate(viewedDate) : `${greeting()}, ${firstName}.`}
          </h1>
        </div>
        <DayNavigator viewedDate={viewedDate} today={today} onChange={setViewedDate} />
      </header>

      <TodayStatCards
        dayPct={dayPct}
        totalDone={totalDone}
        totalScheduled={totalScheduled}
        bestStreak={best.days}
        bestStreakName={best.name}
        productivity={productivity}
        isPast={isPast}
        thirtyDayRate={thirtyDayRate}
        dayStatsLength={dayStatsRows?.length}
        routineWeight={me?.routineWeight}
      />

      {/* Single column. The right rail is gone: its trend chart, activity
          heatmap and routine-consistency card move to Insights, and Recent
          Reflections is dropped outright — History is where reflections are
          read. See D12 of the redesign plan. */}
      <TodayRoutinesSection
        routines={day.routines}
        routinesDone={routinesDone}
        routinesScheduled={routinesScheduled}
        viewedDate={viewedDate}
        isPast={isPast}
      />
      {!isPast && <TodayAddTask viewedDate={viewedDate} />}
      <TodayTasksSection
        tasks={day.randomTasks}
        tasksDone={tasksDone}
        tasksOpen={tasksOpen}
        viewedDate={viewedDate}
        isPast={isPast}
      />

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
