import { useQuery } from "convex/react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
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
export interface ItemOptions {
  goalId: Id<"goals"> | "";
  goalContribution: number;
  spread: boolean;
  repeatTarget: number;
  repeatIntervalMinutes: number;
}

export const EMPTY_ITEM_OPTIONS: ItemOptions = {
  goalId: "",
  goalContribution: 1,
  spread: false,
  repeatTarget: 2,
  repeatIntervalMinutes: 60,
};

/** Seed the block from an existing task/routine, for edit forms. */
export function itemOptionsFrom(doc: {
  goalId?: string;
  goalContribution?: number;
  repeatTarget?: number;
  repeatIntervalMinutes?: number;
}): ItemOptions {
  return {
    goalId: (doc.goalId as Id<"goals">) ?? "",
    goalContribution: doc.goalContribution ?? 1,
    spread: doc.repeatTarget !== undefined,
    repeatTarget: doc.repeatTarget ?? 2,
    repeatIntervalMinutes: doc.repeatIntervalMinutes ?? 60,
  };
}

/**
 * Mutation arguments for the options. Unset settings become `undefined` rather
 * than 0 or "", which is what the backend treats as "not configured" — an
 * ordinary task must not arrive carrying repeatTarget: 2.
 */
export function itemOptionsToArgs(o: ItemOptions): {
  goalId?: Id<"goals">;
  goalContribution?: number;
  repeatTarget?: number;
  repeatIntervalMinutes?: number;
} {
  return {
    goalId: o.goalId || undefined,
    goalContribution: o.goalId ? o.goalContribution : undefined,
    repeatTarget: o.spread ? o.repeatTarget : undefined,
    repeatIntervalMinutes: o.spread ? o.repeatIntervalMinutes : undefined,
  };
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
