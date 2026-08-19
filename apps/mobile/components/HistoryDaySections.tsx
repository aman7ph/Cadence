import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { SectionLabel } from "./ui/SectionLabel";

interface DayItem {
  id: string;
  name: string;
  status: string;
}

/**
 * One read-only line on a past day: a status dot, the name, the status word.
 *
 * The routines and tasks lists were written out separately and were identical
 * apart from which colour the dot took, so the colour is the only prop that
 * differs.
 */
function DayItemRow({
  name,
  status,
  dot,
}: {
  name: string;
  status: string;
  dot: string;
}) {
  const c = useColors();
  const s = StyleSheet.create({
    item: {
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd1,
      borderRadius: radii.sm,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    row: { flexDirection: "row", alignItems: "center", gap: 8 },
    dot: { width: 8, height: 8, borderRadius: radii.full },
    name: { flex: 1, fontSize: 13, color: c.t1 },
    status: { fontSize: 11, color: c.t3 },
  });

  return (
    <View style={s.item}>
      <View style={s.row}>
        <View style={[s.dot, { backgroundColor: dot }]} />
        <Text style={s.name}>{name}</Text>
        <Text style={s.status}>{status}</Text>
      </View>
    </View>
  );
}

export function DaySection({
  title,
  done,
  total,
  items,
  emptyLabel,
  dotFor,
}: {
  title: string;
  done: number;
  total: number;
  items: DayItem[];
  emptyLabel: string;
  dotFor: (status: string) => string;
}) {
  const c = useColors();
  const s = StyleSheet.create({
    hdr: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },
    italic: {
      fontSize: 13,
      color: c.t3,
      fontStyle: "italic",
      paddingHorizontal: 16,
      paddingTop: 8,
    },
  });

  return (
    <>
      <View style={s.hdr}>
        <SectionLabel count={`${done}/${total}`}>{title}</SectionLabel>
      </View>
      {items.length === 0 ? (
        <Text style={s.italic}>{emptyLabel}</Text>
      ) : (
        items.map((it) => (
          <DayItemRow
            key={it.id}
            name={it.name}
            status={it.status}
            dot={dotFor(it.status)}
          />
        ))
      )}
    </>
  );
}
