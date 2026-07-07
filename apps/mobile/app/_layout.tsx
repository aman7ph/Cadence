import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, AppState, Text, View } from "react-native";
import { convex } from "../lib/convexClient";
import { tokenCache } from "../lib/tokenCache";
import { ThemeProvider, useTheme, useColors } from "../lib/theme";

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
  const rollover = useMutation(api.dailyTasks.rolloverOpenTasks);
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

function LoadingScreen() {
  const c = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, alignItems: "center", justifyContent: "center", gap: 14 }}>
      <Text style={{ fontSize: 26, fontWeight: "700", color: c.t1, letterSpacing: -0.5 }}>Cadence</Text>
      <ActivityIndicator color={c.prim} size="small" />
    </View>
  );
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
  if (!isLoaded) return <LoadingScreen />;
  return (
    <>
      {isSignedIn && <EnsureProvisioned />}
      {isSignedIn && <RolloverOnForeground />}
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <ThemedStatusBar />
          <AuthGuard />
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </ThemeProvider>
  );
}
