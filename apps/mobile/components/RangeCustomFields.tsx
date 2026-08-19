import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fmtShort } from "../lib/insightUtils";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { SectionLabel } from "./ui/SectionLabel";

interface Props {
  from: string;
  to: string;
  error: string | null;
  onPickFrom: () => void;
  onPickTo: () => void;
  onApply: () => void;
}

/** From / To pickers plus the apply action, below the preset list. */
export function RangeCustomFields({
  from,
  to,
  error,
  onPickFrom,
  onPickTo,
  onApply,
}: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    divider: {
      height: 1,
      backgroundColor: c.bd1,
      marginHorizontal: 20,
      marginTop: 8,
    },
    labelWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 10,
      gap: 12,
    },
    lbl: { width: 36, fontSize: 13, color: c.t3, fontWeight: "500" },
    dateBtn: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd2,
      borderRadius: radii.sm,
      alignItems: "center",
    },
    dateTxt: { fontSize: 13, color: c.t1, fontWeight: "500" },
    err: {
      fontSize: 12,
      // `danger`, like every other error in the app. This used to be `chart4`,
      // a data-visualisation hue that happens to be reddish — so it looked
      // close enough to be missed, while sitting outside the status palette
      // and shifting independently of it whenever the chart series is retuned.
      color: c.danger,
      paddingHorizontal: 20,
      paddingTop: 4,
    },
    applyBtn: {
      marginHorizontal: 20,
      marginTop: 12,
      paddingVertical: 12,
      backgroundColor: c.prim,
      borderRadius: radii.md,
      alignItems: "center",
    },
    applyTxt: { fontSize: 14, fontWeight: "700", color: c.onPrim },
  });

  return (
    <>
      <View style={s.divider} />
      <View style={s.labelWrap}>
        <SectionLabel>Custom range</SectionLabel>
      </View>
      <View style={s.row}>
        <Text style={s.lbl}>From</Text>
        <TouchableOpacity
          style={s.dateBtn}
          onPress={onPickFrom}
          activeOpacity={0.7}
        >
          <Text style={s.dateTxt}>{fmtShort(from)}</Text>
        </TouchableOpacity>
      </View>
      <View style={s.row}>
        <Text style={s.lbl}>To</Text>
        <TouchableOpacity
          style={s.dateBtn}
          onPress={onPickTo}
          activeOpacity={0.7}
        >
          <Text style={s.dateTxt}>{fmtShort(to)}</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={s.err}>{error}</Text> : null}
      <TouchableOpacity
        style={s.applyBtn}
        onPress={onApply}
        activeOpacity={0.8}
      >
        <Text style={s.applyTxt}>Apply custom range</Text>
      </TouchableOpacity>
    </>
  );
}
