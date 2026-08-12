import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { AddTaskForm } from "./add-task-form";
import { TaskRow } from "./task-row";

interface Task {
  taskId: string;
  title: string;
  description?: string;
  status: "open" | "completed";
  isCarriedOver: boolean;
  originalDate: string;
  carryoverCount: number;
  goalTitle?: string;
  repeatTarget?: number;
  repeatDoneToday?: number;
  nextRepAllowedAt?: number;
}

interface TodayTasksSectionProps {
  tasks: Task[];
  tasksDone: number;
  tasksOpen: number;
  viewedDate: string;
  isPast: boolean;
}

// Every task on the day's plate renders in one list. There is no hidden subset
// any more — a task the user no longer wants is deleted outright, so nothing
// can sit off-screen while still counting against the day's score.
export function TodayTasksSection({
  tasks,
  tasksDone,
  tasksOpen,
  viewedDate,
  isPast,
}: TodayTasksSectionProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[var(--text-tertiary)]">Tasks</h2>
        {tasksDone + tasksOpen > 0 && (
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
            {tasksDone} / {tasksDone + tasksOpen} done
          </span>
        )}
      </div>
      {tasks.length === 0 ? (
        <p className="text-[13px] text-[var(--text-tertiary)] rounded-[12px] border border-dashed border-[var(--border-subtle)] bg-card px-4 py-8 text-center">
          {isPast ? "No tasks on this day." : "No tasks yet. Add one below."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {tasks.map((t) => (
            <TaskRow
              key={t.taskId}
              taskId={t.taskId as Id<"dailyTasks">}
              title={t.title}
              description={t.description}
              status={t.status}
              isCarriedOver={t.isCarriedOver}
              originalDate={t.originalDate}
              carryoverCount={t.carryoverCount}
              viewedDate={viewedDate}
              goalTitle={t.goalTitle}
              repeatTarget={t.repeatTarget}
              repeatDoneToday={t.repeatDoneToday}
              nextRepAllowedAt={t.nextRepAllowedAt}
              readOnly={isPast}
            />
          ))}
        </div>
      )}
      {!isPast && <AddTaskForm />}
    </section>
  );
}
