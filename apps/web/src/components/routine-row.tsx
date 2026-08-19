import { useState } from "react";
import { useRoutineRowActions } from "@/lib/use-routine-row-actions";
import { Target } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id, Doc } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";

import { Badge } from "@/components/ui/badge";
import { RowBody } from "@/components/ui/row-body";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { StreakBadge } from "@/components/ui/streak-badge";
import { RepeatControl } from "@/components/repeat-control";
import { RoutineRowMenu } from "@/components/routine-row-menu";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
import { useRoutineArchive } from "@/lib/use-routine-archive";
import { scheduleLabel } from "./routines-schedule-form";
import { useCountdown } from "@/lib/use-countdown";
import { cn } from "@/lib/utils";

interface RoutineRowProps {
  routineId: Id<"routines">;
  name: string;
  description?: string;
  scheduleType: Doc<"routines">["scheduleType"];
  customDays?: number[];
  status: "completed" | "skipped" | "pending";
  currentStreak: number;
  viewedDate: string;
  goalTitle?: string;
  readOnly?: boolean;
  repeatTarget?: number;
  repeatDoneToday?: number;
  nextRepAllowedAt?: number;
}

export function RoutineRow({
  routineId,
  name,
  description,
  scheduleType,
  customDays,
  status,
  currentStreak,
  viewedDate,
  goalTitle,
  readOnly,
  repeatTarget,
  repeatDoneToday = 0,
  nextRepAllowedAt,
}: RoutineRowProps) {
  const isRepeat = repeatTarget !== undefined;
  const remaining = useCountdown(nextRepAllowedAt);
  const gated = remaining > 0;

  const { error, setError, fail, toggle, handleSkip, undoRep, archiveAction } =
    useRoutineRowActions({ routineId, viewedDate, status, isRepeat, gated });

  const meta = description?.trim()
    ? description
    : scheduleLabel(scheduleType, customDays);
  const ariaLabel = isRepeat
    ? `Log a check-in for ${name} (${repeatDoneToday} of ${repeatTarget} done)`
    : `Mark ${name} ${status === "completed" ? "incomplete" : "complete"}`;

  return (
    <div
      className={cn(
        "group flex items-center gap-3.5 rounded-sm border border-[var(--border-subtle)] bg-card px-3 py-2.5 transition-colors duration-150",
        status === "skipped"
          ? "opacity-55"
          : "hover:shadow-[var(--shadow-md)] hover:-translate-y-px",
      )}
    >
      <CompletionToggle
        state={status}
        onToggle={readOnly ? () => {} : toggle}
        disabled={readOnly || (isRepeat && gated)}
        className={cn(isRepeat && gated && "opacity-40")}
        ariaLabel={ariaLabel}
      />
      <RowBody
        title={name}
        meta={meta}
        error={error}
        goalTitle={goalTitle}
        completed={status === "completed"}
      />
      <div className="flex items-center gap-2 shrink-0">
        {isRepeat && (
          <RepeatControl
            doneToday={repeatDoneToday}
            target={repeatTarget}
            remaining={remaining}
            onUndo={() => {
              setError(null);
              void undoRep({
                routineId,
                date: viewedDate,
                today: todayLocal(),
              }).catch(fail);
            }}
            readOnly={readOnly}
          />
        )}
        {status === "skipped" ? (
          <Badge tone="neutral">Skipped</Badge>
        ) : (
          <StreakBadge count={currentStreak} size="sm" />
        )}
        {!readOnly && (
          <RoutineRowMenu
            isSkipped={status === "skipped"}
            onSkipToggle={handleSkip}
            onArchive={archiveAction.request}
          />
        )}
      </div>

      <ConfirmDrawer {...archiveAction.drawerProps} />
    </div>
  );
}
