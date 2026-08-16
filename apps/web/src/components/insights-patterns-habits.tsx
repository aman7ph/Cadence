import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { addDays, todayLocal } from "@cadence/shared";
import { ChartCard, Empty, Loading } from "./insights-chart-card";

const LOOKBACK_DAYS = 90;

/**
 * Check-in timing — when check-ins on spread-out tasks actually happen.
 *
 * The query returns raw epoch timestamps precisely so the hour can be read in
 * the VIEWER's timezone. Bucketing on the server would shift the whole
 * histogram by the UTC offset — see analyticsRepeats.checkinTimestamps.
 */
export function CheckinTimingPanel() {
  const today = todayLocal();
  const stamps = useQuery(api.analyticsRepeats.checkinTimestamps, {
    from: addDays(today, -LOOKBACK_DAYS),
    to: today,
  });

  const buckets = Array<number>(24).fill(0);
  for (const ts of stamps ?? []) {
    const h = new Date(ts).getHours();
    buckets[h] = (buckets[h] ?? 0) + 1;
  }
  const max = Math.max(...buckets, 1);

  return (
    <ChartCard
      title="Check-in timing"
      subtitle="When you actually check in on spread-out tasks"
    >
      {stamps === undefined ? (
        <Loading />
      ) : stamps.length === 0 ? (
        <Empty>No check-ins yet. Spread a task across the day to see this.</Empty>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex h-[56px] items-end gap-[2px]">
            {buckets.map((n, hour) => (
              <span
                key={hour}
                className="flex-1 rounded-t-[2px] bg-[var(--action-primary)]"
                style={{ height: `${Math.max(2, (n / max) * 100)}%`, opacity: n ? 1 : 0.18 }}
                title={`${hour}:00 — ${n} check-in${n === 1 ? "" : "s"}`}
              />
            ))}
          </div>
          <div className="flex justify-between font-mono text-[10px] text-[var(--text-tertiary)]">
            <span>12am</span>
            <span>6am</span>
            <span>12pm</span>
            <span>6pm</span>
            <span>12am</span>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

/** Reflection cadence — days written, and how much. */
export function ReflectionCadencePanel() {
  const today = todayLocal();
  const rows = useQuery(api.reflections.getRange, {
    from: addDays(today, -LOOKBACK_DAYS),
    to: today,
  });

  const byDate = new Map((rows ?? []).map((r) => [r.date, r.text]));

  // Consecutive days ending today (or yesterday, so an unwritten today does
  // not read as a broken streak before the day is over).
  let streak = 0;
  for (let i = 0; i < LOOKBACK_DAYS; i++) {
    const d = addDays(today, -i);
    if (byDate.has(d)) streak += 1;
    else if (i > 0) break;
  }

  const words = (rows ?? []).map(
    (r) => (r.text.trim() ? r.text.trim().split(/\s+/).length : 0),
  );
  const avgWords = words.length
    ? Math.round(words.reduce((a, b) => a + b, 0) / words.length)
    : 0;
  const maxWords = Math.max(...words, 1);

  return (
    <ChartCard title="Reflection cadence" subtitle="Days written, and how much">
      {rows === undefined ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty>No reflections in the last {LOOKBACK_DAYS} days.</Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline gap-4">
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-[22px] font-semibold leading-none text-[var(--text-accent)]">
                {streak}
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)]">day streak</span>
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-[22px] font-semibold leading-none text-foreground">
                {avgWords}
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)]">avg words/entry</span>
            </span>
          </div>
          <div className="flex h-[44px] items-end gap-[3px]">
            {words.slice(-28).map((w, i) => (
              <span
                key={i}
                className="flex-1 rounded-t-[2px] bg-[var(--action-primary)]"
                style={{ height: `${Math.max(4, (w / maxWords) * 100)}%`, opacity: 0.85 }}
                title={`${w} words`}
              />
            ))}
          </div>
        </div>
      )}
    </ChartCard>
  );
}
