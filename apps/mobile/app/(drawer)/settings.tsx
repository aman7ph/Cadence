import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppBar } from "../../components/AppBar";
import { ReminderSection } from "../../components/ReminderSection";
import { useColors, useTheme } from "../../lib/theme";
import { display } from "../../lib/fonts";
import { radii } from "../../lib/radii";
import { Button } from "../../components/ui/Button";
import { SectionLabel } from "../../components/ui/SectionLabel";
import type { ThemePreference } from "../../lib/theme";

const THEME_OPTS: { label: string; value: ThemePreference }[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export default function Settings() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const c = useColors();
  const { preference, setTheme } = useTheme();
  const me = useQuery(api.users.getMe);
  const setWeight = useMutation(api.users.setRoutineWeight);

  const pct = Math.round((me?.routineWeight ?? 0.5) * 100);
  const adjust = (dir: 1 | -1) => {
    const next = Math.min(100, Math.max(0, pct + dir * 5));
    void setWeight({ routineWeight: next / 100 });
  };

  const initial = (
    user?.firstName?.[0] ??
    user?.emailAddresses[0]?.emailAddress[0] ??
    "?"
  ).toUpperCase();

  const tz = me?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 40 },
    acctCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.card,
      borderRadius: radii.lg,
      padding: 14,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: c.bd1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: c.prim,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarTxt: { ...display("bold"), color: c.onPrim, fontSize: 17 },
    acctInfo: { flex: 1 },
    acctName: { fontSize: 15, fontWeight: "600", color: c.t1 },
    acctEmail: { fontSize: 12, color: c.t3 },
    secLblWrap: { marginBottom: 6, marginLeft: 4 },
    sec: {
      backgroundColor: c.card,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: c.bd1,
      overflow: "hidden",
      marginBottom: 20,
    },
    themeRow: { flexDirection: "row", gap: 8, padding: 14 },
    wtRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
    },
    wtLbl: { fontSize: 14, fontWeight: "500", color: c.t1 },
    wtCtrl: { flexDirection: "row", alignItems: "center", gap: 10 },
    adjBtn: {
      width: 28,
      height: 28,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: c.bd2,
      justifyContent: "center",
      alignItems: "center",
    },
    adjTxt: {
      fontSize: 16,
      color: c.t2,
      lineHeight: 20,
      includeFontPadding: false,
    },
    wtVal: {
      fontSize: 14,
      fontWeight: "700",
      color: c.t1,
      minWidth: 40,
      textAlign: "center",
    },
    tzRow: { padding: 14 },
    tzLbl: { fontSize: 14, fontWeight: "500", color: c.t1, marginBottom: 2 },
    tzVal: { fontSize: 12, color: c.t3 },
    rowLast: { padding: 14 },
    signOut: { fontSize: 14, fontWeight: "500", color: c.danger },
  });

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar title="Settings" />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.acctCard}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{initial}</Text>
          </View>
          <View style={s.acctInfo}>
            <Text style={s.acctName}>{user?.firstName ?? "User"}</Text>
            <Text style={s.acctEmail} numberOfLines={1}>
              {user?.emailAddresses[0]?.emailAddress}
            </Text>
          </View>
        </View>

        <View style={s.secLblWrap}><SectionLabel>Appearance</SectionLabel></View>
        <View style={s.sec}>
          <View style={s.themeRow}>
            {THEME_OPTS.map((opt) => (
              <Button
                key={opt.value}
                variant="segment"
                selected={preference === opt.value}
                title={opt.label}
                onPress={() => setTheme(opt.value)}
                style={{ flex: 1 }}
              />
            ))}
          </View>
        </View>

        <View style={s.secLblWrap}><SectionLabel>Productivity</SectionLabel></View>
        <View style={s.sec}>
          <View style={s.wtRow}>
            <Text style={s.wtLbl}>Routine weight</Text>
            <View style={s.wtCtrl}>
              <TouchableOpacity
                onPress={() => adjust(-1)}
                hitSlop={8}
                style={s.adjBtn}
              >
                <Text style={s.adjTxt}>−</Text>
              </TouchableOpacity>
              <Text style={s.wtVal}>{pct}%</Text>
              <TouchableOpacity
                onPress={() => adjust(1)}
                hitSlop={8}
                style={s.adjBtn}
              >
                <Text style={s.adjTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={s.secLblWrap}><SectionLabel>Reminders</SectionLabel></View>
        <View style={s.sec}>
          <ReminderSection />
        </View>

        <View style={s.secLblWrap}><SectionLabel>Data</SectionLabel></View>
        <View style={s.sec}>
          <View style={s.tzRow}>
            <Text style={s.tzLbl}>Timezone</Text>
            <Text style={s.tzVal}>{tz}</Text>
          </View>
        </View>

        <View style={s.secLblWrap}><SectionLabel>Account</SectionLabel></View>
        <View style={s.sec}>
          <TouchableOpacity style={s.rowLast} onPress={() => signOut()}>
            <Text style={s.signOut}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
