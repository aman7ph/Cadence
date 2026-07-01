import { useState } from "react";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { RoutineRow } from "./routine-row";
import { TaskRow } from "./task-row";

interface Props {
  goalId: Id<"goals">;
  createdAt: number;
  endDate?: number;
}

function toDateStr(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function SectionHeader({ title, done, total }: { title: string; done: number; total: number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--border-subtle)] pb-2">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[var(--text-tertiary)]">{title}</h3>
      <span className="font-mono text-[11px] text-[var(--text-tertiary)]">{done}/{total}</span>
    </div>
  );
}

export function GoalDetailLinked({ goalId, createdAt, endDate }: Props) {
  const today = todayLocal();
  const minDate = toDateStr(createdAt);
  const maxDate = endDate ? toDateStr(endDate) : today;
  const [selectedDate, setSelectedDate] = useState(() => (today > maxDate ? maxDate : today));

  const day = useQuery(api.goalLinks.getDayForGoal, { goalId, date: selectedDate });
  const routines = day?.routines ?? [];
  const tasks = (day?.tasks ?? []).filter((t) => t.status !== "dismissed");
  const isEmpty = routines.length === 0 && tasks.length === 0;

  function shift(dir: 1 | -1) {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + dir);
    const next = d.toISOString().slice(0, 10);
    setSelectedDate(next < minDate ? minDate : next > maxDate ? maxDate : next);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={() => shift(-1)} disabled={selectedDate <= minDate}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-foreground disabled:opacity-30 transition-all">
          <ChevronLeft className="size-4" />
        </button>
        <input type="date" value={selectedDate} min={minDate} max={maxDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ colorScheme: "normal" }}
          className="flex-1 rounded-[8px] border border-[var(--border-subtle)] bg-card px-2.5 py-1.5 text-[13px] text-foreground focus:border-[var(--border-accent)] focus:outline-none transition-colors" />
        <button type="button" onClick={() => shift(1)} disabled={selectedDate >= maxDate}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-foreground disabled:opacity-30 transition-all">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {day === undefined && <p className="py-6 text-center text-[13px] text-[var(--text-tertiary)]">Loading…</p>}
        {day !== undefined && isEmpty && (
          <p className="rounded-[12px] border border-dashed border-[var(--border-subtle)] py-10 text-center text-[13px] text-[var(--text-tertiary)]">
            Nothing tracked for this goal on this day.
          </p>
        )}
        {day !== undefined && !isEmpty && (
          <div className="grid grid-cols-2 items-start gap-x-5 gap-y-3">
            <section className="flex flex-col gap-2">
              <SectionHeader title="Routines"
                done={routines.filter((r) => r.status === "completed").length}
                total={routines.length} />
              {routines.length === 0
                ? <p className="pt-1 text-[12px] italic text-[var(--text-tertiary)]">None scheduled</p>
                : routines.map((r) => (
                    <RoutineRow key={r.routineId} routineId={r.routineId} name={r.name}
                      description={r.description} scheduleType={r.scheduleType}
                      customDays={r.customDays} status={r.status} currentStreak={r.currentStreak}
                      viewedDate={selectedDate} readOnly />
                  ))}
            </section>
            <section className="flex flex-col gap-2">
              <SectionHeader title="Tasks"
                done={tasks.filter((t) => t.status === "completed").length}
                total={tasks.length} />
              {tasks.length === 0
                ? <p className="pt-1 text-[12px] italic text-[var(--text-tertiary)]">No tasks</p>
                : tasks.map((t) => (
                    <TaskRow key={t.taskId} taskId={t.taskId} title={t.title}
                      description={t.description} status={t.status} isCarriedOver={t.isCarriedOver}
                      originalDate={t.originalDate} carryoverCount={t.carryoverCount}
                      viewedDate={selectedDate} readOnly />
                  ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
