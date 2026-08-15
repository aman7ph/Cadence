import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { AddStagedTaskForm } from "./add-staged-task-form";
import { StagedTaskRow } from "./staged-task-row";
import { PageHeader } from "./page-header";

type Tab = "unscheduled" | "scheduled";

export function StagingPage() {
  const stagedTasks = useQuery(api.stagedTasks.list, {});
  const activeGoals = useQuery(api.goals.list, {});
  const [tab, setTab] = useState<Tab>("unscheduled");

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

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
          {shown.map((t) => (
            <StagedTaskRow
              key={t._id}
              stagedTask={t}
              goalTitle={t.goalId ? goalTitleById.get(t.goalId) : undefined}
            />
          ))}
        </div>

        {tab === "unscheduled" && <AddStagedTaskForm />}
      </section>
    </div>
  );
}
