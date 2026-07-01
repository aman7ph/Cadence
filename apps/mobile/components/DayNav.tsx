import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";

interface Props {
  date: string;
  today: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function shortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export function DayNav({ date, today, onPrev, onNext, onToday }: Props) {
  const c = useColors();
  const isToday = date === today;

  const s = StyleSheet.create({
    row:          { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
    arrowBtn:     { width: 28, height: 28, borderRadius: 8, borderWidth: 1,
                    borderColor: c.bd2, backgroundColor: c.card,
                    justifyContent: "center", alignItems: "center" },
    arrowDim:     { borderColor: c.bd1, opacity: 0.35 },
    arrow:        { fontSize: 16, color: c.t2, includeFontPadding: false },
    arrowDimTxt:  { color: c.t3 },
    chip:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
                    backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2 },
    chipToday:    { backgroundColor: c.accBg, borderColor: "rgba(128,121,240,0.35)" },
    chipTxt:      { fontSize: 11, fontWeight: "600", color: c.t3 },
    chipTxtToday: { color: c.tacc },
  });

  return (
    <View style={s.row}>
      <TouchableOpacity onPress={onPrev} hitSlop={12} style={s.arrowBtn}>
        <Text style={s.arrow}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={isToday ? undefined : onToday}
        activeOpacity={isToday ? 1 : 0.7}
        style={[s.chip, isToday && s.chipToday]}
      >
        <Text style={[s.chipTxt, isToday && s.chipTxtToday]}>
          {isToday ? "Today" : shortDate(date)}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onNext}
        hitSlop={12}
        disabled={isToday}
        style={[s.arrowBtn, isToday && s.arrowDim]}
      >
        <Text style={[s.arrow, isToday && s.arrowDimTxt]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}
