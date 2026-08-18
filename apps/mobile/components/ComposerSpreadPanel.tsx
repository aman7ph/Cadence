import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatIntervalMinutes } from "@cadence/shared";
import { useColors } from "../lib/theme";
import { display } from "../lib/fonts";
import { radii } from "../lib/radii";
import { Stepper } from "./ui/Stepper";

interface Props {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  target: number;
  onTargetChange: (n: number) => void;
  intervalMinutes: number;
  onIntervalChange: (n: number) => void;
  disabled?: boolean;
}

/**
 * "Spread across the day" — the mobile twin of web's composer-spread-panel.tsx.
 *
 * Replaces a labelled pill plus two free-text fields. The switch and the two
 * steppers are what web uses, and the steppers also carry the bounds (2–100
 * check-ins, 0–1440 minutes) that the text fields could only enforce by
 * rejecting a submit after the fact.
 */
export function ComposerSpreadPanel({
  enabled,
  onEnabledChange,
  target,
  onTargetChange,
  intervalMinutes,
  onIntervalChange,
  disabled,
}: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    wrap: { gap: 10, borderTopWidth: 1, borderTopColor: c.bd1, paddingTop: 14 },
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    headLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
    headTxt: {
      ...display("regular"),
      fontSize: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: c.t3,
    },
    dot: { width: 6, height: 6, borderRadius: radii.full, backgroundColor: c.tacc },
    track: {
      width: 32, height: 18, borderRadius: radii.pill, borderWidth: 1,
      borderColor: c.bd1, backgroundColor: c.bgS, justifyContent: "center",
    },
    trackOn: { borderColor: c.bdAcc, backgroundColor: c.accBg },
    knob: {
      position: "absolute", left: 2, width: 12, height: 12,
      borderRadius: radii.full, backgroundColor: c.t3,
    },
    knobOn: { left: 16, backgroundColor: c.prim },
    fields: { gap: 10 },
  });

  return (
    <View style={s.wrap}>
      <View style={s.head}>
        <View style={s.headLeft}>
          <View style={s.dot} />
          <Text style={s.headTxt}>Spread across the day</Text>
        </View>
        <TouchableOpacity
          disabled={disabled}
          onPress={() => onEnabledChange(!enabled)}
          hitSlop={10}
          style={[s.track, enabled && s.trackOn]}
          accessibilityRole="switch"
          accessibilityState={{ checked: enabled }}
          accessibilityLabel="Spread across the day"
        >
          <View style={[s.knob, enabled && s.knobOn]} />
        </TouchableOpacity>
      </View>

      {enabled && (
        <View style={s.fields}>
          <Stepper
            label="Check-ins"
            value={target}
            onChange={onTargetChange}
            min={2}
            max={100}
            disabled={disabled}
          />
          <Stepper
            label="Min. gap"
            value={intervalMinutes}
            onChange={onIntervalChange}
            min={0}
            max={1440}
            suffix={formatIntervalMinutes(intervalMinutes)}
            disabled={disabled}
          />
        </View>
      )}
    </View>
  );
}
