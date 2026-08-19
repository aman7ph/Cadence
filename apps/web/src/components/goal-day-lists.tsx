import { RoutineRow } from "./routine-row";
import { TaskRow } from "./task-row";

function SectionHeader({
  title,
  done,
  total,
}: {
  title: string;
  done: number;
  total: number;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--border-subtle)] pb-2">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[var(--text-tertiary)]">
        {title}
      </h3>
      <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
        {done}/{total}
      </span>
    </div>
  );
}

// The day rows carry only what a read-only row needs, so they are typed on
// their own shape rather than on the full row props.
interface DayRoutine {
  routineId: React.ComponentProps<typeof RoutineRow>["routineId"];
  name: string;
  description?: string;
  scheduleType: React.ComponentProps<typeof RoutineRow>["scheduleType"];
  customDays?: number[];
  status: React.ComponentProps<typeof RoutineRow>["status"];
  currentStreak: number;
}

interface DayTask {
  taskId: React.ComponentProps<typeof TaskRow>["taskId"];
  title: string;
  description?: string;
  status: React.ComponentProps<typeof TaskRow>["status"];
  isCarriedOver: boolean;
  originalDate: string;
  carryoverCount: number;
  repeatTarget?: number;
  repeatDoneToday?: number;
}

interface GoalDayListsProps {
  routines: DayRoutine[];
  tasks: DayTask[];
  selectedDate: string;
}

/**
 * What a goal's linked routines and tasks did on the selected day.
 *
 * Two columns, and the rows are the real `RoutineRow` / `TaskRow` in `readOnly`
 * — a goal's day should look exactly like that day did, not like a summary of
 * it.
 */
export function GoalDayLists({
  routines,
  tasks,
  selectedDate,
}: GoalDayListsProps) {
  return (
    <div className="grid grid-cols-2 items-start gap-x-5 gap-y-3">
      <section className="flex flex-col gap-2">
        <SectionHeader
          title="Routines"
          done={routines.filter((r) => r.status === "completed").length}
          total={routines.length}
        />
        {routines.length === 0 ? (
          <p className="pt-1 text-[12px] italic text-[var(--text-tertiary)]">
            None scheduled
          </p>
        ) : (
          routines.map((r) => (
            <RoutineRow
              key={r.routineId}
              routineId={r.routineId}
              name={r.name}
              description={r.description}
              scheduleType={r.scheduleType}
              customDays={r.customDays}
              status={r.status}
              currentStreak={r.currentStreak}
              viewedDate={selectedDate}
              readOnly
            />
          ))
        )}
      </section>
      <section className="flex flex-col gap-2">
        <SectionHeader
          title="Tasks"
          done={tasks.filter((t) => t.status === "completed").length}
          total={tasks.length}
        />
        {tasks.length === 0 ? (
          <p className="pt-1 text-[12px] italic text-[var(--text-tertiary)]">
            No tasks
          </p>
        ) : (
          tasks.map((t) => (
            <TaskRow
              key={t.taskId}
              taskId={t.taskId}
              title={t.title}
              description={t.description}
              status={t.status}
              isCarriedOver={t.isCarriedOver}
              originalDate={t.originalDate}
              carryoverCount={t.carryoverCount}
              repeatTarget={t.repeatTarget}
              repeatDoneToday={t.repeatDoneToday}
              viewedDate={selectedDate}
              readOnly
            />
          ))
        )}
      </section>
    </div>
  );
}
