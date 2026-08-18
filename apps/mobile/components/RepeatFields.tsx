import { StyleSheet, Text, TextInput, View } from "react-native";
import { formatIntervalMinutes } from "@cadence/shared";
import { useColors } from "../lib/theme";

interface Props {
  target: string;
  interval: string;
  error: string | null;
  disabled?: boolean;
  cadenceLabel?: string;
  onTargetChange: (v: string) => void;
  onIntervalChange: (v: string) => void;
}

// The repeat count + interval panel only — each caller supplies its own
// toggle, because the two forms disclose it differently: AddTaskBar uses an
// inline ↻ icon button beside the goal ◎ (a one-line quick-capture bar),
// while the routine sheet has room for a labelled pill.
export function RepeatFields({
  target, interval, error, disabled, cadenceLabel = "today",
  onTargetChange, onIntervalChange,
}: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    panel: { backgroundColor: c.bgE, borderWidth: 1, borderColor: c.bd1,
             borderRadius: 10, padding: 10, gap: 8, marginTop: 6 },
    row:   { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    num:   { width: 70, backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
             borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8,
             fontSize: 13, color: c.t1 },
    lbl:   { fontSize: 12, color: c.t2 },
    echo:  { fontSize: 11, color: c.t3, backgroundColor: c.active,
             borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
    err:   { fontSize: 12, color: c.danger },
  });

  return (
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
  );
}
