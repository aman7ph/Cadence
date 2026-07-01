import { useQuery } from "convex/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { useState } from "react";
import type { ScheduleType } from "./routines-schedule-form";
import { ActiveRoutineRow } from "./routines-active-row";
import { ArchivedRoutineRow } from "./routines-archived-row";
import { CreateRoutineForm } from "./routines-create-form";

export function RoutinesPage() {
  const today = todayLocal();
  const allRoutines = useQuery(api.routines.list, { includeArchived: true });
  const activeGoals = useQuery(api.goals.list, {});
  const [archivedOpen, setArchivedOpen] = useState(false);

  const goalTitleById = new Map((activeGoals ?? []).map((g) => [g._id, g.title]));

  const active = (allRoutines ?? []).filter((r) => r.isActive);
  const archived = (allRoutines ?? []).filter((r) => !r.isActive);

  return (
    <div className="flex flex-col gap-6">
      <header className="pb-1">
        <h1 className="font-display text-[22px] font-bold tracking-tight text-foreground">Routines</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage your recurring habits — create, edit, and archive</p>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[var(--text-tertiary)]">Active</h2>
          <span className="text-[12px] text-[var(--text-tertiary)] font-mono">
            {active.length} routine{active.length !== 1 ? "s" : ""}
          </span>
        </div>

        {allRoutines === undefined && (
          <p className="text-[13px] text-[var(--text-secondary)]">Loading…</p>
        )}
        {allRoutines !== undefined && active.length === 0 && (
          <p className="text-[13px] text-[var(--text-tertiary)] rounded-[12px] border border-dashed border-[var(--border-subtle)] bg-card px-4 py-8 text-center">
            No active routines. Add one below to get started.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {active.map((r) => (
            <ActiveRoutineRow
              key={r._id}
              routine={{
                _id: r._id,
                name: r.name,
                description: r.description,
                scheduleType: r.scheduleType as ScheduleType,
                customDays: r.customDays,
                currentStreak: r.currentStreak,
                longestStreak: r.longestStreak,
                goalId: r.goalId as Id<"goals"> | undefined,
                goalContribution: r.goalContribution,
                goalTitle: r.goalId ? (goalTitleById.get(r.goalId as Id<"goals">) ?? undefined) : undefined,
              }}
              today={today}
            />
          ))}
        </div>

        <CreateRoutineForm />
      </section>

      {archived.length > 0 && (
        <section className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setArchivedOpen((o) => !o)}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.10em] text-[var(--text-tertiary)] hover:text-foreground transition-colors"
          >
            {archivedOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            Archived
            <span className="font-mono font-normal normal-case tracking-normal text-[var(--text-tertiary)]/60">
              ({archived.length})
            </span>
          </button>

          {archivedOpen && (
            <div className="flex flex-col gap-2">
              {archived.map((r) => (
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
            </div>
          )}
        </section>
      )}
    </div>
  );
}
