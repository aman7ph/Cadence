import { useState } from "react";
import { todayLocal } from "@cadence/shared";
import type { DateRange } from "@cadence/shared";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getGranularity } from "@/lib/chartUtils";
import { ContributionHeatmap } from "./contribution-heatmap";
import { ChartCard } from "./insights-chart-card";
import { MomentumHero } from "./insights-momentum-hero";
import { RandomTasksByDayChart } from "./insights-task-charts";
import { TaskResolutionCard } from "./insights-task-resolution";
import { GoalMixPanel, GoalProgressPanel } from "./insights-patterns-goals";
import { CheckinTimingPanel, ReflectionCadencePanel } from "./insights-patterns-habits";
import {
  RoutineLeaderboardPanel,
  StreakLongevityPanel,
  WeekRhythmPanel,
} from "./insights-patterns-routines";
import { PageHeader } from "./page-header";
import { SectionLabel } from "./section-label";

export function InsightsPage() {
  const today = todayLocal();
  const [range, setRange] = useState<DateRange>(() => {
    const d = new Date(
      Date.UTC(
        Number(today.slice(0, 4)),
        Number(today.slice(5, 7)) - 1,
        Number(today.slice(8, 10)) - 29,
      ),
    );
    const yy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return { from: `${yy}-${mm}-${dd}`, to: today };
  });
  const [rangeLabel, setRangeLabel] = useState("Last 30 days");

  const granularity = getGranularity(range.from, range.to);

  return (
    <div className="flex flex-col gap-[22px]">
      <PageHeader
        title="Insights"
        subtitle="Patterns and trends across your routines and tasks."
        action={
          <DateRangePicker
            value={range}
            label={rangeLabel}
            today={today}
            onChange={(r, label) => {
              setRange(r);
              setRangeLabel(label);
            }}
          />
        }
      />

      {/* ── Range-driven. Everything here follows the picker above. ── */}
      <MomentumHero range={range} granularity={granularity} />

      <TaskResolutionCard range={range}>
        <RandomTasksByDayChart range={range} granularity={granularity} />
      </TaskResolutionCard>

      <ChartCard title="Activity heatmap" label="365 days">
        <div className="overflow-x-auto">
          <ContributionHeatmap />
        </div>
      </ChartCard>

      {/*
        ── Range-INDEPENDENT. The prototype states this boundary in its own
        section heading, and wiring the picker to these panels would be the
        easy mistake: they answer "what is my rhythm", not "what happened in
        this window". Each panel owns its own fixed lookback.
      */}
      <SectionLabel className="pt-2">
        Recurring patterns — not tied to the date range above
      </SectionLabel>

      <GoalProgressPanel />
      <StreakLongevityPanel />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CheckinTimingPanel />
        <ReflectionCadencePanel />
      </div>

      <GoalMixPanel />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WeekRhythmPanel />
        <RoutineLeaderboardPanel />
      </div>
    </div>
  );
}
