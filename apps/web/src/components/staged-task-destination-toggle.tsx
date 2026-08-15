import { Button } from "@/components/ui/button";

export type StagedTaskDestination = "task" | "routine";

interface DestinationToggleProps {
  value: StagedTaskDestination;
  disabled: boolean;
  onChange: (d: StagedTaskDestination) => void;
}

// The prototype's bordered 20px segment control — the same one the schedule
// chips use, so it is the shared Button variant, not a third copy (D15).
export function StagedTaskDestinationToggle({ value, disabled, onChange }: DestinationToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {(["task", "routine"] as StagedTaskDestination[]).map((d) => (
        <Button
          key={d}
          variant="segment"
          size="sm"
          selected={value === d}
          onClick={() => onChange(d)}
          disabled={disabled}
        >
          {d === "task" ? "Daily task" : "Routine"}
        </Button>
      ))}
    </div>
  );
}
