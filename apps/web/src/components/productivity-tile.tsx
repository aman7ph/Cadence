import { useState } from "react";
import { useMutation } from "convex/react";
import { SlidersHorizontal } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import { DEFAULT_ROUTINE_WEIGHT } from "@cadence/shared";

import { StatCard } from "@/components/ui/stat-card";

interface ProductivityTileProps {
  value: number;
  delta: string;
  routineWeight: number | undefined;
}

export function ProductivityTile({
  value,
  delta,
  routineWeight,
}: ProductivityTileProps) {
  const setRoutineWeight = useMutation(api.users.setRoutineWeight);
  const [open, setOpen] = useState(false);

  const effectiveWeight = routineWeight ?? DEFAULT_ROUTINE_WEIGHT;
  const routinePct = Math.round(effectiveWeight * 100);
  const randomPct = 100 - routinePct;

  const handleChange = (pct: number) => {
    const next = Math.max(0, Math.min(100, pct)) / 100;
    void setRoutineWeight({ routineWeight: next });
  };

  return (
    <div className="relative">
      <StatCard
        label="Productivity"
        value={value}
        unit="%"
        delta={delta}
        deltaDir="flat"
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Adjust productivity weight"
        aria-expanded={open}
        className="absolute top-3.5 right-3.5 inline-flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-tertiary)] hover:text-foreground hover:bg-[var(--surface-hover)] focus-visible:bg-[var(--surface-hover)] focus-visible:outline-none transition-colors"
      >
        <SlidersHorizontal className="size-4" />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full mt-2 z-20 w-72 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-md)] flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h4 className="text-[13px] font-semibold text-foreground">
                Productivity weight
              </h4>
              <p className="text-xs text-muted-foreground">
                How much routines outweigh random tasks in the score.
              </p>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={routinePct}
              onChange={(e) => handleChange(Number(e.target.value))}
              aria-label="Routine weight"
              className="w-full accent-[var(--indigo-600,_#4f46e5)]"
            />
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-foreground">
                <span className="font-bold">{routinePct}%</span> Routines
              </span>
              <span className="text-muted-foreground">
                <span className="font-bold">{randomPct}%</span> Tasks
              </span>
            </div>
            {routineWeight !== undefined &&
              routineWeight !== DEFAULT_ROUTINE_WEIGHT && (
                <button
                  type="button"
                  onClick={() => handleChange(DEFAULT_ROUTINE_WEIGHT * 100)}
                  className="self-start text-[11px] font-semibold text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Reset to default ({Math.round(DEFAULT_ROUTINE_WEIGHT * 100)}/
                  {100 - Math.round(DEFAULT_ROUTINE_WEIGHT * 100)})
                </button>
              )}
          </div>
        </>
      )}
    </div>
  );
}
