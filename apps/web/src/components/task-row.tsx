import { useState } from "react";
import { useTaskRowActions } from "@/lib/use-task-row-actions";
import { Target } from "lucide-react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";

import { Badge } from "@/components/ui/badge";
import { RowBody } from "@/components/ui/row-body";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { RepeatControl } from "@/components/repeat-control";
import { TaskRowMenu } from "@/components/task-row-menu";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
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
  goalTitle,
  readOnly,
  repeatTarget,
  repeatDoneToday = 0,
  nextRepAllowedAt,
}: TaskRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isRepeat = repeatTarget !== undefined;
  const remaining = useCountdown(nextRepAllowedAt);
  const gated = remaining > 0;

  const { error, setError, fail, canDelete, toggle, remove, undoRep } =
    useTaskRowActions({
      taskId,
      viewedDate,
      status,
      isRepeat,
      gated,
      repeatDoneToday,
    });

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
      <RowBody
        title={title}
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
          <TaskRowMenu onDelete={() => setConfirmDelete(true)} />
        )}
      </div>

      <ConfirmDrawer
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this task?"
        description="This cannot be undone. Its completion history goes with it."
        confirmLabel="Delete task"
        tone="danger"
        onConfirm={async () => {
          setError(null);
          await remove({ taskId }).catch(fail);
        }}
      >
        <p className="text-[13px] text-foreground">{title}</p>
      </ConfirmDrawer>
    </div>
  );
}
