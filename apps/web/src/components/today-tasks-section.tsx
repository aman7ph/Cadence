import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { SectionLabel } from "./section-label";
import { ListGrid } from "@/components/ui/list-grid";
import { useListColumns } from "@/lib/use-list-columns";
import { TaskRow } from "./task-row";
import { EmptyNote } from "@/components/ui/empty-note";

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
  const { columns } = useListColumns();
  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel
        count={
          tasksDone + tasksOpen > 0
            ? `${tasksDone}/${tasksDone + tasksOpen}`
            : undefined
        }
      >
        Tasks
      </SectionLabel>
      {tasks.length === 0 ? (
        <EmptyNote>
          {isPast ? "No tasks on this day." : "No tasks yet. Add one below."}
        </EmptyNote>
      ) : (
        <ListGrid columns={columns.today} className="gap-1.5">
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
        </ListGrid>
      )}
    </section>
  );
}
