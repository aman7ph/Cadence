import { useState } from "react";
import { useMutation } from "convex/react";
import { RotateCcw, Trash2, X } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { scheduleLabel } from "./routines-schedule-form";
import type { ScheduleType } from "./routines-schedule-form";

interface ArchivedRoutineRowProps {
  routine: {
    _id: Id<"routines">;
    name: string;
    description?: string;
    scheduleType: ScheduleType;
    customDays?: number[];
    archivedDate?: string;
  };
}

export function ArchivedRoutineRow({ routine }: ArchivedRoutineRowProps) {
  const restore = useMutation(api.routineManagement.restore);
  const permanentDelete = useMutation(api.routineManagement.permanentDelete);
  const [pending, setPending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-[var(--border-subtle)] bg-card px-4 py-3.5 opacity-60 hover:opacity-100 transition-all duration-150">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold text-foreground leading-snug line-through decoration-[var(--text-tertiary)]/50">
            {routine.name}
          </span>
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] border border-[var(--border-subtle)] rounded-full px-2 py-0.5">
            {scheduleLabel(routine.scheduleType, routine.customDays)}
          </span>
        </div>
        {routine.archivedDate && (
          <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 font-mono">
            Archived {routine.archivedDate}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try { await restore({ routineId: routine._id }); }
            finally { setPending(false); }
          }}
          className="flex items-center gap-1.5 h-8 rounded-[8px] px-2.5 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150 disabled:opacity-50"
        >
          <RotateCcw className="size-3.5" />
          Restore
        </button>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--status-danger)] transition-all duration-150"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 rounded-[8px] border border-red-500/40 bg-red-500/5 px-2.5 py-1.5">
            <span className="text-[11px] text-[var(--status-danger)] font-semibold">Delete forever?</span>
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                try { await permanentDelete({ routineId: routine._id }); }
                finally { setPending(false); setConfirmDelete(false); }
              }}
              className="text-[11px] font-bold text-[var(--status-danger)] hover:underline disabled:opacity-50 ml-1"
            >
              Yes
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="ml-1 text-[var(--text-tertiary)] hover:text-foreground">
              <X className="size-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
