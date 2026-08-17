import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { todayLocal } from "@cadence/shared";
import { useState } from "react";
import type { ScheduleType } from "./routines-schedule-form";
import { ActiveRoutineRow } from "./routines-active-row";
import { ArchivedRoutineRow } from "./routines-archived-row";
import { RoutineFormDrawer, type RoutineFormValues } from "./routine-form-drawer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageHeader } from "./page-header";
import { ListGrid } from "@/components/ui/list-grid";
import { useListColumns } from "@/lib/use-list-columns";

type Tab = "active" | "archived";

export function RoutinesPage() {
  const today = todayLocal();
  const allRoutines = useQuery(api.routines.list, { includeArchived: true, today });
  const activeGoals = useQuery(api.goals.list, {});
  const [tab, setTab] = useState<Tab>("active");
  const { columns } = useListColumns();
  // null = closed; { routine: undefined } = create; { routine } = edit.
  const [form, setForm] = useState<{ routine?: RoutineFormValues } | null>(null);

  const goalTitleById = new Map((activeGoals ?? []).map((g) => [g._id, g.title]));

  const active = (allRoutines ?? []).filter((r) => r.isActive);
  const archived = (allRoutines ?? []).filter((r) => !r.isActive);

  return (
    <div className="flex flex-col gap-[22px]">
      <PageHeader
        title="Routines"
        subtitle="Manage your recurring habits — create, edit, and archive."
        tabs={[
          { id: "active", label: "Active", count: active.length },
          { id: "archived", label: "Archived", count: archived.length },
        ]}
        active={tab}
        onTabChange={setTab}
        action={
          <Button onClick={() => setForm({})}>
            <Plus className="size-3.5" /> New routine
          </Button>
        }
      />

      {allRoutines === undefined && (
        <p className="text-[13px] text-[var(--text-secondary)]">Loading…</p>
      )}

      {tab === "active" && allRoutines !== undefined && (
        <section className="flex flex-col gap-2.5">
          {active.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--border-subtle)] bg-card px-4 py-8 text-center text-[13px] text-[var(--text-tertiary)]">
              No active routines. Add one below to get started.
            </p>
          ) : (
            <ListGrid columns={columns.routines}>
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
                    goalTitle: r.goalId
                      ? (goalTitleById.get(r.goalId as Id<"goals">) ?? undefined)
                      : undefined,
                    // Must be carried through: the edit form submits every
                    // field, so omitting these would silently strip the repeat
                    // settings.
                    repeatTarget: r.repeatTarget,
                    repeatIntervalMinutes: r.repeatIntervalMinutes,
                  }}
                  today={today}
                  onEdit={() =>
                    setForm({
                      routine: {
                        _id: r._id,
                        name: r.name,
                        description: r.description,
                        scheduleType: r.scheduleType as ScheduleType,
                        customDays: r.customDays,
                        goalId: r.goalId as Id<"goals"> | undefined,
                        goalContribution: r.goalContribution,
                        repeatTarget: r.repeatTarget,
                        repeatIntervalMinutes: r.repeatIntervalMinutes,
                      },
                    })
                  }
                />
              ))}
            </ListGrid>
          )}
        </section>
      )}

      {tab === "archived" && allRoutines !== undefined && (
        <section className="flex flex-col gap-2.5">
          {archived.length === 0 ? (
            <p className="rounded-md border border-dashed border-[var(--border-subtle)] bg-card px-4 py-8 text-center text-[13px] text-[var(--text-tertiary)]">
              Nothing archived yet.
            </p>
          ) : (
            <ListGrid columns={columns.routines}>
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
            </ListGrid>
          )}
        </section>
      )}

      {form && (
        <RoutineFormDrawer routine={form.routine} onClose={() => setForm(null)} />
      )}
    </div>
  );
}
