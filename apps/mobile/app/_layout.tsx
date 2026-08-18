import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, type ReactNode } from "react";
import { AppState, View } from "react-native";
import { convex } from "../lib/convexClient";
import { tokenCache } from "../lib/tokenCache";
import { ThemeProvider, useTheme, useColors } from "../lib/theme";
import { displayFontMap } from "../lib/fonts";
import { AppLoader } from "../components/AppLoader";
import { useReminderSync } from "../lib/useReminderSync";

// Hold the native splash until the fonts are registered, so the first frame the
// user sees is already in the right typeface. Without this the splash hides on
// its own and FontGate's bare background shows through for a beat.
// Rejects harmlessly if the splash is already gone; nothing depends on it.
void SplashScreen.preventAutoHideAsync().catch(() => {});

const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

function todayStr() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function ThemedStatusBar() {
  const { colorScheme } = useTheme();
  return <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />;
}

function EnsureProvisioned() {
  const me = useQuery(api.users.getMe);
  const provision = useMutation(api.users.ensureProvisioned);
  useEffect(() => {
    if (me === null) void provision({});
  }, [me, provision]);
  return null;
}

function RolloverOnForeground() {
  const me = useQuery(api.users.getMe);
  const rollover = useMutation(api.taskDays.rolloverOpenTasks);
  const promoteDueStagedTasks = useMutation(api.stagedTaskScheduling.promoteDue);
  const lastDate = useRef<string | null>(null);
  useEffect(() => {
    if (!me) return;
    const run = () => {
      const today = todayStr();
      if (lastDate.current === today) return;
      lastDate.current = today;
      // Promote before rollover: promoted tasks land with currentDate = today,
      // so they are never subject to same-day carryover.
      void promoteDueStagedTasks({ today });
      void rollover({ today });
    };
    run();
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") run(); });
    return () => sub.remove();
  }, [me, rollover, promoteDueStagedTasks]);
  return null;
}

// Mount point only — the logic lives in lib/useReminderSync.ts.
function ReminderSync() {
  useReminderSync();
  return null;
}

// Holds the first frame until Lora is registered, so no text renders in the UI
// face and then reflows into the serif. Only the ground colour paints meanwhile
// — deliberately no text, since text is the thing being waited on.
//
// A load failure is NOT fatal: RN falls back to the platform face for an
// unknown family, so the app stays readable. Blocking the whole app on a font
// would turn a cosmetic problem into an outage.
function FontGate({ children }: { children: ReactNode }) {
  const c = useColors();
  const [loaded, error] = useFonts(displayFontMap);
  const ready = loaded || !!error;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Sits BEHIND the still-visible splash, so this is never actually seen — it
  // exists so the tree has a ground colour if the splash is dismissed early.
  if (!ready) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  return <>{children}</>;
}

function AuthGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (!isLoaded) return;
    const inDrawer = segments[0] === "(drawer)";
    if (!isSignedIn && inDrawer) router.replace("/sign-in");
    else if (isSignedIn && !inDrawer) router.replace("/");
  }, [isLoaded, isSignedIn, segments]);
  if (!isLoaded) return <AppLoader />;
  return (
    <>
      {isSignedIn && <EnsureProvisioned />}
      {isSignedIn && <RolloverOnForeground />}
      {isSignedIn && <ReminderSync />}
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <FontGate>
        <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <ThemedStatusBar />
            <AuthGuard />
          </ConvexProviderWithClerk>
        </ClerkProvider>
      </FontGate>
    </ThemeProvider>
  );
}
