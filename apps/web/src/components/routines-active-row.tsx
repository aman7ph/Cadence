import { useState } from "react";
import { useMutation } from "convex/react";
import { Archive, Flame, Pencil, Target } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
import { useRoutineArchive } from "@/lib/use-routine-archive";
import { scheduleLabel } from "./routines-schedule-form";
import type { ScheduleType } from "./routines-schedule-form";

interface ActiveRoutineRowProps {
  routine: {
    _id: Id<"routines">;
    name: string;
    description?: string;
    scheduleType: ScheduleType;
    customDays?: number[];
    currentStreak: number;
    longestStreak: number;
    goalId?: Id<"goals">;
    goalContribution?: number;
    goalTitle?: string;
    repeatTarget?: number;
    repeatIntervalMinutes?: number;
  };
  today: string;
  onEdit: () => void;
}

export function ActiveRoutineRow({
  routine,
  today,
  onEdit,
}: ActiveRoutineRowProps) {
  const archiveAction = useRoutineArchive(routine._id, today);

  return (
    <div className="group flex items-start gap-3 rounded-md border border-[var(--border-subtle)] bg-card px-3.5 py-3 transition-colors duration-150 hover:border-[var(--border-default)]">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-semibold leading-snug text-foreground">
            {routine.name}
          </span>
          <span className="rounded-pill bg-[var(--bg-sunken)] px-2 py-[3px] text-[10px] text-[var(--text-tertiary)]">
            {scheduleLabel(routine.scheduleType, routine.customDays)}
          </span>
        </div>
        {routine.description && (
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 truncate">
            {routine.description}
          </p>
        )}
        {routine.currentStreak > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Flame className="size-3 text-[var(--action-primary)]" />
            <span className="text-[10.5px] font-semibold text-[var(--text-secondary)]">
              {routine.currentStreak} day streak
            </span>
            {routine.longestStreak > routine.currentStreak && (
              <span className="text-[11px] text-[var(--text-tertiary)]">
                · best {routine.longestStreak}
              </span>
            )}
          </div>
        )}
        {routine.goalTitle && (
          <div className="flex items-center gap-1 mt-1.5">
            <span className="inline-flex items-center gap-1 rounded-pill bg-[var(--surface-accent)] px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.04em] text-[var(--text-accent)]">
              <Target className="size-2.5" />
              {routine.goalTitle}
              {routine.goalContribution !== undefined && (
                <span className="ml-0.5 opacity-70">
                  +{routine.goalContribution}
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-sm text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-foreground transition-colors duration-150"
          title="Edit routine"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={archiveAction.request}
          className="flex h-8 w-8 items-center justify-center rounded-sm text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-accent)] transition-colors duration-150 disabled:opacity-50"
          title="Archive routine"
        >
          <Archive className="size-3.5" />
        </button>
      </div>

      <ConfirmDrawer {...archiveAction.drawerProps} />
    </div>
  );
}
