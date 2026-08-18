// The two optional settings every item shares — goal contribution and
// spread-across-the-day — as one shape, one set of defaults, one conversion to
// mutation arguments.
//
// Web consolidated its two rival implementations into this (D18). Mobile then
// grew a third: `GoalChipsField` + `RepeatSection`, which held the contribution
// and both repeat values as **strings** and parsed them at the call site. That
// is the same class of bug D18 removed, so the shape lives here now and both
// apps read it.
//
// Pure data only — the controls stay per-platform, because a horizontal chip
// scroller and a vertical card list are legitimately different on a phone.

export interface ItemOptions {
  goalId: string;
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
    goalId: doc.goalId ?? "",
    goalContribution: doc.goalContribution ?? 1,
    spread: doc.repeatTarget !== undefined,
    repeatTarget: doc.repeatTarget ?? 2,
    repeatIntervalMinutes: doc.repeatIntervalMinutes ?? 60,
  };
}

/**
 * Mutation arguments for the options. An unset setting becomes `undefined`
 * rather than 0 or "" — the backend reads those as "not configured", and an
 * ordinary task must not arrive carrying `repeatTarget: 2`.
 */
export function itemOptionsToArgs(o: ItemOptions): {
  goalId?: string;
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
