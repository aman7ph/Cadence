import { useCallback, useEffect, useState } from "react";

// What the user explicitly chose (stored in localStorage).
export type ThemePreference = "light" | "dark" | "system";

// What is actually rendered right now.
export type ResolvedTheme = "light" | "dark";

// Keep the old alias so existing code that imports `Theme` still compiles.
export type Theme = ResolvedTheme;

const STORAGE_KEY = "cadence-theme";

function readStoredPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark") return raw;
  return "system";
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") return systemPrefersDark() ? "dark" : "light";
  return pref;
}

function applyTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

// Called once before React renders — prevents flash of wrong theme.
export function initializeTheme(): ResolvedTheme {
  const pref = readStoredPreference();
  const resolved = resolveTheme(pref);
  applyTheme(resolved);
  return resolved;
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(
    () => readStoredPreference(),
  );
  const [theme, setThemeState] = useState<ResolvedTheme>(
    () => resolveTheme(readStoredPreference()),
  );

  // When stored preference is "system", follow the OS media query live.
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      const resolved: ResolvedTheme = e.matches ? "dark" : "light";
      setThemeState(resolved);
      applyTheme(resolved);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setTheme = useCallback((next: ThemePreference) => {
    if (next === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    const resolved = resolveTheme(next);
    setPreferenceState(next);
    setThemeState(resolved);
    applyTheme(resolved);
  }, []);

  // Cycles: light → dark → system → light
  const toggle = useCallback(() => {
    const next: ThemePreference =
      preference === "light" ? "dark" : preference === "dark" ? "system" : "light";
    setTheme(next);
  }, [preference, setTheme]);

  return { theme, preference, setTheme, toggle };
}
