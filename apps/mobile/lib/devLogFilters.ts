import { LogBox } from "react-native";

// Silences ONE spurious Expo Go error, and it has to live in its own module for
// an ordering reason: the error fires from a side-effect module that runs the
// moment `expo-notifications` is imported, and expo-router evaluates
// `(drawer)/settings.tsx` — which pulls that import in — BEFORE it evaluates
// `app/_layout.tsx`. A filter registered in the root layout would install too
// late to catch it. Importing this file immediately above the
// `expo-notifications` import guarantees it runs first, because ES import side
// effects execute in source order.
//
// Why it is safe to silence: this app never uses remote push. It calls
// scheduleNotificationAsync, the channel APIs and the permission APIs — all
// LOCAL, all still supported in Expo Go. The error originates in
// DevicePushTokenAutoRegistration, which registers a push-token listener purely
// as an import side effect; no code of ours requests it and expo-notifications
// exposes no way to opt out.
//
// Matched by exact text, not blanket-ignored, so every other notification error
// still surfaces. Dev-only — production builds never take the Expo Go path.
if (__DEV__) {
  LogBox.ignoreLogs([
    /expo-notifications: Android Push notifications \(remote notifications\)/,
  ]);
}
