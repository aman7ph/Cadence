// Cadence — the gyroscope mark: geometry and timing.
//
// The counterpart to apps/web/src/styles/mark.css. Every number here is lifted
// from that file so the two apps cannot drift; if one changes, change both.
//
// Three rings, always correcting: a nod to the Apollo gyroscope holding
// trajectory through thousands of tiny adjustments. Off course 90% of the time,
// on course by the end. The `correct` wobble is NOT decoration — it is the
// idea. A version that spins the rings but never corrects ships the picture
// without the meaning.

/** Ring border as a fraction of the mark's edge — 6px on a 155px mark. */
export const RING_BORDER_RATIO = 0.039;

/** Centre dot as a fraction of the mark's edge — 15px on a 155px mark. */
export const DOT_RATIO = 0.097;

/**
 * Below this the three foreshortened rings overlap into a blob. Web swaps to a
 * flattened SVG glyph; here the same effect comes from opening the tilt angles
 * (see TILT_FLAT), which needs no SVG dependency at all.
 */
export const MIN_3D_SIZE = 40;

/** Display tilt — matches mark.css `rotateX(68deg)` / `rotateY(68deg)`. */
export const TILT = 68;

/**
 * Small-size tilt. Web's FlatMark opens its ellipses up (rx/ry 14/5.2 rather
 * than the ~0.37 ratio a 68° tilt gives) so the glyph still reads at 26px.
 * 58° is the equivalent opening here.
 */
export const TILT_FLAT = 58;

/** Non-resonant on purpose: the rings must never resynchronise into a pose. */
export const SPIN_MS = { a: 4500, b: 3600, c: 5400 } as const;

/** Ring B counter-rotates. */
export const SPIN_DIR = { a: 1, b: -1, c: 1 } as const;

export const DOT_PULSE_MS = 2400;
export const DOT_PULSE_SCALE = 1.25;
export const DOT_PULSE_OPACITY = 0.75;

/**
 * The philosophy, literally: it never settles still. `cad-correct`, 7s, as a
 * sequence of (degrees, ms) legs — the CSS keyframe stops converted to
 * durations, since Reanimated sequences timings rather than percentages.
 */
export const CORRECT_MS = 7000;
export const CORRECT_LEGS: { to: number; ms: number }[] = [
  { to: -3.5, ms: 0.18 * CORRECT_MS },
  { to: 2.0, ms: 0.18 * CORRECT_MS },
  { to: -1.2, ms: 0.18 * CORRECT_MS },
  { to: 1.8, ms: 0.18 * CORRECT_MS },
  { to: -0.6, ms: 0.14 * CORRECT_MS },
  { to: 0, ms: 0.14 * CORRECT_MS },
];

/** Wordmark breathe under the loader — `cad-word-fade`, 6s. */
export const WORD_MS = 6000;
