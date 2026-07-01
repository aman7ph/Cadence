import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";

interface TrackingRoutine { routineId: string; name: string; status: string }
interface TrackingTask    { taskId: string; title: string; status: string }

interface Props {
  selDate: string;
  minDate: string;
  maxDate: string;
  onPrev: () => void;
  onNext: () => void;
  onOpenPicker: () => void;
  routines: TrackingRoutine[];
  tasks: TrackingTask[];
  loading: boolean;
}

export function GoalDailyTracking({ selDate, minDate, maxDate, onPrev, onNext, onOpenPicker, routines, tasks, loading }: Props) {
  const c = useColors();
  const s = StyleSheet.create({
    sHead:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                 paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
    sLbl:      { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7, color: c.t2 },
    navRow:    { flexDirection: "row", alignItems: "center", gap: 2 },
    navBtn:    { padding: 6 },
    navTxt:    { fontSize: 18, color: c.t2 },
    navDate:   { fontSize: 12, color: c.t3, minWidth: 76, textAlign: "center" },
    calBtn:    { width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: c.bd2,
                 alignItems: "center", justifyContent: "center", marginLeft: 4 },
    item:      { marginHorizontal: 16, marginBottom: 4, backgroundColor: c.card, borderWidth: 1,
                 borderColor: c.bd1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
    iRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
    dot:       { width: 8, height: 8, borderRadius: 4 },
    iName:     { flex: 1, fontSize: 13, color: c.t1 },
    iTag:      { fontSize: 11, color: c.t3 },
    emptyTxt:  { textAlign: "center", fontSize: 13, color: c.t3, paddingVertical: 20 },
  });

  return (
    <>
      <View style={s.sHead}>
        <Text style={s.sLbl}>Daily tracking</Text>
        <View style={s.navRow}>
          <TouchableOpacity style={s.navBtn} onPress={onPrev} disabled={selDate <= minDate}>
            <Text style={[s.navTxt, selDate <= minDate && { opacity: 0.3 }]}>‹</Text>
          </TouchableOpacity>
          <Text style={s.navDate}>{selDate}</Text>
          <TouchableOpacity style={s.navBtn} onPress={onNext} disabled={selDate >= maxDate}>
            <Text style={[s.navTxt, selDate >= maxDate && { opacity: 0.3 }]}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.calBtn} onPress={onOpenPicker} activeOpacity={0.7}>
            <Text style={{ fontSize: 14 }}>📅</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && <ActivityIndicator color={c.prim} style={{ marginTop: 16 }} />}
      {!loading && routines.length === 0 && tasks.length === 0 && (
        <Text style={s.emptyTxt}>Nothing tracked for this goal on this day.</Text>
      )}
      {routines.map((r) => (
        <View key={r.routineId} style={s.item}>
          <View style={s.iRow}>
            <View style={[s.dot, { backgroundColor: r.status === "completed" ? c.cplt : c.bd3 }]} />
            <Text style={s.iName}>{r.name}</Text>
            <Text style={s.iTag}>routine</Text>
          </View>
        </View>
      ))}
      {tasks.map((t) => (
        <View key={t.taskId} style={s.item}>
          <View style={s.iRow}>
            <View style={[s.dot, { backgroundColor: t.status === "completed" ? "#818cf8" : c.bd3 }]} />
            <Text style={s.iName}>{t.title}</Text>
            <Text style={s.iTag}>task</Text>
          </View>
        </View>
      ))}
    </>
  );
}
