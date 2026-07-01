import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { todayLocal } from "@cadence/shared";
import type { AppView } from "@/App";

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-[3px] w-full rounded-full bg-[var(--bg-sunken)]">
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${Math.min(100, pct)}%`, background: color }}
      />
    </div>
  );
}

export function TodayWidget({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const today = todayLocal();
  const day = useQuery(api.days.getDay, { date: today });

  if (!day) return null;

  const routinesDone = day.routines.filter((r) => r.status === "completed").length;
  const routinesTotal = day.routines.length;
  const tasksDone = day.randomTasks.filter((t) => t.status === "completed").length;
  const tasksOpen = day.randomTasks.filter((t) => t.status === "open").length;
  const tasksTotal = tasksDone + tasksOpen;

  const routinePct = routinesTotal > 0 ? (routinesDone / routinesTotal) * 100 : 0;
  const taskPct = tasksTotal > 0 ? (tasksDone / tasksTotal) * 100 : 0;
  const allDone = routinesDone === routinesTotal && tasksDone === tasksTotal && routinesTotal + tasksTotal > 0;

  return (
    <div className="mt-5 flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">Today</span>
        {allDone && (
          <span className="text-[10px] font-bold text-[var(--status-complete)]">All done ✓</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onNavigate("today")}
        className="rounded-[12px] border border-[var(--border-subtle)] bg-card p-3 flex flex-col gap-3 hover:bg-[var(--surface-hover)] transition-colors text-left w-full"
      >
        {routinesTotal > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Routines</span>
              <span className="text-[11px] font-mono font-semibold text-foreground">
                {routinesDone}<span className="text-[var(--text-tertiary)]">/{routinesTotal}</span>
              </span>
            </div>
            <MiniBar pct={routinePct} color="var(--indigo-500)" />
          </div>
        )}

        {tasksTotal > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">Tasks</span>
              <span className="text-[11px] font-mono font-semibold text-foreground">
                {tasksDone}<span className="text-[var(--text-tertiary)]">/{tasksTotal}</span>
              </span>
            </div>
            <MiniBar pct={taskPct} color="var(--chart-2)" />
          </div>
        )}

        {routinesTotal === 0 && tasksTotal === 0 && (
          <p className="text-[11px] text-[var(--text-tertiary)] text-center py-1">Nothing scheduled yet</p>
        )}
      </button>
    </div>
  );
}
