import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { StagedTaskRow } from "./staged-task-row";
import { StagedTaskFormDrawer, type StagedTaskFormValues } from "./staged-task-form-drawer";
import { StagedTaskScheduleDrawer } from "./staged-task-schedule-drawer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Doc } from "@cadence/backend/convex/_generated/dataModel";
import { PageHeader } from "./page-header";
import { ListGrid } from "@/components/ui/list-grid";
import { useListColumns } from "@/lib/use-list-columns";

type Tab = "unscheduled" | "scheduled";

export function StagingPage() {
  const stagedTasks = useQuery(api.stagedTasks.list, {});
  const activeGoals = useQuery(api.goals.list, {});
  const [tab, setTab] = useState<Tab>("unscheduled");
  // Exactly one drawer is open at a time; both are mounted on demand so opening
  // one always seeds fresh fields.
  const [form, setForm] = useState<{ stagedTask?: StagedTaskFormValues } | null>(null);
  const [scheduling, setScheduling] = useState<Doc<"stagedTasks"> | null>(null);
  const { columns } = useListColumns();

  const goalTitleById = new Map((activeGoals ?? []).map((g) => [g._id, g.title]));

  const unscheduled = (stagedTasks ?? []).filter((t) => t.scheduledDate === undefined);
  const scheduled = (stagedTasks ?? []).filter((t) => t.scheduledDate !== undefined);
  const shown = tab === "unscheduled" ? unscheduled : scheduled;

  return (
    <div className="flex flex-col gap-[22px]">
      <PageHeader
        title="Staging"
        subtitle="Capture tasks now — assign them to a routine or a day later."
        tabs={[
          { id: "unscheduled", label: "Unscheduled", count: unscheduled.length },
          { id: "scheduled", label: "Scheduled", count: scheduled.length },
        ]}
        active={tab}
        onTabChange={setTab}
        action={
          <Button onClick={() => setForm({})}>
            <Plus className="size-3.5" /> New task
          </Button>
        }
      />

      <section className="flex flex-col gap-2.5">
        {stagedTasks === undefined && (
          <p className="text-[13px] text-[var(--text-secondary)]">Loading…</p>
        )}

        {stagedTasks !== undefined && shown.length === 0 && (
          <p className="text-[13px] text-[var(--text-tertiary)] rounded-md border border-dashed border-[var(--border-subtle)] bg-card px-4 py-8 text-center">
            {tab === "unscheduled"
              ? "Nothing staged yet. Captured tasks wait here until you schedule them."
              : "Nothing scheduled. Schedule a staged task and it will wait here until its day arrives."}
          </p>
        )}

        <ListGrid columns={columns.staging}>
          {shown.map((t) => (
            <StagedTaskRow
              key={t._id}
              stagedTask={t}
              goalTitle={t.goalId ? goalTitleById.get(t.goalId) : undefined}
              onEdit={() =>
                setForm({
                  stagedTask: {
                    _id: t._id,
                    title: t.title,
                    description: t.description,
                  },
                })
              }
              onSchedule={() => setScheduling(t)}
            />
          ))}
        </ListGrid>

      </section>

      {form && (
        <StagedTaskFormDrawer
          stagedTask={form.stagedTask}
          onClose={() => setForm(null)}
        />
      )}
      {scheduling && (
        <StagedTaskScheduleDrawer
          stagedTask={scheduling}
          onClose={() => setScheduling(null)}
        />
      )}
    </div>
  );
}
