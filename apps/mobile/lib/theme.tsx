import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import * as SecureStore from "expo-secure-store";
import { darkColors, lightColors } from "./colors";

export type ThemePreference = "light" | "dark" | "system";
type Colors = { [K in keyof typeof darkColors]: string };

interface ThemeCtx {
  preference: ThemePreference;
  colorScheme: "light" | "dark";
  colors: Colors;
  setTheme: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  preference: "dark",
  colorScheme: "dark",
  colors: darkColors,
  setTheme: () => {},
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

  return (
    <ThemeContext.Provider value={{
      preference: pref,
      colorScheme: scheme,
      colors: scheme === "dark" ? darkColors : lightColors,
      setTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useColors(): Colors {
  return useContext(ThemeContext).colors;
}

export function useTheme() {
  const { preference, colorScheme, setTheme } = useContext(ThemeContext);
  return { preference, colorScheme, setTheme };
}
