import { RotateCcw } from "lucide-react";
import { formatCountdown } from "@cadence/shared";

import { Badge } from "@/components/ui/badge";

interface TaskRepeatControlProps {
  doneToday: number;
  target: number;
  remaining: number;
  onUndo: () => void;
  readOnly?: boolean;
}

// The right-hand cluster for a repeat task: how many of today's reps are done,
// the live countdown while the interval gate is closed, and an undo for the
// last rep. The rep action itself is the row's main toggle — this is status.
export function TaskRepeatControl({
  doneToday,
  target,
  remaining,
  onUndo,
  readOnly,
}: TaskRepeatControlProps) {
  const complete = doneToday >= target;

  return (
    <>
      <Badge tone={complete ? "success" : "accent"}>
        <span className="font-mono">
          {doneToday}/{target}
        </span>
      </Badge>
      {remaining > 0 && (
        <Badge tone="neutral" title="Minimum wait between check-ins">
          <span className="font-mono">{formatCountdown(remaining)}</span>
        </Badge>
      )}
      {!readOnly && doneToday > 0 && (
        <button
          type="button"
          onClick={onUndo}
          aria-label="Undo the last check-in"
          title="Undo the last check-in"
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150"
        >
          <RotateCcw className="size-3.5" />
        </button>
      )}
    </>
  );
}
