import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import {
  type Mention,
  parseMentionSegments,
  tagsFromStored,
  toEditorText,
  toStoredText,
} from "@cadence/shared";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

interface Mentionable { id: string; name: string; type: "routine" | "task" }

interface Props {
  initialText: string;
  routines: { routineId: Id<"routines">; name: string }[];
  tasks:    { taskId: Id<"dailyTasks">; title: string }[];
  onSave:   (text: string, tags: { entityId: string; entityType: "task" | "routine" }[]) => void;
  onCancel: () => void;
}

// Re-exported so the read-only renderers keep their import path.
export { parseMentionSegments } from "@cadence/shared";
export type { MentionSegment } from "@cadence/shared";

export function ReflectionEditor({ initialText, routines, tasks, onSave, onCancel }: Props) {
  const c = useColors();
  // The editor holds the READABLE form (`@Name`); the stored form carries the
  // id and is rebuilt on save. Binding straight to storage is what put
  // `@[Name](jn77h2ks…)` in front of the user.
  const initial = toEditorText(initialText);
  const [text, setText]       = useState(initial.text);
  const [mentions, setMentions] = useState<Mention[]>(initial.mentions);
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
    setText(text.slice(0, start) + `@${item.name}` + text.slice(cursor));
    setMentions((prev) =>
      prev.some((x) => x.id === item.id) ? prev : [...prev, { id: item.id, name: item.name }],
    );
    setQuery(null);
  };

  const save = () => {
    const stored = toStoredText(text, mentions);
    onSave(
      stored,
      tagsFromStored(stored, routines.map((r) => r.routineId as string), tasks.map((t) => t.taskId as string)),
    );
  };

  const s = StyleSheet.create({
    input:          { color: c.t1, fontSize: 14, lineHeight: 22,
                      paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10, minHeight: 96 },
    menu:           { backgroundColor: c.bgE, borderWidth: 1, borderColor: c.bd2,
                      borderRadius: radii.sm, marginHorizontal: 14, marginBottom: 4, overflow: "hidden" },
    menuItem:       { flexDirection: "row", alignItems: "center", gap: 8,
                      paddingHorizontal: 12, paddingVertical: 10 },
    menuItemActive: { backgroundColor: c.active },
    typeDot:        { width: 7, height: 7, borderRadius: radii.full },
    dotRoutine:     { backgroundColor: c.tacc },
    dotTask:        { backgroundColor: c.chart3 },
    menuTxt:        { flex: 1, fontSize: 13, color: c.t1 },
    menuType:       { fontSize: 10, color: c.t3 },
    actions:        { flexDirection: "row", justifyContent: "flex-end", gap: 8,
                      paddingHorizontal: 14, paddingBottom: 12, paddingTop: 4 },
    cancelBtn:      { paddingHorizontal: 14, paddingVertical: 8 },
    cancelTxt:      { fontSize: 13, color: c.t3 },
    saveBtn:        { backgroundColor: c.prim, borderRadius: radii.sm, paddingHorizontal: 16, paddingVertical: 8 },
    saveTxt:        { fontSize: 13, fontWeight: "600", color: c.onPrim },
  });

  return (
    <View>
      {query !== null && filtered.length > 0 && (
        <View style={s.menu}>
          {/* nestedScrollEnabled is required on Android: this list sits inside
              Today's page ScrollView, and without it the parent swallows the
              drag so the menu cannot be scrolled to reach later matches. */}
          <ScrollView
            nestedScrollEnabled
            keyboardShouldPersistTaps="always"
            style={{ maxHeight: 200 }}
          >
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
