import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { addDays, todayLocal } from "@cadence/shared";

import { ContributionHeatmap } from "./contribution-heatmap";
import { ProductivitySparkline } from "./productivity-sparkline";

const CONSISTENCY_WINDOW_DAYS = 30;

function consistencyColor(score: number): string {
  if (score >= 80) return "var(--status-complete)";
  if (score >= 50) return "var(--status-streak)";
  if (score >= 25) return "var(--amber-500)";
  return "var(--status-pending)";
}

function SectionCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[16px] border border-[var(--border-subtle)] bg-card p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
        {badge && (
          <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function stripMentions(text: string): string {
  return text.replace(/@\[([^\]]+)\]\([^)]+\)/g, "@$1");
}

function formatReflectionDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function AnalyticsRail() {
  const today = todayLocal();
  const rows = useQuery(api.analyticsRoutines.routineConsistency, {
    from: addDays(today, -(CONSISTENCY_WINDOW_DAYS - 1)),
    to: today,
  });
  const recentReflections = useQuery(api.reflections.getRecent, { limit: 3 });

  return (
    <div className="flex flex-col gap-4">
      <SectionCard title="Activity" badge="365 days">
        <div className="overflow-x-auto">
          <ContributionHeatmap />
        </div>
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-[var(--text-tertiary)]">
          Less
          {(["--heat-0", "--heat-1", "--heat-2", "--heat-3", "--heat-4"] as const).map((h) => (
            <span key={h} className="h-3 w-3 rounded-[3px]" style={{ background: `var(${h})` }} />
          ))}
          More
        </div>
      </SectionCard>

      <ProductivitySparkline />

      <SectionCard title="Routine consistency" badge={`${CONSISTENCY_WINDOW_DAYS}d`}>
        {rows === undefined ? (
          <p className="text-[13px] text-[var(--text-tertiary)]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-[13px] text-[var(--text-tertiary)]">
            Add a routine to start tracking consistency.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {rows.map((r) => (
              <div key={r.routineId} className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[12px] font-semibold text-foreground">
                    {r.name}
                  </span>
                  <span
                    className="font-mono text-[11px] font-bold shrink-0"
                    style={{ color: consistencyColor(r.consistency) }}
                  >
                    {r.consistency}
                  </span>
                </div>
                <div className="h-[4px] w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${r.consistency}%`, background: consistencyColor(r.consistency) }}
                  />
                </div>
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono truncate">
                  {r.completed}/{r.scheduled}
                  {r.currentStreak > 0 && ` · ${r.currentStreak}d 🔥`}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {recentReflections !== undefined && recentReflections.length > 0 && (
        <section className="flex flex-col gap-4 rounded-[16px] border border-[var(--border-subtle)] bg-card p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Recent Reflections</h3>
            <button
              type="button"
              className="text-[12px] font-semibold text-[var(--text-accent)] hover:underline transition-colors"
            >
              See all
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {recentReflections.map((r) => (
              <div key={r.date} className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
                  {formatReflectionDate(r.date)}
                </span>
                <p className="line-clamp-2 text-[13px] leading-snug text-[var(--text-secondary)]">
                  {stripMentions(r.text)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
