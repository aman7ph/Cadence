import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { formatIntervalMinutes } from "@cadence/shared";
import { useColors } from "../lib/theme";

interface Props {
  enabled: boolean;
  target: string;
  interval: string;
  error: string | null;
  disabled?: boolean;
  cadenceLabel?: string;
  onToggle: () => void;
  onTargetChange: (v: string) => void;
  onIntervalChange: (v: string) => void;
}

// Repeat count + interval for the mobile create forms. Free-entry minutes with
// a humanized echo ("1h 30m"), matching web — a preset list would rule out
// ordinary choices like 45, and the backend accepts any whole 0..1440.
export function RepeatFields({
  enabled, target, interval, error, disabled, cadenceLabel = "today",
  onToggle, onTargetChange, onIntervalChange,
}: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    pill:     { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
                borderWidth: 1, borderColor: c.bd2, borderRadius: 999,
                paddingHorizontal: 12, paddingVertical: 6 },
    pillOn:   { borderColor: c.prim, backgroundColor: c.accBg },
    pillTxt:  { fontSize: 12, color: c.t3 },
    pillTxtOn:{ color: c.tacc, fontWeight: "600" },
    panel:    { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
                borderRadius: 10, padding: 10, gap: 8, marginTop: 8 },
    row:      { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    num:      { width: 70, backgroundColor: c.bgE, borderWidth: 1, borderColor: c.bd2,
                borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
                fontSize: 13, color: c.t1 },
    lbl:      { fontSize: 12, color: c.t2 },
    echo:     { fontSize: 11, color: c.t3, backgroundColor: c.active,
                borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
    err:      { fontSize: 12, color: "#f87171" },
  });

  return (
    <View style={{ marginTop: 10 }}>
      <TouchableOpacity onPress={onToggle} style={[s.pill, enabled && s.pillOn]} disabled={disabled}>
        <Text style={[s.pillTxt, enabled && s.pillTxtOn]}>↻  Repeat several times a day</Text>
      </TouchableOpacity>
      {enabled && (
        <View style={s.panel}>
          <View style={s.row}>
            <Text style={s.lbl}>Complete it</Text>
            <TextInput style={s.num} value={target} onChangeText={onTargetChange}
              placeholder="20" placeholderTextColor={c.t3}
              keyboardType="number-pad" editable={!disabled} />
            <Text style={s.lbl}>times {cadenceLabel}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.lbl}>at least</Text>
            <TextInput style={s.num} value={interval} onChangeText={onIntervalChange}
              placeholder="60" placeholderTextColor={c.t3}
              keyboardType="number-pad" editable={!disabled} />
            <Text style={s.lbl}>minutes apart</Text>
            {interval.trim() !== "" && (
              <Text style={s.echo}>{formatIntervalMinutes(Number(interval))}</Text>
            )}
          </View>
          {error && <Text style={s.err}>{error}</Text>}
        </View>
      )}
    </View>
  );
}
