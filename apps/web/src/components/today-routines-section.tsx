import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { RoutineRow } from "./routine-row";
import { SectionLabel } from "./section-label";
import { ListGrid } from "@/components/ui/list-grid";
import { useListColumns } from "@/lib/use-list-columns";

interface Routine {
  routineId: string;
  name: string;
  description?: string;
  scheduleType: string;
  customDays?: number[];
  status: "pending" | "completed" | "skipped";
  currentStreak: number;
  longestStreak?: number;
  goalTitle?: string;
  repeatTarget?: number;
  repeatDoneToday?: number;
  nextRepAllowedAt?: number;
}

interface TodayRoutinesSectionProps {
  routines: Routine[];
  routinesDone: number;
  routinesScheduled: number;
  viewedDate: string;
  isPast: boolean;
}

export function TodayRoutinesSection({
  routines,
  routinesDone,
  routinesScheduled,
  viewedDate,
  isPast,
}: TodayRoutinesSectionProps) {
  const { columns } = useListColumns();
  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel count={routinesScheduled > 0 ? `${routinesDone}/${routinesScheduled}` : undefined}>
        Routines
      </SectionLabel>
      {routines.length === 0 ? (
        <p className="text-[13px] text-[var(--text-tertiary)] rounded-md border border-dashed border-[var(--border-subtle)] bg-card px-4 py-8 text-center">
          {isPast ? "Nothing was scheduled this day." : "Nothing scheduled today."}
        </p>
      ) : (
        <ListGrid columns={columns.today} className="gap-1.5">
          {routines.map((r) => (
            <RoutineRow
              key={r.routineId}
              routineId={r.routineId as Id<"routines">}
              name={r.name}
              description={r.description}
              scheduleType={r.scheduleType as "daily" | "weekdays" | "custom"}
              customDays={r.customDays}
              status={r.status}
              currentStreak={r.currentStreak}
              viewedDate={viewedDate}
              goalTitle={r.goalTitle}
              repeatTarget={r.repeatTarget}
              repeatDoneToday={r.repeatDoneToday}
              nextRepAllowedAt={r.nextRepAllowedAt}
              readOnly={isPast}
            />
          ))}
        </ListGrid>
      )}
    </section>
  );
}
