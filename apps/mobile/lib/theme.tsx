import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { darkColors, lightColors, type Colors } from "./colors";

export type ThemePreference = "light" | "dark" | "system";
export type { Colors };

interface ThemeCtx {
  preference: ThemePreference;
  colorScheme: "light" | "dark";
  colors: Colors;
  setTheme: (p: ThemePreference) => void;
  /** Cycles light → dark → system → light, matching the web toggle exactly. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  preference: "dark",
  colorScheme: "dark",
  colors: darkColors,
  setTheme: () => {},
  toggle: () => {},
});

const STORE_KEY = "theme_preference";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme() ?? "dark";
  const [pref, setPref] = useState<ThemePreference>("dark");

  useEffect(() => {
    SecureStore.getItemAsync(STORE_KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") setPref(v);
    });
  }, []);

  const scheme = pref === "system" ? system : pref;

  const setTheme = (p: ThemePreference) => {
    setPref(p);
    void SecureStore.setItemAsync(STORE_KEY, p);
  };

  // Same cycle as web's useTheme().toggle — light → dark → system → light — so
  // the control behaves identically on both platforms. The three-way picker in
  // Settings stays; this is the quick path through the same states.
  const toggle = () =>
    setTheme(pref === "light" ? "dark" : pref === "dark" ? "system" : "light");

  return (
    <ThemeContext.Provider value={{
      preference: pref,
      colorScheme: scheme,
      colors: scheme === "dark" ? darkColors : lightColors,
      setTheme,
      toggle,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColors(): Colors {
  return useContext(ThemeContext).colors;
}

export function useTheme() {
  const { preference, colorScheme, setTheme, toggle } = useContext(ThemeContext);
  return { preference, colorScheme, setTheme, toggle };
}
