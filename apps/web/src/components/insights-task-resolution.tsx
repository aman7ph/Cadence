import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { DateRange } from "@cadence/shared";
import { ChartCard, Empty, Loading } from "./insights-chart-card";

function Stat({
  value,
  suffix,
  label,
  accent,
}: {
  value: string;
  suffix?: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-baseline gap-1.5">
        <span
          className={`font-display text-[22px] font-semibold leading-none ${
            accent ? "text-[var(--text-accent)]" : "text-foreground"
          }`}
        >
          {value}
        </span>
        {suffix && (
          <span className="text-[11px] text-[var(--text-tertiary)]">
            {suffix}
          </span>
        )}
      </span>
      <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
    </div>
  );
}

/**
 * "How your tasks get resolved" — one card carrying the four headline numbers
 * plus the tasks-added strip.
 *
 * The prototype merges what were three separate charts here (task resolution
 * breakdown, carryover distribution, tasks added per day). The strip is passed
 * in as children so this card owns the numbers and not the chart library.
 */
export function TaskResolutionCard({
  range,
  children,
}: {
  range: DateRange;
  children?: ReactNode;
}) {
  const stats = useQuery(api.analyticsTasks.randomStats, {
    from: range.from,
    to: range.to,
  });
  const carry = useQuery(api.analyticsTasks.avgCarryover, {
    from: range.from,
    to: range.to,
  });

  const pct = (n: number) =>
    stats && stats.total > 0 ? `${Math.round((n / stats.total) * 100)}%` : "—";

  return (
    <ChartCard title="How your tasks get resolved">
      {stats === undefined || carry === undefined ? (
        <Loading />
      ) : stats.total === 0 ? (
        <Empty>No tasks resolved in this window.</Empty>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-5 border-b border-[var(--border-subtle)] pb-5 sm:grid-cols-4">
            <Stat value={String(stats.total)} label="Tasks resolved" />
            <Stat
              value={String(stats.onTime)}
              suffix={`(${pct(stats.onTime)})`}
              label="Completed on time"
              accent
            />
            <Stat
              value={String(stats.afterCarryover)}
              suffix={`(${pct(stats.afterCarryover)})`}
              label="Completed after carryover"
            />
            <Stat
              value={carry.avg.toFixed(1)}
              label="Avg. carryovers before done"
            />
          </div>
          {children && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] text-[var(--text-tertiary)]">
                Tasks added
              </span>
              {children}
            </div>
          )}
        </div>
      )}
    </ChartCard>
  );
}
