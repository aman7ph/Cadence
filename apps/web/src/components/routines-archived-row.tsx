import { useState } from "react";
import { useMutation } from "convex/react";
import { RotateCcw, Trash2 } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
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
  // Exactly one drawer at a time, so the two confirms cannot stack.
  const [confirm, setConfirm] = useState<"restore" | "delete" | null>(null);

  return (
    <div className="flex items-center gap-3 rounded-md border border-[var(--border-subtle)] bg-card px-4 py-3.5 opacity-60 hover:opacity-100 transition-all duration-150">
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
          onClick={() => setConfirm("restore")}
          className="flex items-center gap-1.5 h-8 rounded-sm px-2.5 text-[12px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150 disabled:opacity-50"
        >
          <RotateCcw className="size-3.5" />
          Restore
        </button>

          <button
            type="button"
            onClick={() => setConfirm("delete")}
            aria-label="Delete permanently"
            className="flex h-8 w-8 items-center justify-center rounded-sm text-[var(--text-tertiary)] transition-colors duration-150 hover:bg-[var(--surface-hover)] hover:text-[var(--status-danger)]"
          >
            <Trash2 className="size-3.5" />
          </button>
      </div>

      <ConfirmDrawer
        open={confirm === "restore"}
        onOpenChange={(o) => setConfirm(o ? "restore" : null)}
        title="Restore this routine?"
        description="It returns to your active routines and starts appearing on the days it is scheduled."
        confirmLabel="Restore"
        tone="accent"
        onConfirm={async () => {
          setPending(true);
          try {
            await restore({ routineId: routine._id });
          } finally {
            setPending(false);
          }
        }}
      >
        <p className="text-[13px] text-foreground">{routine.name}</p>
      </ConfirmDrawer>

      <ConfirmDrawer
        open={confirm === "delete"}
        onOpenChange={(o) => setConfirm(o ? "delete" : null)}
        title="Delete this routine forever?"
        description="This cannot be undone. Its completion history and streaks are removed with it."
        confirmLabel="Delete forever"
        tone="danger"
        onConfirm={async () => {
          setPending(true);
          try {
            await permanentDelete({ routineId: routine._id });
          } finally {
            setPending(false);
          }
        }}
      >
        <p className="text-[13px] text-foreground">{routine.name}</p>
      </ConfirmDrawer>
    </div>
  );
}
