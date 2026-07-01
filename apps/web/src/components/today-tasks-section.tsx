import { useState } from "react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { AddTaskForm } from "./add-task-form";
import { TaskRow } from "./task-row";

interface Task {
  taskId: string;
  title: string;
  description?: string;
  status: "open" | "completed" | "dismissed";
  isCarriedOver: boolean;
  originalDate: string;
  carryoverCount: number;
  goalTitle?: string;
}

interface TodayTasksSectionProps {
  visibleTasks: Task[];
  dismissedTasks: Task[];
  tasksDone: number;
  tasksOpen: number;
  tasksDismissed: number;
  viewedDate: string;
  isPast: boolean;
}

export function TodayTasksSection({
  visibleTasks,
  dismissedTasks,
  tasksDone,
  tasksOpen,
  tasksDismissed,
  viewedDate,
  isPast,
}: TodayTasksSectionProps) {
  const [showDismissed, setShowDismissed] = useState(false);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[var(--text-tertiary)]">Tasks</h2>
        {tasksOpen + tasksDone > 0 && (
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
            {tasksDone} / {tasksDone + tasksOpen} done
          </span>
        )}
      </div>
      {visibleTasks.length === 0 ? (
        <p className="text-[13px] text-[var(--text-tertiary)] rounded-[12px] border border-dashed border-[var(--border-subtle)] bg-card px-4 py-8 text-center">
          {isPast ? "No tasks on this day." : "No tasks yet. Add one below."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {visibleTasks.map((t) => (
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
            />
          ))}
        </div>
      )}
      {!isPast && <AddTaskForm />}

      {tasksDismissed > 0 && (
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowDismissed((o) => !o)}
            className="flex items-center gap-1.5 self-start text-[11px] font-semibold text-[var(--text-tertiary)] hover:text-foreground transition-colors"
          >
            <span className={`transition-transform duration-150 ${showDismissed ? "rotate-90" : ""}`}>▶</span>
            Dismissed ({tasksDismissed})
          </button>
          {showDismissed && (
            <div className="grid grid-cols-2 gap-2">
              {dismissedTasks.map((t) => (
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
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
