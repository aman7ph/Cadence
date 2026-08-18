import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { ComposerGoalPanel } from "./composer-goal-panel";
import { ComposerSpreadPanel } from "./composer-spread-panel";

/**
 * The two optional settings every item shares — goal contribution and
 * spread-across-the-day — as ONE block used by task, routine and staged-task
 * forms alike (D18).
 *
 * Before this, two implementations existed: this pair (Today) and the older
 * `GoalLinkField` + `RepeatSection` (Routines, Staging), which differed in
 * control type, in bounds handling and in holding values as strings rather than
 * numbers. Anything that touches these settings goes through here now.
 */
// The shape, its defaults and its conversion now live in @cadence/shared so
// mobile cannot drift from it — mobile had grown a third implementation that
// held these numbers as strings. Re-exported so existing import sites keep
// working.
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import {
  EMPTY_ITEM_OPTIONS,
  type ItemOptions,
  itemOptionsFrom,
  itemOptionsToArgs as toArgs,
} from "@cadence/shared";

export { EMPTY_ITEM_OPTIONS, itemOptionsFrom, type ItemOptions };

/**
 * Shared holds `goalId` as a plain string: packages/shared is imported BY the
 * backend, so it cannot import Convex's branded `Id` type without a cycle. The
 * brand is re-applied here, at the one edge that talks to mutations.
 */
export function itemOptionsToArgs(o: ItemOptions) {
  const args = toArgs(o);
  return { ...args, goalId: args.goalId as Id<"goals"> | undefined };
}

interface ItemOptionsFieldsProps {
  value: ItemOptions;
  onChange: (next: ItemOptions) => void;
  /** Routines repeat "each day"; a task repeats "today". Wording only. */
  className?: string;
}

export function ItemOptionsFields({ value, onChange, className }: ItemOptionsFieldsProps) {
  const goals = useQuery(api.goals.list, {}) ?? [];
  const set = (patch: Partial<ItemOptions>) => onChange({ ...value, ...patch });

  return (
    <div className={className}>
      {/* Stacked, not side-by-side: this renders inside a 513px drawer, and a
          viewport-based `md:` breakpoint cannot know that. */}
      <div className="flex flex-col gap-5">
        <ComposerGoalPanel
          goals={goals}
          goalId={value.goalId}
          contribution={value.goalContribution}
          onSelect={(goalId) => set({ goalId })}
          onContributionChange={(goalContribution) => set({ goalContribution })}
        />
        <ComposerSpreadPanel
          enabled={value.spread}
          onEnabledChange={(spread) => set({ spread })}
          target={value.repeatTarget}
          onTargetChange={(repeatTarget) => set({ repeatTarget })}
          intervalMinutes={value.repeatIntervalMinutes}
          onIntervalChange={(repeatIntervalMinutes) => set({ repeatIntervalMinutes })}
        />
      </div>
    </div>
  );
}
