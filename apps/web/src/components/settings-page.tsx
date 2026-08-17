import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { DEFAULT_ROUTINE_WEIGHT } from "@cadence/shared";
import { Button } from "@/components/ui/button";
import { AccountSection, AppearanceSection, DataSection, Section } from "./settings-sections";
import { LayoutSection } from "./settings-layout-section";
import { PageHeader } from "./page-header";

function ProductivitySection() {
  const me = useQuery(api.users.getMe);
  const setRoutineWeight = useMutation(api.users.setRoutineWeight);

  const effectiveWeight = me?.routineWeight ?? DEFAULT_ROUTINE_WEIGHT;
  const routinePct = Math.round(effectiveWeight * 100);
  const taskPct = 100 - routinePct;

  const handleChange = (pct: number) => {
    const next = Math.max(0, Math.min(100, pct)) / 100;
    void setRoutineWeight({ routineWeight: next });
  };

  const isDefault = me?.routineWeight === undefined || me?.routineWeight === DEFAULT_ROUTINE_WEIGHT;

  return (
    <Section
      title="Productivity scoring"
      description="Controls how much your daily routines count toward your productivity score vs. one-off tasks."
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] font-semibold text-foreground">Routine weight</span>
          <span className="font-mono text-[12px] text-[var(--text-secondary)]">
            <span className="text-foreground font-bold">{routinePct}%</span>
            <span className="text-[var(--text-tertiary)]"> routines  ·  </span>
            <span className="text-foreground font-bold">{taskPct}%</span>
            <span className="text-[var(--text-tertiary)]"> tasks</span>
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={routinePct}
          onChange={(e) => handleChange(Number(e.target.value))}
          aria-label="Routine weight"
          className="w-full accent-[var(--action-primary)]"
          disabled={me === undefined}
        />
        <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
          <span>0% — tasks only</span>
          <span>100% — routines only</span>
        </div>
        {!isDefault && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => handleChange(DEFAULT_ROUTINE_WEIGHT * 100)}
          >
            Reset to default ({Math.round(DEFAULT_ROUTINE_WEIGHT * 100)}/
            {100 - Math.round(DEFAULT_ROUTINE_WEIGHT * 100)})
          </Button>
        )}
      </div>
    </Section>
  );
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-[22px]">
      <PageHeader title="Settings" subtitle="Manage your account and preferences." />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <AccountSection />
          <AppearanceSection />
          <LayoutSection />
        </div>
        <div className="flex flex-col gap-4">
          <ProductivitySection />
          <DataSection />
        </div>
      </div>
    </div>
  );
}
