// Cadence — the radius scale.
//
// The counterpart to `borderRadius` in apps/web/tailwind.config.ts, and the
// same four steps for the same reason.
//
// Mobile currently hand-authors EIGHTEEN distinct radii (1,2,3,4,5,6,8,10,11,
// 12,14,16,17,18,20,22,25,999) as inline numbers — worse drift than the
// prototype's eight, which is what the web scale was introduced to fix. These
// are the clusters that drift falls into. Nothing outside this file should
// invent a new one.

export const radii = {
  sm: 9, // controls: buttons, inputs, outlined actions
  md: 12, // blocks: ghost add-rows, menus, popovers
  lg: 16, // cards and panels
  pill: 20, // segmented controls and chips
  /** Bottom-sheet top corners. Larger than a card on purpose — the sheet is
   *  the window edge, not a panel sitting on the page. Seven sheets had this
   *  hand-written as 20 or 22; this is the value most of them meant. */
  sheet: 20,
  /** Circles only — avatars, day dots, the FAB. Not a step on the scale. */
  full: 999,
} as const;

export type Radius = keyof typeof radii;

// EXEMPT: 1–2px rounding on hairline bars (the burger lines, the drawer's
// active accent, a skipped-routine dash) is an end-cap on a 1.5px stroke, not a
// container radius. Snapping those to a step would change how they read, so
// they stay as literals — the only radii allowed outside this file.
