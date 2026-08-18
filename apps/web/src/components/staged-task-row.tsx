import { useState } from "react";
import { useMutation } from "convex/react";
import { MoreHorizontal, Target } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
import type { Doc } from "@cadence/backend/convex/_generated/dataModel";
import { formatDateShort } from "@cadence/shared";

import { Badge } from "@/components/ui/badge";
import { scheduleLabel } from "./routines-schedule-form";

interface StagedTaskRowProps {
  stagedTask: Doc<"stagedTasks">;
  goalTitle?: string;
  onSchedule: () => void;
}

function prettyCreatedAt(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function StagedTaskRow({ stagedTask, goalTitle, onSchedule }: StagedTaskRowProps) {
  const unschedule = useMutation(api.stagedTaskScheduling.unschedule);
  const remove = useMutation(api.stagedTasks.remove);
  const [confirm, setConfirm] = useState<"delete" | "unschedule" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const isScheduled = stagedTask.scheduledDate !== undefined;

  return (
    <div className="group flex items-center gap-3.5 rounded-md border border-[var(--border-subtle)] bg-card px-4 py-3.5 transition-colors duration-150 hover:border-[var(--border-default)]">
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
          <span className="mt-1 inline-flex items-center gap-1 rounded-pill bg-[var(--surface-accent)] px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.04em] text-[var(--text-accent)]">
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
            className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150"
            aria-label="More options"
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 bottom-full mb-1 z-20 min-w-[150px] overflow-hidden rounded-md border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-md)]">
                <button
                  type="button"
                  onClick={() => { onSchedule(); setMenuOpen(false); }}
                  className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                >
                  {isScheduled ? "Edit schedule…" : "Schedule…"}
                </button>
                <div className="mx-3 h-px bg-[var(--border-subtle)]" />
                {isScheduled && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setConfirm("unschedule"); setMenuOpen(false); }}
                      className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-foreground hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      Unschedule
                    </button>
                    <div className="mx-3 h-px bg-[var(--border-subtle)]" />
                  </>
                )}
                <button
                  type="button"
                  onClick={() => { setConfirm("delete"); setMenuOpen(false); }}
                  className="w-full px-3.5 py-2.5 text-left text-[13px] font-medium text-[var(--status-danger)] hover:bg-[var(--surface-danger)] transition-colors"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete is irreversible, unschedule is not — the tone carries that. */}
      <ConfirmDrawer
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Delete this staged task?"
        description="This cannot be undone."
        confirmLabel="Delete task"
        tone="danger"
        onConfirm={async () => {
          await remove({ stagedTaskId: stagedTask._id });
        }}
      >
        <p className="text-[13px] text-foreground">{stagedTask.title}</p>
      </ConfirmDrawer>

      <ConfirmDrawer
        open={confirm === "unschedule"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Unschedule this task?"
        description="It returns to Unscheduled and keeps its details. You can schedule it again at any time."
        confirmLabel="Unschedule"
        tone="accent"
        onConfirm={async () => {
          await unschedule({ stagedTaskId: stagedTask._id });
        }}
      />
    </div>
  );
}
