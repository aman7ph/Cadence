import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Cadence",
  slug: "cadence",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "cadence",
  userInterfaceStyle: "dark",
  android: {
    package: "com.cadence.app",
    backgroundColor: "#0e0f14",
    softwareKeyboardLayoutMode: "pan",
  },
  ios: {
    bundleIdentifier: "com.cadence.app",
    supportsTablet: false,
  },
  plugins: ["expo-router", "expo-secure-store"],
  experiments: {
    typedRoutes: true,
  },
});
