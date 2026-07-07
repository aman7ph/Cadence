import { useState } from "react";
import { useMutation } from "convex/react";
import { MoreHorizontal, Target } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Doc } from "@cadence/backend/convex/_generated/dataModel";
import { formatDateShort } from "@cadence/shared";

import { Badge } from "@/components/ui/badge";
import { scheduleLabel } from "./routines-schedule-form";
import { StagedTaskEditForm } from "./staged-task-edit-form";
import { StagedTaskScheduleForm } from "./staged-task-schedule-form";

interface StagedTaskRowProps {
  stagedTask: Doc<"stagedTasks">;
  goalTitle?: string;
}

function prettyCreatedAt(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function StagedTaskRow({ stagedTask, goalTitle }: StagedTaskRowProps) {
  const unschedule = useMutation(api.stagedTaskScheduling.unschedule);
  const remove = useMutation(api.stagedTasks.remove);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const isScheduled = stagedTask.scheduledDate !== undefined;

  if (scheduling) {
    return (
      <StagedTaskScheduleForm stagedTask={stagedTask} onDone={() => setScheduling(false)} />
    );
  }

  if (editing) {
    return (
      <StagedTaskEditForm
        stagedTaskId={stagedTask._id}
        initialTitle={stagedTask.title}
        initialDescription={stagedTask.description}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="group flex items-center gap-3.5 rounded-[12px] border border-[var(--border-subtle)] bg-card px-4 py-3.5 shadow-[var(--shadow-sm)] transition-all duration-150 hover:shadow-[var(--shadow-md)] hover:-translate-y-px">
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold leading-snug text-foreground">
          {stagedTask.title}
        </div>
        <div className="mt-[3px] text-[12px] text-[var(--text-tertiary)] truncate">
          {stagedTask.description?.trim()
            ? stagedTask.description
            : `Added ${prettyCreatedAt(stagedTask.createdAt)}`}
        </div>
        {goalTitle && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--indigo-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--indigo-600)]">
            <Target className="size-2.5" />
            {goalTitle}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isScheduled && (
          <>
            <Badge tone="accent">
              {stagedTask.targetType === "routine"
                ? `Routine · ${scheduleLabel(stagedTask.routineScheduleType ?? "daily", stagedTask.routineCustomDays)}`
                : "Task"}
            </Badge>
            <Badge tone="neutral">{formatDateShort(stagedTask.scheduledDate!)}</Badge>
          </>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150"
            aria-label="More options"
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 bottom-full mb-1 z-20 min-w-[150px] overflow-hidden rounded-[12px] border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-md)]">
                <button
                  type="button"
                  onClick={() => { setScheduling(true); setMenuOpen(false); }}
                  className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                >
                  {isScheduled ? "Edit schedule…" : "Schedule…"}
                </button>
                <div className="mx-3 h-px bg-[var(--border-subtle)]" />
                {isScheduled ? (
                  <button
                    type="button"
                    onClick={() => { void unschedule({ stagedTaskId: stagedTask._id }); setMenuOpen(false); }}
                    className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    Unschedule
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditing(true); setMenuOpen(false); }}
                    className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    Edit
                  </button>
                )}
                <div className="mx-3 h-px bg-[var(--border-subtle)]" />
                <button
                  type="button"
                  onClick={() => { void remove({ stagedTaskId: stagedTask._id }); setMenuOpen(false); }}
                  className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[var(--red-600)] hover:bg-[var(--red-50)] dark:hover:bg-[rgba(220,38,38,0.10)] transition-colors"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
