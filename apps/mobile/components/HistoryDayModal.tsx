import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  ActivityIndicator, Modal, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../lib/theme";
import { fmtLong } from "../lib/dateUtils";
import { parseMentionSegments } from "./ReflectionEditor";

interface Props { date: string | null; today: string; onClose: () => void }

function MentionText({ text, routineIds, taskIds }: { text: string; routineIds: string[]; taskIds: string[] }) {
  const c = useColors();
  const rSet = new Set(routineIds), tSet = new Set(taskIds);
  return (
    <Text style={{ fontSize: 13, lineHeight: 20 }}>
      {parseMentionSegments(text).map((seg, i) =>
        seg.kind === "text"
          ? <Text key={i} style={{ color: c.t1 }}>{seg.value}</Text>
          : <Text key={i} style={{ color: rSet.has(seg.id) ? "#818cf8" : tSet.has(seg.id) ? "#fbbf24" : c.t2, fontWeight: "600" }}>{seg.name}</Text>
      )}
    </Text>
  );
}

function DayModalContent({ date, today, onClose }: { date: string; today: string; onClose: () => void }) {
  const c = useColors();
  const day = useQuery(api.days.getDay, { date });
  const isPast = date < today;

  const s = StyleSheet.create({
    screen:    { flex: 1, backgroundColor: c.bg },
    hdr:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 6,
                 paddingBottom: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: c.bd1 },
    hMeta:     { flex: 1 },
    hLabel:    { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.9, color: c.t3 },
    hDate:     { fontSize: 15, fontWeight: "600", color: c.t1, marginTop: 2 },
    closeBtn:  { width: 34, height: 34, borderRadius: 17, backgroundColor: c.card,
                 borderWidth: 1, borderColor: c.bd2, alignItems: "center", justifyContent: "center" },
    closeTxt:  { fontSize: 13, fontWeight: "600", color: c.t2 },
    content:   { paddingBottom: 40 },
    secHdr:    { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline",
                 paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
                 borderBottomWidth: 1, borderBottomColor: c.bd1 },
    secLbl:    { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7, color: c.t3 },
    secCnt:    { fontSize: 11, color: c.t3 },
    item:      { marginHorizontal: 16, marginBottom: 4, backgroundColor: c.card, borderWidth: 1,
                 borderColor: c.bd1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
    iRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
    dot:       { width: 8, height: 8, borderRadius: 4 },
    iName:     { flex: 1, fontSize: 13, color: c.t1 },
    iStatus:   { fontSize: 11, color: c.t3 },
    italic:    { fontSize: 13, color: c.t3, fontStyle: "italic", paddingHorizontal: 16, paddingTop: 8 },
    emptyBox:  { margin: 24, borderWidth: 1, borderStyle: "dashed", borderColor: c.bd1,
                 borderRadius: 12, paddingVertical: 36, alignItems: "center" },
    emptyTxt:  { fontSize: 13, color: c.t3 },
    refCard:   { marginHorizontal: 16, backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
                 borderRadius: 12, padding: 14 },
    refEmpty:  { marginHorizontal: 16, borderWidth: 1, borderStyle: "dashed", borderColor: c.bd1,
                 borderRadius: 12, padding: 14 },
    refEmpty2: { fontSize: 13, color: c.t3, fontStyle: "italic" },
  });

  const routines     = day?.routines ?? [];
  const allTasks     = day?.randomTasks ?? [];
  const visibleTasks = allTasks.filter((t) => t.status !== "dismissed");
  const rDone        = routines.filter((r) => r.status === "completed").length;
  const tDone        = visibleTasks.filter((t) => t.status === "completed").length;
  const isEmpty      = day !== undefined && day !== null && routines.length === 0 && visibleTasks.length === 0;

  const ROUTINE_DOT: Record<string, string> = { completed: c.cplt, skipped: c.carry, pending: c.bd3 };

  return (
    <SafeAreaView style={s.screen} edges={["top", "bottom"]}>
      <View style={s.hdr}>
        <View style={s.hMeta}>
          <Text style={s.hLabel}>{date === today ? "Today" : isPast ? "Past day" : ""}</Text>
          <Text style={s.hDate} numberOfLines={1}>{fmtLong(date)}</Text>
        </View>
        <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={s.closeTxt}>✕</Text>
        </TouchableOpacity>
      </View>

      {day === undefined ? (
        <ActivityIndicator color={c.prim} style={{ marginTop: 32 }} />
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          {isEmpty ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyTxt}>{isPast ? "Nothing was tracked on this day." : "Nothing yet today."}</Text>
            </View>
          ) : (
            <>
              {/* Routines */}
              <View style={s.secHdr}>
                <Text style={s.secLbl}>Routines</Text>
                <Text style={s.secCnt}>{rDone}/{routines.length}</Text>
              </View>
              {routines.length === 0
                ? <Text style={s.italic}>None scheduled</Text>
                : routines.map((r) => (
                    <View key={r.routineId} style={s.item}>
                      <View style={s.iRow}>
                        <View style={[s.dot, { backgroundColor: ROUTINE_DOT[r.status] ?? c.bd3 }]} />
                        <Text style={s.iName}>{r.name}</Text>
                        <Text style={s.iStatus}>{r.status}</Text>
                      </View>
                    </View>
                  ))}

              {/* Tasks */}
              <View style={[s.secHdr, { marginTop: 8 }]}>
                <Text style={s.secLbl}>Tasks</Text>
                <Text style={s.secCnt}>{tDone}/{visibleTasks.length}</Text>
              </View>
              {visibleTasks.length === 0
                ? <Text style={s.italic}>No tasks</Text>
                : visibleTasks.map((t) => (
                    <View key={t.taskId} style={s.item}>
                      <View style={s.iRow}>
                        <View style={[s.dot, { backgroundColor: t.status === "completed" ? "#818cf8" : c.bd3 }]} />
                        <Text style={s.iName}>{t.title}</Text>
                        <Text style={s.iStatus}>{t.status}</Text>
                      </View>
                    </View>
                  ))}
            </>
          )}

          {/* Reflection */}
          <View style={s.secHdr}>
            <Text style={s.secLbl}>Reflection</Text>
          </View>
          {day?.reflection ? (
            <View style={s.refCard}>
              <MentionText
                text={day.reflection.text}
                routineIds={day.reflection.taggedRoutineIds as string[]}
                taskIds={day.reflection.taggedTaskIds as string[]}
              />
            </View>
          ) : (
            <View style={s.refEmpty}>
              <Text style={s.refEmpty2}>No reflection written for this day.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export function HistoryDayModal({ date, today, onClose }: Props) {
  return (
    <Modal visible={!!date} animationType="slide" onRequestClose={onClose}>
      {date && <DayModalContent date={date} today={today} onClose={onClose} />}
    </Modal>
  );
}
