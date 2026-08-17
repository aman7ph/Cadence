// How many columns each list page renders its items in — a per-account
// preference, so the choice follows the user between devices.
//
// The stored number is a MAXIMUM, not a fixed count. A fixed count would be
// actively harmful on a phone: five columns of task rows at 375px is
// unreadable. Clients render one column on narrow screens, two on medium, and
// the stored value only where there is room for it. See listColumnsClass in
// the web app for the mapping.
//
// One value per PAGE, not per tab: Routines covers Active and Archived,
// Staging covers both of its tabs, Goals covers all three, and Today's value
// governs both its routines list and its tasks list.

export type ListPage = "today" | "routines" | "staging" | "goals";

export interface ListColumns {
  today: number;
  routines: number;
  staging: number;
  goals: number;
}

/** Iterated by both the settings form and the validator, so they cannot drift. */
export const LIST_PAGES: readonly ListPage[] = [
  "today",
  "routines",
  "staging",
  "goals",
];

export const MIN_LIST_COLUMNS = 1;

// Five is a guard rail, not a technical limit. At the ~1100px content column
// five columns leave each row roughly 210px, which is where longer titles
// start truncating badly. Chosen over a tighter cap deliberately: the point is
// to bound the failure, not to withhold the control.
export const MAX_LIST_COLUMNS = 5;

/** Reproduces the layout the pages shipped with, so absence changes nothing. */
export const DEFAULT_LIST_COLUMNS: ListColumns = {
  today: 1,
  routines: 2,
  staging: 2,
  goals: 1,
};

export function isValidColumnCount(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isInteger(n) &&
    n >= MIN_LIST_COLUMNS &&
    n <= MAX_LIST_COLUMNS
  );
}

/**
 * Message describing why `value` is unusable, or null when it is fine.
 * Used by the form; `validateListColumns` is the throwing form for the server.
 */
export function listColumnsValidationError(value: unknown): string | null {
  if (typeof value !== "object" || value === null) {
    return "Column settings must be an object.";
  }
  const v = value as Record<string, unknown>;
  for (const page of LIST_PAGES) {
    if (!isValidColumnCount(v[page])) {
      return `Columns for ${page} must be a whole number from ${MIN_LIST_COLUMNS} to ${MAX_LIST_COLUMNS}.`;
    }
  }
  return null;
}

export function validateListColumns(value: unknown): asserts value is ListColumns {
  const error = listColumnsValidationError(value);
  if (error) throw new Error(error);
}

/**
 * Fills in any page a stored value omits. Absence is normal — the field is
 * optional and older rows predate it — so callers get a complete object rather
 * than having to guard every read.
 */
export function withColumnDefaults(stored: Partial<ListColumns> | undefined): ListColumns {
  const out = { ...DEFAULT_LIST_COLUMNS };
  if (!stored) return out;
  for (const page of LIST_PAGES) {
    const n = stored[page];
    if (isValidColumnCount(n)) out[page] = n;
  }
  return out;
}
