import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { useColors } from "../lib/theme";

interface Mentionable { id: string; name: string; type: "routine" | "task" }

interface Props {
  initialText: string;
  routines: { routineId: Id<"routines">; name: string }[];
  tasks:    { taskId: Id<"dailyTasks">; title: string }[];
  onSave:   (text: string, tags: { entityId: string; entityType: "task" | "routine" }[]) => void;
  onCancel: () => void;
}

export type MentionSegment =
  | { kind: "text"; value: string }
  | { kind: "mention"; name: string; id: string };

export function parseMentionSegments(text: string): MentionSegment[] {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const out: MentionSegment[] = [];
  let last = 0; let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: "text", value: text.slice(last, m.index) });
    out.push({ kind: "mention", name: m[1]!, id: m[2]! });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}

export function parseTagsFromText(
  text: string,
  routines: { routineId: string; name: string }[],
  tasks:    { taskId: string; title: string }[],
): { entityId: string; entityType: "task" | "routine" }[] {
  const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const tags: { entityId: string; entityType: "task" | "routine" }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const id = m[2]!;
    if (routines.some((r) => r.routineId === id)) tags.push({ entityId: id, entityType: "routine" });
    else if (tasks.some((t) => t.taskId === id))  tags.push({ entityId: id, entityType: "task" });
  }
  return tags;
}

export function ReflectionEditor({ initialText, routines, tasks, onSave, onCancel }: Props) {
  const c = useColors();
  const [text, setText]       = useState(initialText);
  const [query, setQuery]     = useState<string | null>(null);
  const [menuIdx, setMenuIdx] = useState(0);
  const cursorRef             = useRef(0);

  const mentionables: Mentionable[] = [
    ...routines.map((r) => ({ id: r.routineId as string, name: r.name, type: "routine" as const })),
    ...tasks.map((t)    => ({ id: t.taskId as string, name: t.title, type: "task" as const })),
  ];
  const filtered = query === null ? [] : mentionables.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  const handleChange = (val: string) => {
    setText(val);
    const before = val.slice(0, cursorRef.current);
    const m = before.match(/@([^@\[\]()]*?)$/);
    if (m) { setQuery(m[1]!); setMenuIdx(0); } else { setQuery(null); }
  };

  const insertMention = (item: Mentionable) => {
    const cursor = cursorRef.current;
    const m = text.slice(0, cursor).match(/@([^@\[\]()]*?)$/);
    if (!m) return;
    const start = cursor - m[0].length;
    setText(text.slice(0, start) + `@[${item.name}](${item.id})` + text.slice(cursor));
    setQuery(null);
  };

  const save = () => onSave(text, parseTagsFromText(text, routines, tasks));

  const s = StyleSheet.create({
    input:          { color: c.t1, fontSize: 14, lineHeight: 22,
                      paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10, minHeight: 96 },
    menu:           { backgroundColor: c.bgE, borderWidth: 1, borderColor: c.bd2,
                      borderRadius: 10, marginHorizontal: 14, marginBottom: 4, overflow: "hidden" },
    menuItem:       { flexDirection: "row", alignItems: "center", gap: 8,
                      paddingHorizontal: 12, paddingVertical: 10 },
    menuItemActive: { backgroundColor: c.active },
    typeDot:        { width: 7, height: 7, borderRadius: 4 },
    dotRoutine:     { backgroundColor: "#818cf8" },
    dotTask:        { backgroundColor: "#fbbf24" },
    menuTxt:        { flex: 1, fontSize: 13, color: c.t1 },
    menuType:       { fontSize: 10, color: c.t3 },
    actions:        { flexDirection: "row", justifyContent: "flex-end", gap: 8,
                      paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4 },
    cancelBtn:      { paddingHorizontal: 14, paddingVertical: 8 },
    cancelTxt:      { fontSize: 13, color: c.t3 },
    saveBtn:        { backgroundColor: c.prim, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
    saveTxt:        { fontSize: 13, fontWeight: "600", color: "#fff" },
  });

  return (
    <View>
      {query !== null && filtered.length > 0 && (
        <View style={s.menu}>
          <ScrollView keyboardShouldPersistTaps="always" style={{ maxHeight: 160 }}>
            {filtered.map((item, i) => (
              <TouchableOpacity key={item.id} onPress={() => insertMention(item)}
                style={[s.menuItem, i === menuIdx && s.menuItemActive]}>
                <View style={[s.typeDot, item.type === "routine" ? s.dotRoutine : s.dotTask]} />
                <Text style={s.menuTxt}>{item.name}</Text>
                <Text style={s.menuType}>{item.type}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <TextInput style={s.input} value={text} onChangeText={handleChange}
        onSelectionChange={(e) => { cursorRef.current = e.nativeEvent.selection.start; }}
        placeholder={"How did today go? Type @ to tag a task or routine."}
        placeholderTextColor={c.t3} multiline textAlignVertical="top" />
      <View style={s.actions}>
        <TouchableOpacity onPress={onCancel} style={s.cancelBtn} activeOpacity={0.7}>
          <Text style={s.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={save} style={s.saveBtn} activeOpacity={0.8}>
          <Text style={s.saveTxt}>Save reflection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
