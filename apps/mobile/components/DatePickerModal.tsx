import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function pad(n: number) { return String(n).padStart(2, "0"); }
function toStr(y: number, m: number, d: number) { return `${y}-${pad(m)}-${pad(d)}`; }

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const total = new Date(year, month, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= total; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

interface Props {
  visible: boolean;
  value: string;   // YYYY-MM-DD
  min?: string;    // YYYY-MM-DD
  max?: string;    // YYYY-MM-DD
  onChange: (date: string) => void;
  onClose: () => void;
}

export function DatePickerModal({ visible, value, min, max, onChange, onClose }: Props) {
  const c = useColors();
  const [viewYear, setViewYear]   = useState(() => parseInt(value.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => parseInt(value.slice(5, 7)));

  const days = getCalendarDays(viewYear, viewMonth);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

  function prevMonth() {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  }

  const s = StyleSheet.create({
    overlay:  { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
    backdrop: { flex: 1 },
    sheet:    { backgroundColor: c.bgE, borderTopLeftRadius: 22, borderTopRightRadius: 22,
                borderWidth: 1, borderBottomWidth: 0, borderColor: c.bd2, paddingBottom: 28 },
    handle:   { width: 38, height: 4, borderRadius: 2, backgroundColor: c.bd3, alignSelf: "center", marginTop: 10, marginBottom: 8 },
    hdr:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
    navBtn:   { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: c.bd2, alignItems: "center", justifyContent: "center" },
    navTxt:   { fontSize: 16, color: c.t1, fontWeight: "500" },
    monthTxt: { fontSize: 15, fontWeight: "700", color: c.t1 },
    dayRow:   { flexDirection: "row", paddingHorizontal: 12, marginBottom: 6 },
    dayLbl:   { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "600", color: c.t3, letterSpacing: 0.3 },
    row:      { flexDirection: "row", paddingHorizontal: 12, marginBottom: 4 },
    cell:     { flex: 1, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    cellSel:  { backgroundColor: c.prim },
    cellTxt:  { fontSize: 14, color: c.t1 },
    cellSelTxt:{ fontSize: 14, color: "#fff", fontWeight: "700" },
    cellDim:  { opacity: 0.22 },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.hdr}>
            <TouchableOpacity style={s.navBtn} onPress={prevMonth} activeOpacity={0.7}>
              <Text style={s.navTxt}>‹</Text>
            </TouchableOpacity>
            <Text style={s.monthTxt}>{MONTH_NAMES[viewMonth - 1]} {viewYear}</Text>
            <TouchableOpacity style={s.navBtn} onPress={nextMonth} activeOpacity={0.7}>
              <Text style={s.navTxt}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={s.dayRow}>
            {DAY_LABELS.map((d) => <Text key={d} style={s.dayLbl}>{d}</Text>)}
          </View>
          {rows.map((row, ri) => (
            <View key={ri} style={s.row}>
              {row.map((day, di) => {
                if (!day) return <View key={di} style={s.cell} />;
                const dateStr = toStr(viewYear, viewMonth, day);
                const isSel    = dateStr === value;
                const disabled = (min != null && dateStr < min) || (max != null && dateStr > max);
                return (
                  <TouchableOpacity key={di} style={[s.cell, isSel && s.cellSel, disabled && s.cellDim]}
                    activeOpacity={0.7} onPress={() => { if (!disabled) { onChange(dateStr); onClose(); } }}>
                    <Text style={isSel ? s.cellSelTxt : s.cellTxt}>{day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}
