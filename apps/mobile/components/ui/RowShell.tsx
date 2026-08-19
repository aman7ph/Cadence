import type { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../../lib/theme";
import { radii } from "../../lib/radii";
import { GoalTag } from "./GoalTag";

interface Props {
  /** Routine rows centre their controls; task rows top-align, since a task
   *  title can wrap to two lines and the tick should stay by the first. */
  align?: "center" | "flex-start";
  dimmed?: boolean;
  toggle: ReactNode;
  onToggle: () => void;
  toggleDisabled?: boolean;
  title: string;
  titleLines?: number;
  struck?: boolean;
  meta: string;
  error?: string | null;
  goalTitle?: string;
  right?: ReactNode;
}

/**
 * The row shared by Today's routines and tasks: tick, body, trailing controls.
 *
 * Both declared this layout separately and had drifted only in alignment and a
 * pixel of padding — everything else was identical, which is what makes it one
 * component with a prop rather than two.
 */
export function RowShell({
  align = "center",
  dimmed,
  toggle,
  onToggle,
  toggleDisabled,
  title,
  titleLines = 1,
  struck,
  meta,
  error,
  goalTitle,
  right,
}: Props) {
  const c = useColors();
  const top = align === "flex-start";

  const s = StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: align,
      gap: 10,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.bd1,
      borderRadius: radii.sm,
      padding: 12,
    },
    dim: { opacity: 0.55 },
    toggle: { padding: 2, paddingTop: top ? 1 : 2 },
    body: { flex: 1, gap: 2 },
    title: { fontSize: 14, fontWeight: "600", color: c.t1 },
    strike: { textDecorationLine: "line-through", color: c.t3 },
    meta: { fontSize: 12, color: c.t3 },
    err: { fontSize: 12, color: c.danger },
    right: {
      flexDirection: "row",
      alignItems: align,
      gap: 6,
      paddingTop: top ? 1 : 0,
    },
  });

  return (
    <View style={[s.card, dimmed && s.dim]}>
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={6}
        style={s.toggle}
        disabled={toggleDisabled}
      >
        {toggle}
      </TouchableOpacity>
      <View style={s.body}>
        <Text style={[s.title, struck && s.strike]} numberOfLines={titleLines}>
          {title}
        </Text>
        <Text style={s.meta} numberOfLines={1}>
          {meta}
        </Text>
        {error ? (
          <Text style={s.err} numberOfLines={2}>
            {error}
          </Text>
        ) : null}
        {goalTitle ? <GoalTag>{goalTitle}</GoalTag> : null}
      </View>
      {right ? <View style={s.right}>{right}</View> : null}
    </View>
  );
}
