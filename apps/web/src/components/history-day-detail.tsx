import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { RoutineRow } from "./routine-row";
import { TaskRow } from "./task-row";
import { formatFullDate } from "./history-calendar";
import { SectionLabel } from "./section-label";

interface DayDetailPanelProps {
  date: string;
  today: string;
}

function SectionHeader({ title, done, total }: { title: string; done: number; total: number }) {
  return (
    <div className="flex items-baseline justify-between pb-2 border-b border-[var(--border-subtle)]">
      <SectionLabel count={`${done}/${total}`}>{title}</SectionLabel>
    </div>
  );
}

export function DayDetailPanel({ date, today }: DayDetailPanelProps) {
  const day = useQuery(api.days.getDay, { date });
  const isPast = date < today;

  return (
    <section className="flex flex-col">
      <div className="pb-4">
        <p className="font-display text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
          {date === today ? "Today" : isPast ? "Past day" : ""}
        </p>
        <h2 className="mt-0.5 font-display text-[17px] font-semibold text-foreground">
          {formatFullDate(date)}
        </h2>
      </div>

      <div>
        {day === undefined && <p className="text-[13px] text-[var(--text-secondary)]">Loading…</p>}

        {day !== null && day !== undefined && (() => {
          // Same denominators as the Today view and the backend score.
          const countedRoutines = day.routines.filter((r) => r.status !== "skipped");
          const isEmpty = day.routines.length === 0 && day.randomTasks.length === 0;

          if (isEmpty) return (
            <p className="text-[13px] text-[var(--text-tertiary)] text-center py-10 rounded-md border border-dashed border-[var(--border-subtle)]">
              {isPast ? "Nothing was tracked on this day." : "Nothing yet today."}
            </p>
          );

          // Two columns once there is room for them. NOTE: this breakpoint is
          // coupled to DRAWER_SIZE.wide in ui/drawer.tsx — that size is 50vw at
          // `xl`, so `xl` is the first width where the drawer (~640px, less
          // 56px padding) gives each column ~290px. Tailwind 3 has no container
          // queries here, so the viewport is the only lever available; if
          // `wide` changes, revisit this.
          return (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 xl:items-start">
              {/* Routines column */}
              <section className="flex flex-col gap-2">
                <SectionHeader title="Routines"
                  done={countedRoutines.filter((r) => r.status === "completed").length}
                  total={countedRoutines.length} />
                {day.routines.length === 0
                  ? <p className="text-[12px] italic text-[var(--text-tertiary)] pt-1">None scheduled</p>
                  : day.routines.map((r) => (
                      <RoutineRow key={r.routineId} routineId={r.routineId} name={r.name}
                        description={r.description} scheduleType={r.scheduleType}
                        customDays={r.customDays} status={r.status} currentStreak={r.currentStreak}
                        viewedDate={date} repeatTarget={r.repeatTarget}
                        repeatDoneToday={r.repeatDoneToday} readOnly />
                    ))}
              </section>

              {/* Tasks column */}
              <section className="flex flex-col gap-2">
                <SectionHeader title="Tasks"
                  done={day.randomTasks.filter((t) => t.status === "completed").length}
                  total={day.randomTasks.length} />
                {day.randomTasks.length === 0
                  ? <p className="text-[12px] italic text-[var(--text-tertiary)] pt-1">No tasks</p>
                  : day.randomTasks.map((t) => (
                      <TaskRow key={t.taskId} taskId={t.taskId} title={t.title}
                        description={t.description} status={t.status} isCarriedOver={t.isCarriedOver}
                        originalDate={t.originalDate} carryoverCount={t.carryoverCount} viewedDate={date}
                        repeatTarget={t.repeatTarget} repeatDoneToday={t.repeatDoneToday} readOnly />
                    ))}
              </section>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
