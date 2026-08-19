import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { fmtTimestamp } from "../lib/dateUtils";
import { GoalActionButtons } from "./GoalActionButtons";

export function GoalDetailHeaderCard({
  title,
  status,
  description,
  dueDate,
  createdAt,
  onRequestComplete,
  onRequestAbandon,
}: {
  title: string;
  status: string;
  description?: string;
  dueDate?: string;
  createdAt: number;
  onRequestComplete: () => void;
  onRequestAbandon: () => void;
}) {
  const c = useColors();
  const isActive = status === "active";

  const badge =
    status === "completed"
      ? { bg: c.successBg, fg: c.tSuccess, label: "Completed" }
      : status === "abandoned"
        ? { bg: c.bgS, fg: c.t3, label: "Abandoned" }
        : { bg: c.accBg, fg: c.tacc, label: "Active" };

  const s = StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd1,
      borderRadius: radii.lg,
      padding: 14,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: c.t1,
      letterSpacing: -0.5,
      marginBottom: 10,
      lineHeight: 28,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    badge: {
      borderRadius: radii.full,
      paddingHorizontal: 9,
      paddingVertical: 3,
    },
    badgeTxt: { fontSize: 11, fontWeight: "600" },
    startTxt: { fontSize: 12, color: c.t3 },
    dueBadge: {
      borderRadius: radii.full,
      paddingHorizontal: 9,
      paddingVertical: 3,
      backgroundColor: c.accBg,
    },
    dueTxt: { fontSize: 11, fontWeight: "600", color: c.tacc },
    desc: { fontSize: 13, color: c.t2, lineHeight: 20, marginBottom: 8 },
    divider: { height: 1, backgroundColor: c.bd1, marginVertical: 10 },
  });

  return (
    <View style={s.card}>
      <Text style={s.title}>{title}</Text>
      <View style={s.metaRow}>
        <View style={[s.badge, { backgroundColor: badge.bg }]}>
          <Text style={[s.badgeTxt, { color: badge.fg }]}>{badge.label}</Text>
        </View>
        <Text style={s.startTxt}>Started {fmtTimestamp(createdAt)}</Text>
        {dueDate && (
          <View style={s.dueBadge}>
            <Text style={s.dueTxt}>Due {dueDate}</Text>
          </View>
        )}
      </View>
      {description ? <Text style={s.desc}>{description}</Text> : null}
      {isActive && (
        <>
          <View style={s.divider} />
          <GoalActionButtons
            onRequestComplete={onRequestComplete}
            onRequestAbandon={onRequestAbandon}
          />
        </>
      )}
    </View>
  );
}
