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
  // EAS Update (OTA): installed builds poll this URL for new JS bundles.
  // appVersion policy: runtime version == `version` above. BUMP `version`
  // WHENEVER THE NATIVE LAYER CHANGES (new native module, SDK upgrade),
  // or old installs would receive JS their binary can't run.
  // (fingerprint policy is not usable here: pnpm monorepo hoisting makes the
  // cloud-computed fingerprint differ from the local one and the build fails.)
  updates: {
    url: "https://u.expo.dev/9aecf529-c02a-41fa-b8e5-9981aba64ad3",
  },
  runtimeVersion: {
    policy: "appVersion",
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
