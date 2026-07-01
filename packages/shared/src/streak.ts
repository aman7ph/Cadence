import { addDays } from "./date";

export type StreakInputs = {
  completedDates: ReadonlySet<string>;
  skippedDates: ReadonlySet<string>;
  createdDate: string;
  isScheduledOn: (date: string) => boolean;
  today: string;
  lookbackDays?: number;
};

const DEFAULT_LOOKBACK_DAYS = 365;

// Walks back from `today` over scheduled days, counting consecutive completions.
// Skip is neutral (does not break or extend). A scheduled day with neither a
// completion nor a skip breaks the streak — unless we have not yet found any
// completion at all, in which case the absence of a record on today itself is
// tolerated (today might just be incomplete-so-far).
export function computeCurrentStreak(inputs: StreakInputs): number {
  const lookback = inputs.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  let cursor = inputs.today;
  let current = 0;
  let foundAnyCompletion = false;
  for (let i = 0; i < lookback; i++) {
    if (cursor < inputs.createdDate) break;
    if (inputs.isScheduledOn(cursor)) {
      if (inputs.completedDates.has(cursor)) {
        current += 1;
        foundAnyCompletion = true;
      } else if (inputs.skippedDates.has(cursor)) {
        // skip is neutral — pass through
      } else if (foundAnyCompletion) {
        break;
      } else if (cursor < inputs.today) {
        break;
      }
    }
    cursor = addDays(cursor, -1);
  }
  return current;
}
