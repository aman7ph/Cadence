import { Text } from "react-native";
import { parseMentionSegments } from "@cadence/shared";
import { useColors } from "../lib/theme";

interface Props {
  text: string;
  routineIds: string[];
  taskIds: string[];
  /** 14/22 in the Today card, 13/20 in the compact history detail. */
  fontSize?: number;
  lineHeight?: number;
}

/**
 * Reflection prose with its `@` mentions coloured — routines in the accent,
 * tasks in the carryover neutral, matching web's rendered tags.
 *
 * Both callers had their own copy and they disagreed: the history one handled
 * a mention whose entity no longer exists (falling back to `t2`), the Today one
 * coloured it as a task. This keeps the fallback, so a mention of a deleted
 * item no longer claims to be a task.
 */
export function MentionText({
  text,
  routineIds,
  taskIds,
  fontSize = 14,
  lineHeight = 22,
}: Props) {
  const c = useColors();
  const rSet = new Set(routineIds);
  const tSet = new Set(taskIds);

  return (
    <Text style={{ fontSize, lineHeight }}>
      {parseMentionSegments(text).map((seg, i) =>
        seg.kind === "text" ? (
          <Text key={i} style={{ color: c.t1 }}>
            {seg.value}
          </Text>
        ) : (
          <Text
            key={i}
            style={{
              color: rSet.has(seg.id)
                ? c.tacc
                : tSet.has(seg.id)
                  ? c.carry
                  : c.t2,
              fontWeight: "600",
            }}
          >
            {seg.name}
          </Text>
        ),
      )}
    </Text>
  );
}
