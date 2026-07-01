import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";

export type ScheduleType = "daily" | "weekdays" | "custom";

const SHORT = ["S", "M", "T", "W", "T", "F", "S"] as const;
const FULL  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function scheduleLabel(type: ScheduleType, days?: number[]): string {
  if (type === "daily") return "Every day";
  if (type === "weekdays") return "Weekdays";
  if (!days?.length) return "Custom";
  return days.map((d) => FULL[d]).join(" · ");
}

interface Props {
  scheduleType: ScheduleType;
  customDays: number[];
  disabled?: boolean;
  onChange: (t: ScheduleType) => void;
  onDayToggle: (d: number) => void;
}

export function SchedulePicker({ scheduleType, customDays, disabled, onChange, onDayToggle }: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    wrap:      { gap: 10 },
    typeRow:   { flexDirection: "row", gap: 8 },
    typeBtn:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
                 borderWidth: 1, borderColor: c.bd2, backgroundColor: c.card },
    typeBtnOn: { borderColor: c.prim, backgroundColor: c.accBg },
    typeTxt:   { fontSize: 12, fontWeight: "600", color: c.t2 },
    typeTxtOn: { color: c.tacc },
    daysRow:   { flexDirection: "row", gap: 5 },
    dayBtn:    { width: 34, height: 34, borderRadius: 17, borderWidth: 1,
                 borderColor: c.bd2, backgroundColor: c.card,
                 justifyContent: "center", alignItems: "center" },
    dayBtnOn:  { borderColor: c.prim, backgroundColor: c.prim },
    dayTxt:    { fontSize: 11, fontWeight: "700", color: c.t2 },
    dayTxtOn:  { color: "#fff" },
  });

  return (
    <View style={s.wrap}>
      <View style={s.typeRow}>
        {(["daily", "weekdays", "custom"] as ScheduleType[]).map((t) => (
          <TouchableOpacity key={t} onPress={() => onChange(t)} disabled={disabled}
            style={[s.typeBtn, scheduleType === t && s.typeBtnOn]}>
            <Text style={[s.typeTxt, scheduleType === t && s.typeTxtOn]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {scheduleType === "custom" && (
        <View style={s.daysRow}>
          {SHORT.map((lbl, idx) => {
            const on = customDays.includes(idx);
            return (
              <TouchableOpacity key={idx} onPress={() => onDayToggle(idx)} disabled={disabled}
                style={[s.dayBtn, on && s.dayBtnOn]}>
                <Text style={[s.dayTxt, on && s.dayTxtOn]}>{lbl}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
