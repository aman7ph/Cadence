import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { DatePickerGrid } from "./DatePickerGrid";
import { Sheet } from "./ui/Sheet";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toStr(y: number, m: number, d: number) {
  return `${y}-${pad(m)}-${pad(d)}`;
}

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
  value: string; // YYYY-MM-DD
  min?: string; // YYYY-MM-DD
  max?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  onClose: () => void;
}

export function DatePickerModal({
  visible,
  value,
  min,
  max,
  onChange,
  onClose,
}: Props) {
  const c = useColors();
  const [viewYear, setViewYear] = useState(() => parseInt(value.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => parseInt(value.slice(5, 7)));

  const days = getCalendarDays(viewYear, viewMonth);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

  function prevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else setViewMonth((m) => m + 1);
  }

  const s = StyleSheet.create({
    hdr: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    navBtn: {
      width: 36,
      height: 36,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: c.bd2,
      alignItems: "center",
      justifyContent: "center",
    },
    navTxt: { fontSize: 16, color: c.t1, fontWeight: "500" },
    monthTxt: { fontSize: 15, fontWeight: "700", color: c.t1 },
  });

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={s.hdr}>
        <TouchableOpacity
          style={s.navBtn}
          onPress={prevMonth}
          activeOpacity={0.7}
        >
          <Text style={s.navTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={s.monthTxt}>
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
        </Text>
        <TouchableOpacity
          style={s.navBtn}
          onPress={nextMonth}
          activeOpacity={0.7}
        >
          <Text style={s.navTxt}>›</Text>
        </TouchableOpacity>
      </View>
      <DatePickerGrid
        rows={rows}
        toDateStr={(day) => toStr(viewYear, viewMonth, day)}
        value={value}
        min={min}
        max={max}
        onPick={(date) => {
          onChange(date);
          onClose();
        }}
      />
    </Sheet>
  );
}
