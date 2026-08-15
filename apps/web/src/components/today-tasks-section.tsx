import { useMutation } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { TaskComposer } from "./task-composer";
import { SectionLabel } from "./section-label";
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
  const create = useMutation(api.dailyTasks.create);
  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel count={tasksDone + tasksOpen > 0 ? `${tasksDone}/${tasksDone + tasksOpen}` : undefined}>
        Tasks
      </SectionLabel>
      {tasks.length === 0 ? (
        <p className="text-[13px] text-[var(--text-tertiary)] rounded-md border border-dashed border-[var(--border-subtle)] bg-card px-4 py-8 text-center">
          {isPast ? "No tasks on this day." : "No tasks yet. Add one below."}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
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
      {!isPast && (
        <TaskComposer
          placeholder="Add a task for today"
          onSubmit={async (v) => {
            await create({
              title: v.title,
              today: viewedDate,
              goalId: v.goalId,
              goalContribution: v.goalContribution,
              repeatTarget: v.repeatTarget,
              repeatIntervalMinutes: v.repeatIntervalMinutes,
            });
          }}
        />
      )}
    </section>
  );
}
