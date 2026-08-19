import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { ScrollView, StyleSheet, View } from "react-native";
import { FullScreenModal } from "./ui/FullScreenModal";
import { IconButton } from "./ui/IconButton";
import { GoalDetailHeaderCard } from "./GoalDetailHeaderCard";
import { GoalProgressCard } from "./GoalProgressCard";
import { GoalDailyTracking } from "./GoalDailyTracking";
import { GoalDetailSheets } from "./GoalDetailSheets";
import { useGoalDetailUi } from "../lib/useGoalDetailUi";

export interface GoalData {
  _id: Id<"goals">;
  title: string;
  status: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  dueDate?: string;
  createdAt: number;
  completedAt?: number;
}

function GoalDetailContent({
  goal: initGoal,
  onClose,
}: {
  goal: GoalData;
  onClose: () => void;
}) {
  const today = todayLocal();
  const linked = useQuery(api.goalLinks.getLinkedItems, {
    goalId: initGoal._id,
  });
  const goal = (linked?.goal ?? initGoal) as GoalData;
  const ui = useGoalDetailUi(today, goal.createdAt, goal.completedAt);

  const day = useQuery(api.goalLinks.getDayForGoal, {
    goalId: initGoal._id,
    date: ui.selDate,
  });

  // Progress is summed from linked tasks rather than read off the goal: the
  // stored currentValue is a write-time cache and the linked list is the truth.
  const currentValue = (linked?.tasks ?? [])
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + (t.goalContribution ?? 0), 0);

  const s = StyleSheet.create({
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 10,
      gap: 8,
    },
    spacer: { flex: 1 },
    content: { paddingBottom: 40 },
  });

  return (
    <>
      <View style={s.topRow}>
        <IconButton glyph="✕" onPress={onClose} accessibilityLabel="Close" />
        <View style={s.spacer} />
        <IconButton
          glyph="•••"
          onPress={ui.openMenu}
          accessibilityLabel="Goal actions"
        />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <GoalDetailHeaderCard
          title={goal.title}
          status={goal.status}
          description={goal.description}
          dueDate={goal.dueDate}
          createdAt={goal.createdAt}
          onRequestComplete={() => ui.setConfirm("complete")}
          onRequestAbandon={() => ui.setConfirm("abandon")}
        />

        {goal.targetValue != null && (
          <GoalProgressCard
            currentValue={currentValue}
            targetValue={goal.targetValue}
            unit={goal.unit}
          />
        )}

        <GoalDailyTracking
          selDate={ui.selDate}
          minDate={ui.minDate}
          maxDate={ui.maxDate}
          onPrev={() => ui.stepDay(-1)}
          onNext={() => ui.stepDay(1)}
          onOpenPicker={ui.openPicker}
          routines={day?.routines ?? []}
          tasks={day?.tasks ?? []}
          loading={day === undefined}
        />
      </ScrollView>

      <GoalDetailSheets
        goalId={initGoal._id}
        goal={goal}
        ui={ui}
        onDone={onClose}
      />
    </>
  );
}

export function GoalDetailModal({
  goal,
  onClose,
}: {
  goal: GoalData | null;
  onClose: () => void;
}) {
  return (
    <FullScreenModal visible={!!goal} onClose={onClose}>
      {goal && <GoalDetailContent goal={goal} onClose={onClose} />}
    </FullScreenModal>
  );
}
