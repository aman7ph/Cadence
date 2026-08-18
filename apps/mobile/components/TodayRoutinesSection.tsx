import { StyleSheet, Text, View } from "react-native";
import { RoutineItem } from "./RoutineItem";
import type { Routine } from "./RoutineItem";
import { useColors } from "../lib/theme";
import { SectionLabel } from "./ui/SectionLabel";
import { radii } from "../lib/radii";

interface Props {
  routines: Routine[];
  date: string;
  isPast: boolean;
}

export function TodayRoutinesSection({ routines, date, isPast }: Props) {
  const c = useColors();
  // Skips are excused here too, so this counter matches the score above it.
  const counted = routines.filter((r) => r.status !== "skipped");
  const done = counted.filter((r) => r.status === "completed").length;

  const s = StyleSheet.create({
    section:  { marginHorizontal: 16, marginBottom: 20, gap: 10 },
    head:     { paddingVertical: 6 },
    empty:    { borderWidth: 1, borderColor: c.bd1, borderStyle: "dashed",
                borderRadius: radii.md, paddingVertical: 24, alignItems: "center" },
    emptyTxt: { fontSize: 13, color: c.t3 },
  });

  return (
    <View style={s.section}>
      <View style={s.head}>
        <SectionLabel count={counted.length > 0 ? `${done}/${counted.length}` : undefined}>
          Routines
        </SectionLabel>
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
