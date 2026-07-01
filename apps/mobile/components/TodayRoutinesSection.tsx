import { StyleSheet, Text, View } from "react-native";
import { RoutineItem } from "./RoutineItem";
import type { Routine } from "./RoutineItem";
import { useColors } from "../lib/theme";

interface Props {
  routines: Routine[];
  date: string;
  isPast: boolean;
}

export function TodayRoutinesSection({ routines, date, isPast }: Props) {
  const c = useColors();
  const done = routines.filter((r) => r.status === "completed").length;

  const s = StyleSheet.create({
    section:  { marginHorizontal: 16, marginBottom: 20, gap: 6 },
    head:     { flexDirection: "row", justifyContent: "space-between",
                alignItems: "baseline", paddingVertical: 6 },
    lbl:      { fontSize: 11, fontWeight: "700", color: c.t2,
                textTransform: "uppercase", letterSpacing: 0.7 },
    cnt:      { fontSize: 11, color: c.t3 },
    empty:    { borderWidth: 1, borderColor: c.bd1, borderStyle: "dashed",
                borderRadius: 12, paddingVertical: 24, alignItems: "center" },
    emptyTxt: { fontSize: 13, color: c.t3 },
  });

  return (
    <View style={s.section}>
      <View style={s.head}>
        <Text style={s.lbl}>Routines</Text>
        {routines.length > 0 && <Text style={s.cnt}>{done} / {routines.length}</Text>}
      </View>
      {routines.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTxt}>
            {isPast ? "No routines were scheduled." : "Nothing scheduled today."}
          </Text>
        </View>
      ) : (
        routines.map((r) => (
          <RoutineItem key={r.routineId} routine={r} date={date} readOnly={isPast} />
        ))
      )}
    </View>
  );
}
