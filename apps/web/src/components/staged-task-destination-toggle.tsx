import { cn } from "@/lib/utils";

export type StagedTaskDestination = "task" | "routine";

interface DestinationToggleProps {
  value: StagedTaskDestination;
  disabled: boolean;
  onChange: (d: StagedTaskDestination) => void;
}

// Pill toggle styled like ScheduleForm's schedule-type pills.
export function StagedTaskDestinationToggle({ value, disabled, onChange }: DestinationToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {(["task", "routine"] as StagedTaskDestination[]).map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          disabled={disabled}
          className={cn(
            "h-8 rounded-full border px-3.5 text-[12px] font-semibold transition-all duration-150",
            value === d
              ? "border-[var(--border-accent)] bg-[var(--surface-accent)] text-[var(--text-accent)]"
              : "border-[var(--border-subtle)] bg-card text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground",
          )}
        >
          {d === "task" ? "Daily task" : "Routine"}
        </button>
      ))}
    </div>
  );
}
