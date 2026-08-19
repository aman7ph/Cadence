import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { fmtLong } from "../lib/dateUtils";
import { IconButton } from "./ui/IconButton";

/** `PAST DAY / Tuesday, 12 August` with the close button. */
export function HistoryDayHeader({
  date,
  today,
  onClose,
}: {
  date: string;
  today: string;
  onClose: () => void;
}) {
  const c = useColors();
  const isPast = date < today;

  const s = StyleSheet.create({
    hdr: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 12,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.bd1,
    },
    meta: { flex: 1 },
    label: {
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.9,
      color: c.t3,
    },
    date: { fontSize: 15, fontWeight: "600", color: c.t1, marginTop: 2 },
  });

  return (
    <View style={s.hdr}>
      <View style={s.meta}>
        <Text style={s.label}>
          {date === today ? "Today" : isPast ? "Past day" : ""}
        </Text>
        <Text style={s.date} numberOfLines={1}>
          {fmtLong(date)}
        </Text>
      </View>
      <IconButton glyph="✕" onPress={onClose} accessibilityLabel="Close" />
    </View>
  );
}
