import { useEffect, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { DateRange } from "@cadence/shared";
import { DatePickerModal } from "./DatePickerModal";
import { useColors } from "../lib/theme";
import { RANGE_PRESETS, fmtShort } from "../lib/insightUtils";

interface Props {
  visible: boolean;
  range: DateRange;
  label: string;
  today: string;
  onChange: (range: DateRange, label: string) => void;
  onClose: () => void;
}

export function RangePickerSheet({ visible, range, label, today, onChange, onClose }: Props) {
  const c = useColors();
  const [customFrom, setCustomFrom] = useState(range.from);
  const [customTo,   setCustomTo]   = useState(range.to);
  const [fromOpen,   setFromOpen]   = useState(false);
  const [toOpen,     setToOpen]     = useState(false);
  const [err,        setErr]        = useState<string | null>(null);

  useEffect(() => {
    if (visible) { setCustomFrom(range.from); setCustomTo(range.to); setErr(null); }
  }, [visible]);

  const applyCustom = () => {
    if (customFrom > customTo) { setErr("Start must be before end."); return; }
    if (customTo > today)      { setErr("End date can't be in the future."); return; }
    onChange({ from: customFrom, to: customTo }, `${fmtShort(customFrom)} – ${fmtShort(customTo)}`);
  };

  const s = StyleSheet.create({
    overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    sheet:      { backgroundColor: c.bgE, borderTopLeftRadius: 20, borderTopRightRadius: 20,
                  paddingBottom: 32, maxHeight: "90%" as const },
    handle:     { width: 36, height: 4, backgroundColor: c.bd3, borderRadius: 2,
                  alignSelf: "center", marginTop: 10, marginBottom: 4 },
    sheetHdr:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  paddingHorizontal: 20, paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: c.bd1 },
    sheetTitle: { fontSize: 16, fontWeight: "700", color: c.t1 },
    closeBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: c.card,
                  borderWidth: 1, borderColor: c.bd2, alignItems: "center", justifyContent: "center" },
    secLbl:     { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1,
                  color: c.t3, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
    preset:     { paddingHorizontal: 20, paddingVertical: 12 },
    presetA:    { backgroundColor: c.accBg },
    presetTxt:  { fontSize: 14, color: c.t1 },
    presetTxtA: { color: c.tacc, fontWeight: "600" },
    divider:    { height: 1, backgroundColor: c.bd1, marginHorizontal: 20, marginTop: 8 },
    customRow:  { flexDirection: "row", alignItems: "center", paddingHorizontal: 20,
                  paddingVertical: 10, gap: 12 },
    customLbl:  { width: 36, fontSize: 13, color: c.t3, fontWeight: "500" },
    dateBtn:    { flex: 1, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: c.card,
                  borderWidth: 1, borderColor: c.bd2, borderRadius: 10, alignItems: "center" },
    dateTxt:    { fontSize: 13, color: c.t1, fontWeight: "500" },
    errTxt:     { fontSize: 12, color: c.chart4, paddingHorizontal: 20, paddingTop: 4 },
    applyBtn:   { marginHorizontal: 20, marginTop: 12, paddingVertical: 12, backgroundColor: c.prim,
                  borderRadius: 12, alignItems: "center" },
    applyTxt:   { fontSize: 14, fontWeight: "700", color: "#fff" },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <View style={s.sheetHdr}>
              <Text style={s.sheetTitle}>Date Range</Text>
              <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: c.t2 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
              <Text style={s.secLbl}>Presets</Text>
              {RANGE_PRESETS.map((p) => {
                const isActive = p.label === label;
                return (
                  <TouchableOpacity key={p.label} style={[s.preset, isActive && s.presetA]}
                    onPress={() => onChange(p.range(today), p.label)} activeOpacity={0.7}>
                    <Text style={[s.presetTxt, isActive && s.presetTxtA]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
              <View style={s.divider} />
              <Text style={s.secLbl}>Custom range</Text>
              <View style={s.customRow}>
                <Text style={s.customLbl}>From</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setFromOpen(true)} activeOpacity={0.7}>
                  <Text style={s.dateTxt}>{fmtShort(customFrom)}</Text>
                </TouchableOpacity>
              </View>
              <View style={s.customRow}>
                <Text style={s.customLbl}>To</Text>
                <TouchableOpacity style={s.dateBtn} onPress={() => setToOpen(true)} activeOpacity={0.7}>
                  <Text style={s.dateTxt}>{fmtShort(customTo)}</Text>
                </TouchableOpacity>
              </View>
              {err ? <Text style={s.errTxt}>{err}</Text> : null}
              <TouchableOpacity style={s.applyBtn} onPress={applyCustom} activeOpacity={0.8}>
                <Text style={s.applyTxt}>Apply custom range</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
      <DatePickerModal visible={fromOpen} value={customFrom} max={customTo}
        onChange={(v) => { setCustomFrom(v); setFromOpen(false); setErr(null); }}
        onClose={() => setFromOpen(false)} />
      <DatePickerModal visible={toOpen} value={customTo} min={customFrom} max={today}
        onChange={(v) => { setCustomTo(v); setToOpen(false); setErr(null); }}
        onClose={() => setToOpen(false)} />
    </Modal>
  );
}
