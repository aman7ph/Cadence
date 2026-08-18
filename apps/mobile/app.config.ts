import type { ExpoConfig, ConfigContext } from "expo/config";
// Read from the token layer so the native splash/launcher ground cannot drift
// from the app's own background — it silently did until the Step 1 re-theme.
import { darkColors } from "./lib/colors.ts";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Cadence",
  slug: "cadence",
  // 1.2.0 — expo-splash-screen is a NEW native module (verified absent from the
  // lockfile at the previous commit), so the runtimeVersion rule below makes
  // this bump mandatory and the redesign ships as a full EAS build.
  // NOTE: expo-font, added earlier in the redesign, did NOT require a bump —
  // it was already a dependency of `expo` and already in the binary.
  version: "1.2.0",
  orientation: "portrait",
  scheme: "cadence",
  userInterfaceStyle: "dark",
  // Both icon layers are GENERATED, never hand-drawn — `node icon.mjs` in
  // .agent/design/harness renders them from the web's own styles/mark.css, so
  // the launcher art and the in-app mark cannot drift apart. Re-run it if the
  // mark changes rather than editing the PNGs.
  icon: "./assets/images/icon.png",
  android: {
    package: "com.cadence.app",
    backgroundColor: darkColors.bg,
    // Without this, Android 8+ plates the square icon instead of masking a
    // proper foreground. The foreground PNG is deliberately transparent so the
    // launcher composites it over backgroundColor and applies its own mask.
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon-foreground.png",
      backgroundColor: darkColors.bg,
    },
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
      // The mark on the app's own ground, so launch reads as the gyroscope
      // rather than a plated tile. Uses the TRANSPARENT foreground PNG — the
      // same file the adaptive icon uses — composited over backgroundColor.
      //
      // imageWidth is derived, not guessed: the mark occupies 62% of that PNG
      // (see icon.mjs), and AppLoader renders it at 132px, so 132 / 0.62 ≈ 213
      // makes the splash hand off to the loader at the same size instead of
      // visibly jumping.
      "expo-splash-screen",
      {
        image: "./assets/images/icon-foreground.png",
        backgroundColor: darkColors.bg,
        imageWidth: 213,
      },
    ],
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
