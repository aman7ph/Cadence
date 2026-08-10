// The colour band a day's productivity score maps to on a heatmap.
//
// Shared because the drift this prevents was cross-platform: web carried two
// different band functions — one in the 365-day activity map, one in the
// History calendar — and mobile carried a third, all sitting under the same
// five-swatch "Less → More" legend. Measured across all 101 integer scores, the
// web pair disagreed on 30 of them (25-39, 50-59, 75-79), so the same day
// rendered a different shade depending on which surface you looked at.
//
// The bands below are the activity heatmap's, not the calendar's. The
// distinction that decides it is the lowest active band: a day where *something*
// got done, however little, must not read as an empty day, and only a cut at
// MIN_ACTIVE_SCORE says that. The calendar's "under 25 is band 1" cannot — it
// lumps a 20% day in with a 5% day and starts the scale too high to leave any
// room for "barely anything".

export type HeatBand = 0 | 1 | 2 | 3 | 4;

// The band for a day with no record at all. Distinct from "scored zero" in
// meaning, though they share a swatch: nothing was ever on the plate.
export const NO_ACTIVITY_BAND: HeatBand = 0;

// Any score at or above this counts as a day with activity on it, however
// little got done. Below it, the day is indistinguishable from empty.
export const MIN_ACTIVE_SCORE = 1;

// The palest band that still means "something was here". The day-of-week
// heatmaps floor at this for any weekday that had routines scheduled, so a 0%
// weekday stays visibly distinct from a weekday with nothing scheduled at all.
export const MIN_ACTIVE_BAND: HeatBand = 1;

// Inclusive lower bound of each band above NO_ACTIVITY_BAND, ascending — index
// i holds the minimum score for band i + 1. One ordered table rather than a
// chain of literals, so the boundaries are stated once and the lookup below
// cannot drift from them. Steps 10 and 11 import this instead of restating
// numbers at their call sites.
export const HEAT_BAND_MIN_SCORES = [MIN_ACTIVE_SCORE, 40, 60, 80] as const;

// `null` / `undefined` mean "no record for this day" — nothing was ever on the
// plate, which is not a failure and must not paint as a 0% day. Callers hand
// the result of a `Map.get` straight in, which is why `undefined` is accepted
// alongside `null` rather than forcing a `?? null` at every call site.
//
// A non-finite score is treated as no record too: a NaN would otherwise fall
// through every comparison and land on NO_ACTIVITY_BAND by accident rather than
// by decision.
export function scoreToHeatBand(score: number | null | undefined): HeatBand {
  if (score === null || score === undefined || !Number.isFinite(score)) {
    return NO_ACTIVITY_BAND;
  }
  for (let band = HEAT_BAND_MIN_SCORES.length; band >= 1; band--) {
    if (score >= HEAT_BAND_MIN_SCORES[band - 1]!) return band as HeatBand;
  }
  return NO_ACTIVITY_BAND;
}
