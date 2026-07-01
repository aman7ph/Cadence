import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { ReflectionEditor, parseMentionSegments } from "./ReflectionEditor";
import { useColors } from "../lib/theme";

interface Routine { routineId: Id<"routines">; name: string }
interface Task    { taskId: Id<"dailyTasks">;  title: string }

interface Props {
  date: string; reflection?: { text: string } | null;
  routines: Routine[]; tasks: Task[]; isPast: boolean;
}

function MentionText({ text, routines }: { text: string; routines: Routine[] }) {
  const c = useColors();
  const routineIds = new Set(routines.map((r) => r.routineId as string));
  return (
    <Text style={{ fontSize: 14, color: c.t1, lineHeight: 22 }}>
      {parseMentionSegments(text).map((seg, i) =>
        seg.kind === "text"
          ? <Text key={i}>{seg.value}</Text>
          : <Text key={i} style={routineIds.has(seg.id) ? { color: "#818cf8", fontWeight: "600" } : { color: "#fbbf24", fontWeight: "600" }}>{seg.name}</Text>
      )}
    </Text>
  );
}

function taggedEntities(text: string, routines: Routine[]) {
  const routineIds = new Set(routines.map((r) => r.routineId as string));
  const seen = new Set<string>();
  return parseMentionSegments(text)
    .filter((s) => s.kind === "mention" && !seen.has(s.id) && !!seen.add(s.id))
    .map((s) => s.kind === "mention" ? { id: s.id, name: s.name, type: routineIds.has(s.id) ? "routine" as const : "task" as const } : null)
    .filter((x) => x !== null);
}

export function ReflectionCard({ date, reflection, routines, tasks, isPast }: Props) {
  if (isPast && !reflection) return null;
  const c = useColors();
  const upsert = useMutation(api.reflections.upsert);
  const [mode, setMode] = useState<"view" | "edit">(() => reflection ? "view" : "edit");
  const savedText = reflection?.text ?? "";

  const handleSave = async (text: string, tags: { entityId: string; entityType: "task" | "routine" }[]) => {
    await upsert({ date, text, tags }); setMode("view");
  };

  const tagged = taggedEntities(savedText, routines);

  const s = StyleSheet.create({
    card:       { backgroundColor: c.card, borderWidth: 1, borderColor: c.bd1,
                  borderRadius: 16, overflow: "hidden", marginHorizontal: 16, marginTop: 8, marginBottom: 24 },
    topBar:     { height: 3, backgroundColor: c.prim },
    head:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                  paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
    label:      { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.7, color: c.t2 },
    editBtn:    { fontSize: 12, fontWeight: "600", color: c.tacc },
    viewBody:   { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4 },
    tagList:    { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
    tagPill:    { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
    tagPillR:   { backgroundColor: "rgba(129,140,248,0.14)" },
    tagPillT:   { backgroundColor: "rgba(251,191,36,0.14)" },
    tagPillTxt: { fontSize: 11, fontWeight: "600" },
    tagTxtR:    { color: "#818cf8" },
    tagTxtT:    { color: "#fbbf24" },
  });

  return (
    <View style={s.card}>
      <View style={s.topBar} />
      <View style={s.head}>
        <Text style={s.label}>Reflection</Text>
        {mode === "view" && !isPast && (
          <TouchableOpacity onPress={() => setMode("edit")} hitSlop={8}>
            <Text style={s.editBtn}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
      {mode === "view" ? (
        <View style={s.viewBody}>
          <MentionText text={savedText} routines={routines} />
          {tagged.length > 0 && (
            <View style={s.tagList}>
              {tagged.map((t) => (
                <View key={t.id} style={[s.tagPill, t.type === "routine" ? s.tagPillR : s.tagPillT]}>
                  <Text style={[s.tagPillTxt, t.type === "routine" ? s.tagTxtR : s.tagTxtT]}>{t.name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <ReflectionEditor initialText={savedText} routines={routines} tasks={tasks}
          onSave={handleSave} onCancel={() => { if (savedText) setMode("view"); }} />
      )}
    </View>
  );
}
