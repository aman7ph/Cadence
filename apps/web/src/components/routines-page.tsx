import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { todayLocal } from "@cadence/shared";
import { useState } from "react";
import {
  RoutineFormDrawer,
  type RoutineFormValues,
} from "./routine-form-drawer";
import {
  ActiveRoutinesBody,
  ArchivedRoutinesBody,
  type RoutineListItem,
} from "./routines-tab-bodies";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PageHeader } from "./page-header";
import { useListColumns } from "@/lib/use-list-columns";

type Tab = "active" | "archived";

export function RoutinesPage() {
  const today = todayLocal();
  const allRoutines = useQuery(api.routines.list, {
    includeArchived: true,
    today,
  });
  const activeGoals = useQuery(api.goals.list, {});
  const [tab, setTab] = useState<Tab>("active");
  const { columns } = useListColumns();
  // null = closed; { routine: undefined } = create; { routine } = edit.
  const [form, setForm] = useState<{ routine?: RoutineFormValues } | null>(
    null,
  );

  const goalTitleById = new Map(
    (activeGoals ?? []).map((g) => [g._id as string, g.title]),
  );

  const rows = (allRoutines ?? []) as RoutineListItem[];
  const active = rows.filter((r) => r.isActive);
  const archived = rows.filter((r) => !r.isActive);

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
          <ActiveRoutinesBody
            routines={active}
            goalTitleById={goalTitleById}
            columns={columns.routines}
            today={today}
            onEdit={(routine) => setForm({ routine })}
          />
        </section>
      )}

      {tab === "archived" && allRoutines !== undefined && (
        <section className="flex flex-col gap-2.5">
          <ArchivedRoutinesBody
            routines={archived}
            columns={columns.routines}
          />
        </section>
      )}

      {form && (
        <RoutineFormDrawer
          routine={form.routine}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
