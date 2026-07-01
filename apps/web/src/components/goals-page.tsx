import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { Target } from "lucide-react";
import type { Id } from "@cadence/backend/convex/_generated/dataModel";
import { api } from "@cadence/backend/convex/_generated/api";
import { GoalDetail } from "./goal-detail";
import { GoalCreateForm } from "./goal-create-form";
import { GoalList } from "./goal-list";

function formatDateShort(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

type Tab = "active" | "completed" | "abandoned";

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

export function GoalsPage() {
  const goalsWithCounts = useQuery(api.goalLinks.getWithLinkedCounts);
  const allGoals = useQuery(api.goals.list, { includeInactive: true });

  const [tab, setTab] = useState<Tab>("active");
  const [selectedGoalId, setSelectedGoalId] = useState<Id<"goals"> | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const completed = (allGoals ?? []).filter((g) => g.status === "completed");
  const abandoned = (allGoals ?? []).filter((g) => g.status === "abandoned");
  const inactiveList = tab === "completed" ? completed : abandoned;

  // Auto-select first active goal when data first arrives
  useEffect(() => {
    if (selectedGoalId !== null) return;
    const first = goalsWithCounts?.[0]?.goal._id;
    if (first) setSelectedGoalId(first);
  }, [goalsWithCounts]); // eslint-disable-line react-hooks/exhaustive-deps

  function switchTab(t: Tab) {
    setTab(t);
    const first = t === "active" ? goalsWithCounts?.[0]?.goal._id ?? null
      : t === "completed" ? completed[0]?._id ?? null
      : abandoned[0]?._id ?? null;
    setSelectedGoalId(first);
  }

  return (
    <div className="grid grid-cols-[2fr_3fr] items-start gap-6">
      {/* LEFT: sticky scrollable panel */}
      <div className="sticky top-0 flex h-[calc(100vh-2.25rem)] flex-col gap-4 overflow-hidden">
        <div className="flex shrink-0 items-center justify-between">
          <h1 className="font-display text-[24px] font-bold tracking-tight text-foreground">Goals</h1>
          {tab === "active" && !showCreateForm && (
            <button type="button" onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--action-primary)] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[var(--shadow-accent)] hover:bg-[var(--action-primary-hover)] transition-colors">
              <Target className="size-3.5" /> New goal
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-[10px] bg-[var(--bg-sunken)] p-1">
          <TabBtn active={tab === "active"} onClick={() => switchTab("active")}>
            Active{(goalsWithCounts?.length ?? 0) > 0 ? ` · ${goalsWithCounts!.length}` : ""}
          </TabBtn>
          <TabBtn active={tab === "completed"} onClick={() => switchTab("completed")}>
            Completed{completed.length > 0 ? ` · ${completed.length}` : ""}
          </TabBtn>
          <TabBtn active={tab === "abandoned"} onClick={() => switchTab("abandoned")}>
            Abandoned{abandoned.length > 0 ? ` · ${abandoned.length}` : ""}
          </TabBtn>
        </div>

        {tab === "active" && showCreateForm && (
          <div className="shrink-0">
            <GoalCreateForm
              onCreated={(id) => { setShowCreateForm(false); setSelectedGoalId(id); }}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {tab === "active" ? (
            <GoalList goalsWithCounts={goalsWithCounts} selectedGoalId={selectedGoalId} onSelect={setSelectedGoalId} />
          ) : (
            <div className="flex flex-col gap-1.5">
              {inactiveList.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-[var(--text-tertiary)]">
                  {tab === "completed" ? "No completed goals yet." : "No abandoned goals."}
                </p>
              ) : inactiveList.map((goal) => (
                <button key={goal._id} type="button" onClick={() => setSelectedGoalId(goal._id)}
                  className={`flex w-full items-center gap-2.5 rounded-[12px] border px-3.5 py-3 text-left transition-all ${
                    selectedGoalId === goal._id
                      ? "border-[var(--border-accent)] bg-[var(--surface-accent)]"
                      : "border-[var(--border-subtle)] bg-card hover:shadow-[var(--shadow-sm)]"
                  }`}>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: tab === "completed" ? "var(--status-complete)" : "var(--text-tertiary)" }} />
                  <span className="flex-1 truncate text-[13px] text-[var(--text-secondary)]">{goal.title}</span>
                  {goal.completedAt && (
                    <span className="shrink-0 text-[10px] text-[var(--status-complete)]">{formatDateShort(goal.completedAt)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: detail panel */}
      <div className="sticky top-0 h-[calc(100vh-2.25rem)] min-w-0 overflow-hidden">
        {selectedGoalId ? (
          <GoalDetail goalId={selectedGoalId} onBack={() => setSelectedGoalId(null)} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-[var(--border-subtle)] py-20 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-accent)]">
              <Target className="size-6 text-[var(--text-accent)]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">Select a goal</p>
              <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">Click a goal on the left to see its details here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
