import { useState } from "react";
import { useMutation } from "convex/react";
import { Target } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id, Doc } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";

import { Badge } from "@/components/ui/badge";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { StreakBadge } from "@/components/ui/streak-badge";
import { RepeatControl } from "@/components/repeat-control";
import { RoutineRowMenu } from "@/components/routine-row-menu";
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
  goalTitle, readOnly,
  repeatTarget,
  repeatDoneToday = 0,
  nextRepAllowedAt,
}: RoutineRowProps) {
  const complete = useMutation(api.routines.complete);
  const uncomplete = useMutation(api.routines.uncomplete);
  const skip = useMutation(api.routines.skip);
  const archive = useMutation(api.routineManagement.archive);
  const logRep = useMutation(api.routineRepeats.logRep);
  const undoRep = useMutation(api.routineRepeats.undoRep);
  const [error, setError] = useState<string | null>(null);

  const isRepeat = repeatTarget !== undefined;
  const remaining = useCountdown(nextRepAllowedAt);
  const gated = remaining > 0;

  // The server re-checks the gate regardless; disabling only stops the obvious
  // case. Its rejection is surfaced, not swallowed — clock skew is when it fires.
  const fail = (e: unknown) =>
    setError(e instanceof Error ? e.message.split("\n")[0]! : "Something went wrong");

  const toggle = () => {
    setError(null);
    const today = todayLocal();
    if (isRepeat) {
      if (status === "completed" || gated) return;
      void logRep({ routineId, date: viewedDate, today }).catch(fail);
    } else if (status === "completed") {
      void uncomplete({ routineId, date: viewedDate, today });
    } else {
      void complete({ routineId, date: viewedDate, today });
    }
  };

  const handleSkip = () => {
    const today = todayLocal();
    if (status === "skipped") void uncomplete({ routineId, date: viewedDate, today });
    else void skip({ routineId, date: viewedDate, today });
  };

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
        status === "skipped" ? "opacity-55" : "hover:shadow-[var(--shadow-md)] hover:-translate-y-px",
      )}
    >
      <CompletionToggle
        state={status}
        onToggle={readOnly ? () => {} : toggle}
        disabled={readOnly || (isRepeat && gated)}
        className={cn(isRepeat && gated && "opacity-40")}
        ariaLabel={ariaLabel}
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[15px] font-semibold leading-snug text-foreground",
            status === "completed" &&
              "line-through decoration-[var(--slate-300)] dark:decoration-[var(--slate-600)]",
          )}
        >
          {name}
        </div>
        <div className="mt-[3px] text-[12px] text-[var(--text-tertiary)] truncate">{meta}</div>
        {error && <div className="mt-[3px] text-[12px] text-[var(--red-600)]">{error}</div>}
        {goalTitle && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--indigo-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--indigo-600)]">
            <Target className="size-2.5" />{goalTitle}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isRepeat && (
          <RepeatControl
            doneToday={repeatDoneToday}
            target={repeatTarget}
            remaining={remaining}
            onUndo={() => {
              setError(null);
              void undoRep({ routineId, date: viewedDate, today: todayLocal() }).catch(fail);
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
            onArchive={() => void archive({ routineId, today: todayLocal() })}
          />
        )}
      </div>
    </div>
  );
}
