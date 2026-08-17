import { useState } from "react";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { api } from "@cadence/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { GoalDetail } from "./goal-detail";
import { GoalCreateForm } from "./goal-create-form";
import { GoalRow } from "./goal-row";
import { PageHeader } from "./page-header";
import { ListGrid } from "@/components/ui/list-grid";
import { useListColumns } from "@/lib/use-list-columns";

type Tab = "active" | "completed" | "abandoned";

export function GoalsPage() {
  const goalsWithCounts = useQuery(api.goalLinks.getWithLinkedCounts);
  const allGoals = useQuery(api.goals.list, { includeInactive: true });

  const [tab, setTab] = useState<Tab>("active");
  const [openGoalId, setOpenGoalId] = useState<Id<"goals"> | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { columns } = useListColumns();

  const active = goalsWithCounts ?? [];
  const completed = (allGoals ?? []).filter((g) => g.status === "completed");
  const abandoned = (allGoals ?? []).filter((g) => g.status === "abandoned");

  // Linked counts only exist for active goals (getWithLinkedCounts); the
  // completed/abandoned lists come from goals.list, so the shape is widened
  // here rather than branching in the row.
  const rows: Array<{
    goal: (typeof active)[number]["goal"] | (typeof completed)[number];
    routineCount?: number;
    taskCount?: number;
  }> =
    tab === "active"
      ? active.map((g) => ({
          goal: g.goal,
          routineCount: g.routineCount,
          taskCount: g.taskCount,
        }))
      : (tab === "completed" ? completed : abandoned).map((g) => ({ goal: g }));

  return (
    <div className="flex flex-col gap-[22px]">
      <PageHeader
        title="Goals"
        subtitle="The long game — fed automatically by the routines and tasks you finish."
        tabs={[
          { id: "active", label: "Active", count: active.length },
          { id: "completed", label: "Completed", count: completed.length },
          { id: "abandoned", label: "Abandoned", count: abandoned.length },
        ]}
        active={tab}
        onTabChange={setTab}
        action={
          tab === "active" && !showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="size-3.5" /> New goal
            </Button>
          ) : undefined
        }
      />

      {showCreateForm && (
        <GoalCreateForm
          onCreated={(id) => {
            setShowCreateForm(false);
            setOpenGoalId(id);
          }}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {allGoals === undefined && (
        <p className="text-[13px] text-[var(--text-secondary)]">Loading…</p>
      )}

      {allGoals !== undefined && rows.length === 0 && (
        <p className="rounded-md border border-dashed border-[var(--border-subtle)] bg-card px-4 py-8 text-center text-[13px] text-[var(--text-tertiary)]">
          {tab === "active"
            ? "No active goals yet. Create one to start tracking the long game."
            : `Nothing ${tab} yet.`}
        </p>
      )}

      <ListGrid columns={columns.goals}>
        {rows.map(({ goal, routineCount, taskCount }) => (
          <GoalRow
            key={goal._id}
            goal={goal}
            routineCount={routineCount}
            taskCount={taskCount}
            onOpen={() => setOpenGoalId(goal._id)}
          />
        ))}
      </ListGrid>

      <Drawer
        open={openGoalId !== null}
        onOpenChange={(o) => !o && setOpenGoalId(null)}
        label="Goal detail"
        closeLabel="Close"
        className="w-[513px] max-w-full px-7 py-6"
      >
        {openGoalId && (
          <GoalDetail goalId={openGoalId} onBack={() => setOpenGoalId(null)} />
        )}
      </Drawer>
    </div>
  );
}
