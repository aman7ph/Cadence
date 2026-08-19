import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

export interface Mentionable {
  id: string;
  name: string;
  type: "routine" | "task";
}

interface Props {
  items: Mentionable[];
  activeIndex: number;
  onPick: (item: Mentionable) => void;
}

/**
 * The `@` autocomplete list above the reflection field.
 *
 * The type dots follow web's composer: routines take the accent, tasks take
 * `chart3`.
 */
export function MentionMenu({ items, activeIndex, onPick }: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    menu: {
      backgroundColor: c.bgE,
      borderWidth: 1,
      borderColor: c.bd2,
      borderRadius: radii.sm,
      marginHorizontal: 14,
      marginBottom: 4,
      overflow: "hidden",
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    itemActive: { backgroundColor: c.active },
    dot: { width: 7, height: 7, borderRadius: radii.full },
    dotRoutine: { backgroundColor: c.tacc },
    dotTask: { backgroundColor: c.chart3 },
    name: { flex: 1, fontSize: 13, color: c.t1 },
    type: { fontSize: 10, color: c.t3 },
  });

  return (
    <View style={s.menu}>
      {/* nestedScrollEnabled is required on Android: this list sits inside
          Today's page ScrollView, and without it the parent swallows the drag
          so the menu cannot be scrolled to reach later matches. */}
      <ScrollView
        nestedScrollEnabled
        keyboardShouldPersistTaps="always"
        style={{ maxHeight: 200 }}
      >
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onPick(item)}
            style={[s.item, i === activeIndex && s.itemActive]}
          >
            <View
              style={[
                s.dot,
                item.type === "routine" ? s.dotRoutine : s.dotTask,
              ]}
            />
            <Text style={s.name}>{item.name}</Text>
            <Text style={s.type}>{item.type}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
