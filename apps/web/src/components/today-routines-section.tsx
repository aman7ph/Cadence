import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { RoutineRow } from "./routine-row";
import { SectionLabel } from "./section-label";
import type { AppView } from "@/App";

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
  onNavigate?: (view: AppView) => void;
}

export function TodayRoutinesSection({
  routines,
  routinesDone,
  routinesScheduled,
  viewedDate,
  isPast,
  onNavigate,
}: TodayRoutinesSectionProps) {
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
        <div className="flex flex-col gap-1.5">
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
        </div>
      )}
      {!isPast && (
        <button
          type="button"
          onClick={() => onNavigate?.("routines")}
          className="self-start text-[12px] font-medium text-[var(--text-tertiary)] hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Manage routines →
        </button>
      )}
    </section>
  );
}
