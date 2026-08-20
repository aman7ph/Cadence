// Plain JavaScript on purpose. No type annotations, no `as const`, no imports.
//
// app.config.ts needs the app's ground colour for the native splash screen and
// the Android adaptive icon, and it used to read it straight from colors.ts.
// That built locally and FAILED ON EAS:
//
//   Error reading Expo config at .../app.config.ts: Unexpected token '{'
//
// On the build server, `expo config` loaded colors.ts through a transform that
// handled ESM `export` but did NOT strip TypeScript types, so it reached
//
//   export const lightColors: { [K in keyof typeof darkColors]: string } = {
//
// and died on the annotation — before compiling a single line of the app. The
// local run never reproduced it, so the rule to remember is the general one:
// **app.config.ts must not import any file containing TypeScript syntax.**
//
// Inlining the hex values here would have fixed the build too, but it would
// have reintroduced exactly the drift the import was added to prevent: the
// native splash ground silently disagreeing with the app's own background.
// Instead both sides read these two constants — lib/colors.ts re-exports them
// as `bg` and `prim`, so there is still one definition.

/** --bg-app / darkColors.bg — the native splash + adaptive-icon ground. */
export const NATIVE_BG = "#17140f";

/** --action-primary / darkColors.prim — tints the Android notification icon. */
export const NATIVE_ACCENT = "#e8a13d";
