import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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
  /** Flips the RESOLVED scheme: one tap always changes what you see. */
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

  // Binary, and driven by the RESOLVED scheme rather than the preference.
  // Cycling light → dark → system meant that from dark the first tap landed on
  // "system", which on a dark device resolves back to dark — so nothing
  // visibly happened and it took two taps to reach light. Flipping the
  // resolved scheme always changes what you see, on the first tap.
  // "system" stays available in Settings, where it is an explicit choice.
  const toggle = () => setTheme(scheme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider
      value={{
        preference: pref,
        colorScheme: scheme,
        colors: scheme === "dark" ? darkColors : lightColors,
        setTheme,
        toggle,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useColors(): Colors {
  return useContext(ThemeContext).colors;
}

export function useTheme() {
  const { preference, colorScheme, setTheme, toggle } =
    useContext(ThemeContext);
  return { preference, colorScheme, setTheme, toggle };
}
