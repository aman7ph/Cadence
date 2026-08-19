export interface GoalProgress {
  /** 0–100, clamped and rounded. */
  pct: number;
  /** The target has been met or passed. */
  reached: boolean;
}

/**
 * A goal's progress, derived once so the four places that draw it cannot
 * disagree.
 *
 * `reached` is deliberately computed from the RAW values, not from
 * `pct === 100`. Rounding gets there early: 999.6/1000 rounds to 100% while the
 * target is not actually met, and a tick shown then is a lie. The clamp works
 * the other way too — overshooting still reads 100%, and still counts as
 * reached.
 *
 * A zero or negative target has no meaningful percentage. It returns 0/false
 * rather than NaN or Infinity, both of which render as literal garbage.
 */
export function goalProgress(
  currentValue: number | undefined,
  targetValue: number | undefined,
): GoalProgress {
  const current = currentValue ?? 0;
  if (!targetValue || targetValue <= 0) return { pct: 0, reached: false };
  return {
    pct: Math.min(100, Math.round((current / targetValue) * 100)),
    reached: current >= targetValue,
  };
}
