import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { DateRange } from "@cadence/shared";
import { DatePickerModal } from "./DatePickerModal";
import { RangeCustomFields } from "./RangeCustomFields";
import { RangePresetList } from "./RangePresetList";
import { Sheet } from "./ui/Sheet";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { RANGE_PRESETS, fmtShort } from "../lib/insightUtils";

interface Props {
  visible: boolean;
  range: DateRange;
  label: string;
  today: string;
  onChange: (range: DateRange, label: string) => void;
  onClose: () => void;
}

export function RangePickerSheet({
  visible,
  range,
  label,
  today,
  onChange,
  onClose,
}: Props) {
  const c = useColors();
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo, setCustomTo] = useState(range.to);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setCustomFrom(range.from);
      setCustomTo(range.to);
      setErr(null);
    }
  }, [visible]);

  const applyCustom = () => {
    if (customFrom > customTo) {
      setErr("Start must be before end.");
      return;
    }
    if (customTo > today) {
      setErr("End date can't be in the future.");
      return;
    }
    onChange(
      { from: customFrom, to: customTo },
      `${fmtShort(customFrom)} – ${fmtShort(customTo)}`,
    );
  };

  const s = StyleSheet.create({
    sheetHdr: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: c.bd1,
    },
    sheetTitle: { fontSize: 16, fontWeight: "700", color: c.t1 },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd2,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  return (
    <>
      <Sheet visible={visible} onClose={onClose}>
        <View style={s.sheetHdr}>
          <Text style={s.sheetTitle}>Date Range</Text>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: c.t2 }}>
              ✕
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
          <RangePresetList
            today={today}
            activeLabel={label}
            onChange={onChange}
          />
          <RangeCustomFields
            from={customFrom}
            to={customTo}
            error={err}
            onPickFrom={() => setFromOpen(true)}
            onPickTo={() => setToOpen(true)}
            onApply={applyCustom}
          />
        </ScrollView>
      </Sheet>
      <DatePickerModal
        visible={fromOpen}
        value={customFrom}
        max={customTo}
        onChange={(v) => {
          setCustomFrom(v);
          setFromOpen(false);
          setErr(null);
        }}
        onClose={() => setFromOpen(false)}
      />
      <DatePickerModal
        visible={toOpen}
        value={customTo}
        min={customFrom}
        max={today}
        onChange={(v) => {
          setCustomTo(v);
          setToOpen(false);
          setErr(null);
        }}
        onClose={() => setToOpen(false)}
      />
    </>
  );
}
