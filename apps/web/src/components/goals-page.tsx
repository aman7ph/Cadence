import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { api } from "@cadence/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { GoalConfirmDrawers, type GoalConfirm } from "./goal-confirm-drawers";
import { GoalDetail } from "./goal-detail";
import { GoalFormDrawer, type GoalFormValues } from "./goal-form-drawer";
import { GoalRow } from "./goal-row";
import { PageHeader } from "./page-header";
import { ListGrid } from "@/components/ui/list-grid";
import { useListColumns } from "@/lib/use-list-columns";
import { EmptyNote } from "@/components/ui/empty-note";

type Tab = "active" | "completed" | "abandoned";

export function GoalsPage() {
  const goalsWithCounts = useQuery(api.goalLinks.getWithLinkedCounts);
  const allGoals = useQuery(api.goals.list, { includeInactive: true });

  const [tab, setTab] = useState<Tab>("active");
  const [openGoalId, setOpenGoalId] = useState<Id<"goals"> | null>(null);
  // null = closed; {} = create; { goal } = edit. Only ONE overlay is ever
  // mounted: opening the edit form hides the detail drawer rather than nesting
  // a dialog inside a dialog, which would stack two focus traps.
  const [form, setForm] = useState<{ goal?: GoalFormValues } | null>(null);
  const { columns } = useListColumns();
  const [confirm, setConfirm] = useState<GoalConfirm>(null);

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
          tab === "active" ? (
            <Button onClick={() => setForm({})}>
              <Plus className="size-3.5" /> New goal
            </Button>
          ) : undefined
        }
      />

      {allGoals === undefined && (
        <p className="text-[13px] text-[var(--text-secondary)]">Loading…</p>
      )}

      {allGoals !== undefined && rows.length === 0 && (
        <EmptyNote>
          {tab === "active"
            ? "No active goals yet. Create one to start tracking the long game."
            : `Nothing ${tab} yet.`}
        </EmptyNote>
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
        open={openGoalId !== null && form === null && confirm === null}
        onOpenChange={(o) => !o && setOpenGoalId(null)}
        label="Goal detail"
        size="wide"
        closeLabel="Close"
        className="px-7 pb-6 pt-14"
      >
        {openGoalId && (
          <GoalDetail
            goalId={openGoalId}
            onBack={() => setOpenGoalId(null)}
            onEdit={() => {
              const g = rows.find((r) => r.goal._id === openGoalId)?.goal;
              if (g) setForm({ goal: g });
            }}
            onRequestDelete={() => setConfirm("delete")}
            onRequestComplete={() => setConfirm("complete")}
            onRequestAbandon={() => setConfirm("abandon")}
          />
        )}
      </Drawer>

      <GoalConfirmDrawers
        goalId={openGoalId}
        open={confirm}
        onClose={() => setConfirm(null)}
        onDone={() => {
          setConfirm(null);
          setOpenGoalId(null);
        }}
      />

      {form && (
        <GoalFormDrawer
          goal={form.goal}
          onClose={() => setForm(null)}
          onCreated={(id) => setOpenGoalId(id)}
        />
      )}
    </div>
  );
}
