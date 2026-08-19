import { useState } from "react";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { GoalDayLists } from "./goal-day-lists";
import { EmptyNote } from "@/components/ui/empty-note";

interface Props {
  goalId: Id<"goals">;
  createdAt: number;
  endDate?: number;
}

function toDateStr(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

export function GoalDetailLinked({ goalId, createdAt, endDate }: Props) {
  const today = todayLocal();
  const minDate = toDateStr(createdAt);
  const maxDate = endDate ? toDateStr(endDate) : today;
  const [selectedDate, setSelectedDate] = useState(() =>
    today > maxDate ? maxDate : today,
  );

  const day = useQuery(api.goalLinks.getDayForGoal, {
    goalId,
    date: selectedDate,
  });
  const routines = day?.routines ?? [];
  const tasks = day?.tasks ?? [];
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
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={selectedDate <= minDate}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-foreground disabled:opacity-30 transition-all"
        >
          <ChevronLeft className="size-4" />
        </button>
        <input
          type="date"
          value={selectedDate}
          min={minDate}
          max={maxDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ colorScheme: "normal" }}
          className="flex-1 rounded-sm border border-[var(--border-subtle)] bg-card px-2.5 py-1.5 text-[13px] text-foreground focus:border-[var(--border-accent)] focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={() => shift(1)}
          disabled={selectedDate >= maxDate}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-foreground disabled:opacity-30 transition-all"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {day === undefined && (
          <p className="py-6 text-center text-[13px] text-[var(--text-tertiary)]">
            Loading…
          </p>
        )}
        {day !== undefined && isEmpty && (
          <EmptyNote variant="plain">
            Nothing tracked for this goal on this day.
          </EmptyNote>
        )}
        {day !== undefined && !isEmpty && (
          <GoalDayLists
            routines={routines}
            tasks={tasks}
            selectedDate={selectedDate}
          />
        )}
      </div>
    </div>
  );
}
