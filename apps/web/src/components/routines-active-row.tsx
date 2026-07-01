import { useState } from "react";
import { useMutation } from "convex/react";
import { Archive, Flame, Pencil, Target } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { scheduleLabel } from "./routines-schedule-form";
import type { ScheduleType } from "./routines-schedule-form";
import { EditRoutineForm } from "./routines-edit-form";

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
  };
  today: string;
}

export function ActiveRoutineRow({ routine, today }: ActiveRoutineRowProps) {
  const archiveMutation = useMutation(api.routineManagement.archive);
  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);

  if (editing) {
    return (
      <EditRoutineForm
        routineId={routine._id}
        initialName={routine.name}
        initialDescription={routine.description}
        initialScheduleType={routine.scheduleType}
        initialCustomDays={routine.customDays}
        initialGoalId={routine.goalId}
        initialGoalContribution={routine.goalContribution}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="group flex items-center gap-3 rounded-[12px] border border-[var(--border-subtle)] bg-card px-4 py-3.5 shadow-[var(--shadow-sm)] transition-all duration-150 hover:shadow-[var(--shadow-md)] hover:-translate-y-px">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-foreground leading-snug">{routine.name}</span>
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] border border-[var(--border-subtle)] rounded-full px-2 py-0.5">
            {scheduleLabel(routine.scheduleType, routine.customDays)}
          </span>
        </div>
        {routine.description && (
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 truncate">{routine.description}</p>
        )}
        {routine.currentStreak > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Flame className="size-3 text-orange-500" />
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
              {routine.currentStreak} day streak
            </span>
            {routine.longestStreak > routine.currentStreak && (
              <span className="text-[11px] text-[var(--text-tertiary)]">· best {routine.longestStreak}</span>
            )}
          </div>
        )}
        {routine.goalTitle && (
          <div className="flex items-center gap-1 mt-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--indigo-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--indigo-600)]">
              <Target className="size-2.5" />
              {routine.goalTitle}
              {routine.goalContribution !== undefined && (
                <span className="ml-0.5 opacity-70">+{routine.goalContribution}</span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150"
          title="Edit routine"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          disabled={archiving}
          onClick={async () => {
            setArchiving(true);
            try { await archiveMutation({ routineId: routine._id, today }); }
            finally { setArchiving(false); }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-amber-600 transition-all duration-150 disabled:opacity-50"
          title="Archive routine"
        >
          <Archive className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
