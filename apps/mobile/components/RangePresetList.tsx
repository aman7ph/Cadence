import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { DateRange } from "@cadence/shared";
import { RANGE_PRESETS } from "../lib/insightUtils";
import { useColors } from "../lib/theme";
import { SectionLabel } from "./ui/SectionLabel";

interface Props {
  today: string;
  activeLabel: string;
  onChange: (range: DateRange, label: string) => void;
}

/** The preset rows — "Last 30 days", "This month", and the rest. */
export function RangePresetList({ today, activeLabel, onChange }: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    labelWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
    row: { paddingHorizontal: 20, paddingVertical: 12 },
    rowOn: { backgroundColor: c.accBg },
    txt: { fontSize: 14, color: c.t1 },
    txtOn: { color: c.tacc, fontWeight: "600" },
  });

  return (
    <>
      <View style={s.labelWrap}>
        <SectionLabel>Presets</SectionLabel>
      </View>
      {RANGE_PRESETS.map((p) => {
        const on = p.label === activeLabel;
        return (
          <TouchableOpacity
            key={p.label}
            style={[s.row, on && s.rowOn]}
            onPress={() => onChange(p.range(today), p.label)}
            activeOpacity={0.7}
          >
            <Text style={[s.txt, on && s.txtOn]}>{p.label}</Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
}
