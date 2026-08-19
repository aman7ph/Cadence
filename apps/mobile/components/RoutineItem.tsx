import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { todayLocal } from "@cadence/shared";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import * as Haptics from "expo-haptics";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { useRepeatRow } from "../lib/useRepeatRow";
import { ActionSheet } from "./ActionSheet";
import { ConfirmSheet } from "./ui/ConfirmSheet";
import { RepeatControl } from "./RepeatControl";
import { StreakPill } from "./StreakPill";
import { CompletionCircle } from "./ui/CompletionCircle";
import { useRoutineRowActions } from "../lib/useRoutineRowActions";
import { RowShell } from "./ui/RowShell";
import { scheduleLabel, type ScheduleType } from "./SchedulePicker";

export interface Routine {
  routineId: Id<"routines">;
  name: string;
  description?: string;
  scheduleType: string;
  customDays?: number[];
  status: "pending" | "completed" | "skipped";
  currentStreak: number;
  longestStreak: number;
  goalTitle?: string;
  repeatTarget?: number;
  repeatDoneToday?: number;
  nextRepAllowedAt?: number;
}

interface Props {
  routine: Routine;
  date: string;
  readOnly?: boolean;
}

export function RoutineItem({ routine, date, readOnly }: Props) {
  const c = useColors();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isRepeat, remaining, gated, error, clearError, fail } = useRepeatRow(
    routine.repeatTarget,
    routine.nextRepAllowedAt,
  );

  const done = routine.status === "completed";
  const skipped = routine.status === "skipped";
  const doneToday = routine.repeatDoneToday ?? 0;
  const meta =
    routine.description?.trim() ||
    scheduleLabel(routine.scheduleType as ScheduleType, routine.customDays);

  const { toggle, menuActions, confirmProps, logRep, undoRep } =
    useRoutineRowActions({
      routineId: routine.routineId,
      date,
      done,
      skipped,
      isRepeat,
      gated,
      readOnly,
      clearError,
      fail,
    });

  const s = StyleSheet.create({
    skipBadge: {
      backgroundColor: c.active,
      borderRadius: radii.pill,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    skipBadgeTxt: { fontSize: 10, color: c.t3 },
    more: { fontSize: 16, color: c.t3, letterSpacing: 1 },
  });

  return (
    <>
      <RowShell
        dimmed={done || skipped}
        toggle={
          <CompletionCircle
            done={done}
            skipped={skipped}
            dimmed={isRepeat && gated}
          />
        }
        onToggle={toggle}
        toggleDisabled={!!readOnly}
        title={routine.name}
        struck={done}
        meta={meta}
        error={error}
        goalTitle={routine.goalTitle}
        right={
          <>
            {isRepeat && (
              <RepeatControl
                doneToday={doneToday}
                target={routine.repeatTarget!}
                remaining={remaining}
                readOnly={readOnly}
                onUndo={() => {
                  clearError();
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  void undoRep({
                    routineId: routine.routineId,
                    date,
                    today: todayLocal(),
                  }).catch(fail);
                }}
              />
            )}
            <StreakPill count={routine.currentStreak} />
            {skipped && (
              <View style={s.skipBadge}>
                <Text style={s.skipBadgeTxt}>Skipped</Text>
              </View>
            )}
            {!readOnly && (
              <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={8}>
                <Text style={s.more}>···</Text>
              </TouchableOpacity>
            )}
          </>
        }
      />
      <ActionSheet
        visible={menuOpen}
        title={routine.name}
        actions={menuActions}
        onCancel={() => setMenuOpen(false)}
      />
      <ConfirmSheet {...confirmProps} />
    </>
  );
}
