import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Cadence",
  slug: "cadence",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "cadence",
  userInterfaceStyle: "dark",
  icon: "./assets/images/icon.png",
  android: {
    package: "com.cadence.app",
    backgroundColor: "#0e0f14",
    softwareKeyboardLayoutMode: "pan",
  },
  ios: {
    bundleIdentifier: "com.cadence.app",
    supportsTablet: false,
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    [
      "expo-build-properties",
      {
        android: {
          useLegacyPackaging: true,
          buildArchs: ["arm64-v8a"],
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "9aecf529-c02a-41fa-b8e5-9981aba64ad3",
    },
  },
});
