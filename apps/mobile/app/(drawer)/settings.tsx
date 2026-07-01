import { useAuth, useUser } from "@clerk/clerk-expo";
import { useQuery, useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppBar } from "../../components/AppBar";
import { useColors, useTheme } from "../../lib/theme";
import type { ThemePreference } from "../../lib/theme";

const THEME_OPTS: { label: string; value: ThemePreference }[] = [
  { label: "Light",  value: "light"  },
  { label: "Dark",   value: "dark"   },
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
    user?.emailAddresses[0]?.emailAddress[0] ?? "?"
  ).toUpperCase();

  const tz = me?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const s = StyleSheet.create({
    screen:    { flex: 1, backgroundColor: c.bg },
    content:   { padding: 16, paddingBottom: 40 },
    acctCard:  { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.card,
                 borderRadius: 14, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: c.bd1 },
    avatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: c.prim,
                 justifyContent: "center", alignItems: "center" },
    avatarTxt: { color: "#fff", fontWeight: "700", fontSize: 17 },
    acctInfo:  { flex: 1 },
    acctName:  { fontSize: 15, fontWeight: "600", color: c.t1 },
    acctEmail: { fontSize: 12, color: c.t3 },
    secLbl:    { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8,
                 color: c.t3, marginBottom: 6, marginLeft: 4 },
    sec:       { backgroundColor: c.card, borderRadius: 14, borderWidth: 1,
                 borderColor: c.bd1, overflow: "hidden", marginBottom: 20 },
    themeRow:  { flexDirection: "row", gap: 8, padding: 14 },
    themeBtn:  { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
                 borderColor: c.bd2, alignItems: "center" },
    themeBtnOn: { borderColor: c.prim, backgroundColor: c.accBg },
    themeTxt:  { fontSize: 12, fontWeight: "600", color: c.t2 },
    themeTxtOn: { color: c.tacc },
    wtRow:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                 padding: 14 },
    wtLbl:     { fontSize: 14, fontWeight: "500", color: c.t1 },
    wtCtrl:    { flexDirection: "row", alignItems: "center", gap: 10 },
    adjBtn:    { width: 28, height: 28, borderRadius: 8, borderWidth: 1,
                 borderColor: c.bd2, justifyContent: "center", alignItems: "center" },
    adjTxt:    { fontSize: 16, color: c.t2, lineHeight: 20, includeFontPadding: false },
    wtVal:     { fontSize: 14, fontWeight: "700", color: c.t1, minWidth: 40, textAlign: "center" },
    tzRow:     { padding: 14 },
    tzLbl:     { fontSize: 14, fontWeight: "500", color: c.t1, marginBottom: 2 },
    tzVal:     { fontSize: 12, color: c.t3 },
    rowLast:   { padding: 14 },
    signOut:   { fontSize: 14, fontWeight: "500", color: c.danger },
  });

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <AppBar title="Settings" />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.acctCard}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{initial}</Text></View>
          <View style={s.acctInfo}>
            <Text style={s.acctName}>{user?.firstName ?? "User"}</Text>
            <Text style={s.acctEmail} numberOfLines={1}>{user?.emailAddresses[0]?.emailAddress}</Text>
          </View>
        </View>

        <Text style={s.secLbl}>Appearance</Text>
        <View style={s.sec}>
          <View style={s.themeRow}>
            {THEME_OPTS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[s.themeBtn, preference === opt.value && s.themeBtnOn]}
                onPress={() => setTheme(opt.value)}
              >
                <Text style={[s.themeTxt, preference === opt.value && s.themeTxtOn]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={s.secLbl}>Productivity</Text>
        <View style={s.sec}>
          <View style={s.wtRow}>
            <Text style={s.wtLbl}>Routine weight</Text>
            <View style={s.wtCtrl}>
              <TouchableOpacity onPress={() => adjust(-1)} hitSlop={8} style={s.adjBtn}>
                <Text style={s.adjTxt}>−</Text>
              </TouchableOpacity>
              <Text style={s.wtVal}>{pct}%</Text>
              <TouchableOpacity onPress={() => adjust(1)} hitSlop={8} style={s.adjBtn}>
                <Text style={s.adjTxt}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={s.secLbl}>Data</Text>
        <View style={s.sec}>
          <View style={s.tzRow}>
            <Text style={s.tzLbl}>Timezone</Text>
            <Text style={s.tzVal}>{tz}</Text>
          </View>
        </View>

        <Text style={s.secLbl}>Account</Text>
        <View style={s.sec}>
          <TouchableOpacity style={s.rowLast} onPress={() => signOut()}>
            <Text style={s.signOut}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
