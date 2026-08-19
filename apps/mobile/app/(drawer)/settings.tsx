import { useAuth } from "@clerk/clerk-expo";
import { useQuery } from "convex/react";
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
import { RoutineWeightControl } from "../../components/RoutineWeightControl";
import { SettingsAccountCard } from "../../components/SettingsAccountCard";
import { SettingsSection } from "../../components/SettingsSection";
import { Button } from "../../components/ui/Button";
import { useColors, useTheme } from "../../lib/theme";
import type { ThemePreference } from "../../lib/theme";

const THEME_OPTS: { label: string; value: ThemePreference }[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

export default function Settings() {
  const { signOut } = useAuth();
  const c = useColors();
  const { preference, setTheme } = useTheme();
  const me = useQuery(api.users.getMe);

  const tz = me?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
    content: { padding: 16, paddingBottom: 40 },
    themeRow: { flexDirection: "row", gap: 8, padding: 14 },
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
        <SettingsAccountCard />

        <SettingsSection title="Appearance">
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
        </SettingsSection>

        <SettingsSection title="Productivity">
          <RoutineWeightControl />
        </SettingsSection>

        <SettingsSection title="Reminders">
          <ReminderSection />
        </SettingsSection>

        <SettingsSection title="Data">
          <View style={s.tzRow}>
            <Text style={s.tzLbl}>Timezone</Text>
            <Text style={s.tzVal}>{tz}</Text>
          </View>
        </SettingsSection>

        <SettingsSection title="Account">
          <TouchableOpacity style={s.rowLast} onPress={() => signOut()}>
            <Text style={s.signOut}>Sign out</Text>
          </TouchableOpacity>
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
