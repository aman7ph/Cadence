import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import type { ScheduleType } from "./routines-schedule-form";
import { ActiveRoutineRow } from "./routines-active-row";
import { ArchivedRoutineRow } from "./routines-archived-row";
import type { RoutineFormValues } from "./routine-form-drawer";
import { ListGrid } from "@/components/ui/list-grid";
import { EmptyNote } from "@/components/ui/empty-note";

// The caller's Convex document, narrowed to what these lists read. Generic
// rather than a fixed type so `onEdit` can hand the page back its own row.
export interface RoutineListItem {
  _id: Id<"routines">;
  name: string;
  description?: string;
  scheduleType: string;
  customDays?: number[];
  isActive: boolean;
  currentStreak: number;
  longestStreak: number;
  goalId?: string;
  goalContribution?: number;
  repeatTarget?: number;
  repeatIntervalMinutes?: number;
  archivedDate?: string;
}

export function ActiveRoutinesBody({
  routines,
  goalTitleById,
  columns,
  today,
  onEdit,
}: {
  routines: RoutineListItem[];
  goalTitleById: Map<string, string>;
  columns: number;
  today: string;
  onEdit: (values: RoutineFormValues) => void;
}) {
  if (routines.length === 0)
    return (
      <EmptyNote>No active routines. Add one below to get started.</EmptyNote>
    );

  return (
    <ListGrid columns={columns}>
      {routines.map((r) => {
        // Every field the edit form submits has to be carried through here:
        // omitting one silently strips it on save. Repeat settings are the
        // ones that actually bit.
        const values: RoutineFormValues = {
          _id: r._id,
          name: r.name,
          description: r.description,
          scheduleType: r.scheduleType as ScheduleType,
          customDays: r.customDays,
          goalId: r.goalId as Id<"goals"> | undefined,
          goalContribution: r.goalContribution,
          repeatTarget: r.repeatTarget,
          repeatIntervalMinutes: r.repeatIntervalMinutes,
        };
        return (
          <ActiveRoutineRow
            key={r._id}
            routine={{
              ...values,
              currentStreak: r.currentStreak,
              longestStreak: r.longestStreak,
              goalTitle: r.goalId
                ? (goalTitleById.get(r.goalId) ?? undefined)
                : undefined,
            }}
            today={today}
            onEdit={() => onEdit(values)}
          />
        );
      })}
    </ListGrid>
  );
}

export function ArchivedRoutinesBody({
  routines,
  columns,
}: {
  routines: RoutineListItem[];
  columns: number;
}) {
  if (routines.length === 0)
    return <EmptyNote>Nothing archived yet.</EmptyNote>;

  return (
    <ListGrid columns={columns}>
      {routines.map((r) => (
        <ArchivedRoutineRow
          key={r._id}
          routine={{
            _id: r._id,
            name: r.name,
            description: r.description,
            scheduleType: r.scheduleType as ScheduleType,
            customDays: r.customDays,
            archivedDate: r.archivedDate,
          }}
        />
      ))}
    </ListGrid>
  );
}
