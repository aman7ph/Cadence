import { StyleSheet, Text } from "react-native";
import { useColors } from "../../lib/theme";
import { display } from "../../lib/fonts";

/**
 * The heading at the top of a sheet.
 *
 * Five sheets declared this themselves and had **drifted into two versions**:
 * the three older ones used 16px sans-bold, while `TodayAddTaskModal` and
 * `ConfirmSheet` — written during the redesign — used Lora 17. The display face
 * is the redesigned one, so it wins; see the refactor log, since unifying them
 * is the one visible change in that step.
 */
export function SheetTitle({ children }: { children: string }) {
  const c = useColors();
  const s = StyleSheet.create({
    title: {
      ...display("semibold"),
      fontSize: 17,
      color: c.t1,
      paddingHorizontal: 20,
      paddingTop: 4,
    },
  });
  return <Text style={s.title}>{children}</Text>;
}
