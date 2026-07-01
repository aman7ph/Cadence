import { useState } from "react";
import { todayLocal } from "@cadence/shared";
import type { DateRange } from "@cadence/shared";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getGranularity } from "@/lib/chartUtils";
import { ChartCard, granularityLabel } from "./insights-chart-card";
import { MomentumChart } from "./insights-momentum-chart";
import { DowHeatmap, RoutineComparisonChart } from "./insights-routine-charts";
import { RoutineCompletionLines } from "./insights-timeline-chart";
import { RandomTasksByDayChart, RandomBreakdownChart } from "./insights-task-charts";
import { AvgCarryoverCard, NeverDoneTrendChart } from "./insights-carryover-charts";

export function InsightsPage() {
  const today = todayLocal();
  const [range, setRange] = useState<DateRange>(() => {
    const d = new Date(Date.UTC(
      Number(today.slice(0, 4)),
      Number(today.slice(5, 7)) - 1,
      Number(today.slice(8, 10)) - 29,
    ));
    const yy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return { from: `${yy}-${mm}-${dd}`, to: today };
  });
  const [rangeLabel, setRangeLabel] = useState("Last 30 days");

  const granularity = getGranularity(range.from, range.to);

  const handleRangeChange = (r: DateRange, label: string) => {
    setRange(r);
    setRangeLabel(label);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[22px] font-bold tracking-tight text-foreground">Insights</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Patterns and trends across your routines and tasks</p>
        </div>
        <DateRangePicker
          value={range}
          label={rangeLabel}
          today={today}
          onChange={handleRangeChange}
        />
      </div>

      <ChartCard title="Productivity momentum" label={granularity === "daily" ? "7-day EMA" : granularityLabel(granularity)}>
        <MomentumChart range={range} granularity={granularity} />
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Day-of-week consistency">
          <DowHeatmap range={range} />
        </ChartCard>
        <ChartCard title="Routine comparison" label="completion %">
          <RoutineComparisonChart range={range} />
        </ChartCard>
      </div>

      <ChartCard title="Routine completion rate" label={granularityLabel(granularity)}>
        <RoutineCompletionLines range={range} granularity={granularity} today={today} />
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Tasks added per day" label={granularityLabel(granularity)}>
          <RandomTasksByDayChart range={range} granularity={granularity} />
        </ChartCard>
        <ChartCard title="Task resolution breakdown">
          <RandomBreakdownChart range={range} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="Carryover distribution" label="completed tasks">
          <AvgCarryoverCard range={range} />
        </ChartCard>
        <ChartCard title="Tasks still open, by creation date" label={granularityLabel(granularity)}>
          <NeverDoneTrendChart range={range} granularity={granularity} />
        </ChartCard>
      </div>
    </div>
  );
}
