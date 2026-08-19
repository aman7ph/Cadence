import { v } from "convex/values";
import { query } from "./_generated/server";
import { resolveUser } from "./lib/resolveUser";
import { activeGoals, goalCredits } from "./lib/goalCredits";

export interface MixSegment {
  label: string;
  amount: number;
  pct: number;
}

/**
 * Goal contribution mix — "which habits are actually driving each goal".
 *
 * Segments are shares of the credit a goal has actually received, so they sum
 * to 100% per goal. Credit events come from lib/goalCredits, which is the one
 * place that knows a repeat task credits once rather than once per rep.
 */
export const contributionMix = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<
    Array<{ goalId: string; title: string; segments: MixSegment[] }>
  > => {
    const user = await resolveUser(ctx);
    if (!user) return [];

    const goals = await activeGoals(ctx, user._id);
    const out = [];

    for (const goal of goals) {
      const credits = await goalCredits(ctx, goal._id);
      if (credits.length === 0) continue;

      const byLabel = new Map<string, number>();
      for (const c of credits) {
        byLabel.set(c.label, (byLabel.get(c.label) ?? 0) + c.amount);
      }
      const total = [...byLabel.values()].reduce((a, b) => a + b, 0);
      if (total <= 0) continue;

      const segments = [...byLabel.entries()]
        .map(([label, amount]) => ({
          label,
          amount,
          pct: Math.round((amount / total) * 100),
        }))
        .sort((a, b) => b.amount - a.amount);

      out.push({ goalId: goal._id, title: goal.title, segments });
    }

    return out;
  },
});

/**
 * Goal progress over time — the line chart with a dashed target.
 *
 * `goals.currentValue` is a scalar with no history, so the series is rebuilt
 * from the credit events. Credits BEFORE `from` are folded into a starting
 * baseline rather than dropped, otherwise a goal that was already half done
 * would appear to restart at zero at the left edge of the range.
 */
export const progressSeries = query({
  args: { from: v.string(), to: v.string() },
  handler: async (
    ctx,
    { from, to },
  ): Promise<
    Array<{
      goalId: string;
      title: string;
      unit?: string;
      targetValue?: number;
      points: Array<{ date: string; value: number }>;
    }>
  > => {
    const user = await resolveUser(ctx);
    if (!user) return [];

    const goals = await activeGoals(ctx, user._id);
    const out = [];

    for (const goal of goals) {
      const credits = await goalCredits(ctx, goal._id);

      let running = 0;
      for (const c of credits) {
        if (c.date < from) running += c.amount;
      }

      const inRange = credits.filter((c) => c.date >= from && c.date <= to);
      const byDate = new Map<string, number>();
      for (const c of inRange) {
        byDate.set(c.date, (byDate.get(c.date) ?? 0) + c.amount);
      }

      const points = [...byDate.keys()].sort().map((date) => {
        running += byDate.get(date) ?? 0;
        return { date, value: running };
      });

      out.push({
        goalId: goal._id,
        title: goal.title,
        unit: goal.unit,
        targetValue: goal.targetValue,
        points,
      });
    }

    return out;
  },
});
