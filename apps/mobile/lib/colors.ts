// Cadence — mobile token layer.
//
// React Native has no CSS custom properties, so this file is what
// palette.css + semantic.css are on web: the ONE place a colour is defined.
// Fifty-odd components read it through useColors(); none should hardcode a hex.
//
// Values are the web's, so the two apps match. Where a name differs the mapping
// is in .agent/mobile-redesign-implementation-plan.md (M2).

// These two live in a plain-JS file because app.config.ts also needs them and
// cannot import TypeScript — see the note in nativeColors.js. Re-read here so
// the token layer and the native splash/icon config stay one definition.
import { NATIVE_BG, NATIVE_ACCENT } from "./nativeColors";

export const darkColors = {
  bg: NATIVE_BG, // web --bg-app
  bgE: "#211c15", // --bg-elevated
  bgS: "#282219", // --bg-sunken
  card: "#211c15", // --surface-card
  hover: "#282219", // --surface-hover
  active: "#372e20", // --surface-active
  accBg: "#3a2f1c", // --surface-accent (gold-950)

  t1: "#f3ecdf", // --text-primary
  t2: "#a89a80", // --text-secondary
  t3: "#7a7264", // --text-tertiary
  tacc: "#e8a13d", // --text-accent
  onPrim: "#1c1305", // --text-on-accent — ink ON gold, NOT white
  // Text/glyphs on a solid DANGER fill (the red abandon/delete button). White
  // in both themes — red is dark enough for it either way. Completion is NOT
  // here: it fills with gold now, so its tick takes `onPrim`.
  onStatus: "#ffffff",

  bd1: "#372e20", // --border-subtle
  bd2: "#4f4433", // --border-default
  bd3: "#7a7264", // --border-strong
  bdAcc: "#e8a13d", // --border-accent — focused inputs, selected chips

  prim: NATIVE_ACCENT, // --action-primary
  primH: "#f3c877", // --action-primary-hover

  // The gyroscope's second and third rings. Fixed in BOTH themes, exactly as
  // web has them — mark.css points these at raw --gold-500 / --gold-200 rather
  // than at semantic roles, because the mark is an identity, not a UI surface:
  // its ring relationship has to hold whichever theme is on. (Ring A is the
  // exception and does follow `prim`.)
  markB: "#c9862a", // --gold-500
  markC: "#f3c877", // --gold-200

  // Gold, not green. The prototype contains NO green at all — a scan of every
  // frame found 12 colours, all warm greys plus gold, and its completed
  // checkbox, streaks and charts are all gold. Green was an unexamined
  // carryover from the pre-redesign palette. Completion sharing the accent hue
  // is intentional in this language, not a collision.
  cplt: "#e8a13d", // --status-complete
  // Neutral, not amber: on this palette an amber "carried" badge reads as the
  // gold accent, i.e. as a primary action. Same call as web.
  carry: "#a89a80", // --status-carryover
  pending: "#7a7264", // --status-pending
  success: "#e8a13d",
  tSuccess: "#e8a13d", // --text-success — success text ON successBg
  danger: "#dc4f48", // --status-danger
  successBg: "#3a2f1c", // --surface-success
  dangerBg: "#3a1f1e", // --surface-danger

  // Modal/drawer backdrop. A token because every sheet in the app was
  // hand-rolling its own rgba() at a slightly different alpha (0.45/0.5/0.55).
  scrim: "rgba(0,0,0,0.55)",

  chart1: "#e8a13d",
  chart2: "#c9862a", // bronze — was green
  chart3: "#52b8aa",
  chart4: "#e07370",
  chart5: "#a992e0",
  chart6: "#6aa9e0",

  // Activity ramp — gold, not green, so "activity" and "completion" stop
  // sharing a colour language. Step 0 is the sunken surface: empty reads as
  // absence rather than as the lowest value.
  heat0: "#282219",
  heat1: "#4a3a1e",
  heat2: "#7a5c24",
  heat3: "#b5862c",
  heat4: "#e8a13d",
} as const;

export const lightColors: { [K in keyof typeof darkColors]: string } = {
  bg: "#faf9f6",
  bgE: "#ffffff",
  bgS: "#f1efe8",
  card: "#ffffff",
  hover: "#faf9f6",
  active: "#f1efe8",
  accBg: "#faecd0",

  t1: "#221f1a",
  t2: "#7a7264",
  t3: "#a89a80",
  tacc: "#bd7a15",
  onPrim: "#ffffff",
  onStatus: "#ffffff",

  bd1: "#e4e0d5",
  bd2: "#c9c0ae",
  bd3: "#a89a80",
  bdAcc: "#bd7a15",

  prim: "#bd7a15",
  primH: "#9a6210",

  markB: "#c9862a",
  markC: "#f3c877",

  cplt: "#bd7a15",
  carry: "#7a7264",
  pending: "#a89a80",
  success: "#bd7a15",
  tSuccess: "#9a6210",
  danger: "#c9403a",
  successBg: "#faecd0",
  dangerBg: "#fdeeed",

  // Same scrim in both themes: it darkens whatever is behind the sheet, and a
  // light-theme scrim that isn't dark stops reading as an overlay at all.
  scrim: "rgba(0,0,0,0.45)",

  chart1: "#bd7a15",
  chart2: "#9a6210",
  chart3: "#3d9b8f",
  chart4: "#c9504f",
  chart5: "#8a6fc4",
  chart6: "#4a89c4",

  heat0: "#ece7dc",
  heat1: "#f3ddb0",
  heat2: "#e8bd72",
  heat3: "#d99a35",
  heat4: "#b5761a",
};

/** The shape every consumer sees, whichever theme is active. */
export type Colors = { [K in keyof typeof darkColors]: string };

// Backward-compat alias — static dark values for any legacy module-level use
export const colors = darkColors;
