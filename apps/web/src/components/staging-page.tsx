import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { AddStagedTaskForm } from "./add-staged-task-form";
import { StagedTaskRow } from "./staged-task-row";

type Tab = "unscheduled" | "scheduled";

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition-all ${
        active ? "bg-card shadow-[var(--shadow-sm)] text-foreground" : "text-[var(--text-tertiary)] hover:text-foreground"
      }`}>
      {children}
    </button>
  );
}

export function StagingPage() {
  const stagedTasks = useQuery(api.stagedTasks.list, {});
  const activeGoals = useQuery(api.goals.list, {});
  const [tab, setTab] = useState<Tab>("unscheduled");

  const goalTitleById = new Map((activeGoals ?? []).map((g) => [g._id, g.title]));

  const unscheduled = (stagedTasks ?? []).filter((t) => t.scheduledDate === undefined);
  const scheduled = (stagedTasks ?? []).filter((t) => t.scheduledDate !== undefined);
  const shown = tab === "unscheduled" ? unscheduled : scheduled;

  return (
    <div className="flex flex-col gap-6">
      <header className="pb-1">
        <h1 className="font-display text-[22px] font-bold tracking-tight text-foreground">Staging</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Capture tasks now — assign them to a routine or a day later</p>
      </header>

      <div className="flex items-center gap-1 rounded-[10px] bg-[var(--bg-sunken)] p-1 sm:max-w-[400px]">
        <TabBtn active={tab === "unscheduled"} onClick={() => setTab("unscheduled")}>
          Unscheduled{unscheduled.length > 0 ? ` · ${unscheduled.length}` : ""}
        </TabBtn>
        <TabBtn active={tab === "scheduled"} onClick={() => setTab("scheduled")}>
          Scheduled{scheduled.length > 0 ? ` · ${scheduled.length}` : ""}
        </TabBtn>
      </div>

      <section className="flex flex-col gap-3">
        {stagedTasks === undefined && (
          <p className="text-[13px] text-[var(--text-secondary)]">Loading…</p>
        )}

        {stagedTasks !== undefined && shown.length === 0 && (
          <p className="text-[13px] text-[var(--text-tertiary)] rounded-[12px] border border-dashed border-[var(--border-subtle)] bg-card px-4 py-8 text-center">
            {tab === "unscheduled"
              ? "Nothing staged yet. Captured tasks wait here until you schedule them."
              : "Nothing scheduled. Schedule a staged task and it will wait here until its day arrives."}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
