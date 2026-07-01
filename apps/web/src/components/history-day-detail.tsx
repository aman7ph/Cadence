import { useQuery } from "convex/react";
import { X } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import { RoutineRow } from "./routine-row";
import { TaskRow } from "./task-row";
import { formatFullDate } from "./history-calendar";

interface DayDetailPanelProps {
  date: string;
  today: string;
  onClose: () => void;
}

function SectionHeader({ title, done, total }: { title: string; done: number; total: number }) {
  return (
    <div className="flex items-baseline justify-between pb-2 border-b border-[var(--border-subtle)]">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[var(--text-tertiary)]">{title}</h3>
      <span className="text-[11px] font-mono text-[var(--text-tertiary)]">{done}/{total}</span>
    </div>
  );
}

export function DayDetailPanel({ date, today, onClose }: DayDetailPanelProps) {
  const day = useQuery(api.days.getDay, { date });
  const isPast = date < today;

  return (
    <aside className="flex flex-col rounded-[16px] border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-[var(--text-tertiary)]">
            {date === today ? "Today" : isPast ? "Past day" : ""}
          </p>
          <h2 className="text-[14px] font-semibold text-foreground truncate mt-0.5">{formatFullDate(date)}</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150">
          <X className="size-4" />
        </button>
      </div>

      <div className="overflow-y-auto p-4">
        {day === undefined && <p className="text-[13px] text-[var(--text-secondary)]">Loading…</p>}

        {day !== null && day !== undefined && (() => {
          const visibleTasks = day.randomTasks.filter((t) => t.status !== "dismissed");
          const isEmpty = day.routines.length === 0 && visibleTasks.length === 0;

          if (isEmpty) return (
            <p className="text-[13px] text-[var(--text-tertiary)] text-center py-10 rounded-[12px] border border-dashed border-[var(--border-subtle)]">
              {isPast ? "Nothing was tracked on this day." : "Nothing yet today."}
            </p>
          );

          return (
            <div className="grid grid-cols-2 items-start gap-x-5 gap-y-3">
              {/* Routines column */}
              <section className="flex flex-col gap-2">
                <SectionHeader title="Routines"
                  done={day.routines.filter((r) => r.status === "completed").length}
                  total={day.routines.length} />
                {day.routines.length === 0
                  ? <p className="text-[12px] italic text-[var(--text-tertiary)] pt-1">None scheduled</p>
                  : day.routines.map((r) => (
                      <RoutineRow key={r.routineId} routineId={r.routineId} name={r.name}
                        description={r.description} scheduleType={r.scheduleType}
                        customDays={r.customDays} status={r.status} currentStreak={r.currentStreak}
                        viewedDate={date} readOnly />
                    ))}
              </section>

              {/* Tasks column */}
              <section className="flex flex-col gap-2">
                <SectionHeader title="Tasks"
                  done={visibleTasks.filter((t) => t.status === "completed").length}
                  total={visibleTasks.length} />
                {visibleTasks.length === 0
                  ? <p className="text-[12px] italic text-[var(--text-tertiary)] pt-1">No tasks</p>
                  : visibleTasks.map((t) => (
                      <TaskRow key={t.taskId} taskId={t.taskId} title={t.title}
                        description={t.description} status={t.status} isCarriedOver={t.isCarriedOver}
                        originalDate={t.originalDate} carryoverCount={t.carryoverCount} viewedDate={date} readOnly />
                    ))}
              </section>
            </div>
          );
        })()}
      </div>
    </aside>
  );
}
