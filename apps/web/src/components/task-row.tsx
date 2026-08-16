import { useState } from "react";
import { useMutation } from "convex/react";
import { Target } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";

import { Badge } from "@/components/ui/badge";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { RepeatControl } from "@/components/repeat-control";
import { TaskRowMenu } from "@/components/task-row-menu";
import { useCountdown } from "@/lib/use-countdown";
import { cn } from "@/lib/utils";

interface TaskRowProps {
  taskId: Id<"dailyTasks">;
  title: string;
  description?: string;
  status: "open" | "completed";
  isCarriedOver: boolean;
  originalDate: string;
  carryoverCount: number;
  viewedDate: string;
  goalTitle?: string;
  readOnly?: boolean;
  repeatTarget?: number;
  repeatDoneToday?: number;
  nextRepAllowedAt?: number;
}

function prettyOriginalDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TaskRow({
  taskId,
  title,
  description,
  status,
  isCarriedOver,
  originalDate,
  carryoverCount,
  viewedDate,
  goalTitle, readOnly,
  repeatTarget,
  repeatDoneToday = 0,
  nextRepAllowedAt,
}: TaskRowProps) {
  const complete = useMutation(api.dailyTasks.complete);
  const uncomplete = useMutation(api.dailyTasks.uncomplete);
  const remove = useMutation(api.dailyTasks.remove);
  const logRep = useMutation(api.dailyTaskRepeats.logRep);
  const undoRep = useMutation(api.dailyTaskRepeats.undoRep);
  const [error, setError] = useState<string | null>(null);

  const isRepeat = repeatTarget !== undefined;
  const remaining = useCountdown(nextRepAllowedAt);
  const gated = remaining > 0;

  // dailyTasks.remove enforces what may be deleted; hiding the menu only spares
  // the common case a guaranteed failure. It cannot be the whole test —
  // repeatDoneToday is scoped to the viewed date, so a repeat task with reps on
  // an earlier day still reaches the server and its rejection lands in `error`.
  const canDelete = status === "open" && repeatDoneToday === 0;

  // The server re-checks the gate regardless; disabling only stops the obvious
  // case. Its rejection is surfaced, not swallowed — clock skew is when it fires.
  const fail = (e: unknown) =>
    setError(e instanceof Error ? e.message.split("\n")[0]! : "Something went wrong");

  const toggle = () => {
    setError(null);
    if (isRepeat) {
      if (status !== "open" || gated) return;
      void logRep({ taskId, today: viewedDate }).catch(fail);
    } else if (status === "completed") {
      void uncomplete({ taskId });
    } else {
      void complete({ taskId, today: viewedDate });
    }
  };

  const meta = description?.trim()
    ? description
    : isCarriedOver
      ? `Original ${prettyOriginalDate(originalDate)}`
      : "Today";

  return (
    <div className="group flex items-center gap-3.5 rounded-sm border border-[var(--border-subtle)] bg-card px-3 py-2.5 transition-colors duration-150 hover:border-[var(--border-default)]">
      <CompletionToggle
        state={status === "completed" ? "completed" : "pending"}
        onToggle={readOnly ? () => {} : toggle}
        disabled={readOnly || (isRepeat && gated)}
        className={cn(isRepeat && gated && "opacity-40")}
        ariaLabel={
          isRepeat
            ? `Log a check-in for ${title} (${repeatDoneToday} of ${repeatTarget} done)`
            : `Mark ${title} ${status === "completed" ? "incomplete" : "complete"}`
        }
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[15px] font-semibold leading-snug text-foreground",
            status === "completed" &&
              "line-through decoration-[var(--border-strong)]",
          )}
        >
          {title}
        </div>
        <div className="mt-[3px] text-[12px] text-[var(--text-tertiary)] truncate">{meta}</div>
        {error && <div className="mt-[3px] text-[12px] text-[var(--red-600)]">{error}</div>}
        {goalTitle && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-pill bg-[var(--surface-accent)] px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.04em] text-[var(--text-accent)]">
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
              void undoRep({ taskId, today: viewedDate }).catch(fail);
            }}
            readOnly={readOnly}
          />
        )}
        {isCarriedOver && status === "open" && (
          <Badge tone="carryover">
            ×<span className="font-mono">{carryoverCount}</span> carried
          </Badge>
        )}
        {!readOnly && canDelete && (
          <TaskRowMenu onDelete={() => { setError(null); void remove({ taskId }).catch(fail); }} />
        )}
      </div>
    </div>
  );
}
