import { useMutation, useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { DEFAULT_ROUTINE_WEIGHT } from "@cadence/shared";
import { AccountSection, AppearanceSection, DataSection, Section } from "./settings-sections";

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
          <span className="text-[13px] font-semibold text-foreground">Routine weight</span>
          <span className="text-[13px] font-mono text-[var(--text-secondary)]">
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
          className="w-full accent-[var(--indigo-600)]"
          disabled={me === undefined}
        />
        <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
          <span>0% — tasks only</span>
          <span>100% — routines only</span>
        </div>
        {!isDefault && (
          <button
            type="button"
            onClick={() => handleChange(DEFAULT_ROUTINE_WEIGHT * 100)}
            className="self-start text-[12px] font-semibold text-[var(--text-tertiary)] hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Reset to default ({Math.round(DEFAULT_ROUTINE_WEIGHT * 100)}/{100 - Math.round(DEFAULT_ROUTINE_WEIGHT * 100)})
          </button>
        )}
      </div>
    </Section>
  );
}

export function SettingsPage() {
  return (
    <div className="flex flex-col gap-5">
      <header className="pb-1">
        <h1 className="font-display text-[22px] font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Manage your account and preferences</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="flex flex-col gap-5">
          <AccountSection />
          <AppearanceSection />
        </div>
        <div className="flex flex-col gap-5">
          <ProductivitySection />
          <DataSection />
        </div>
      </div>
    </div>
  );
}
