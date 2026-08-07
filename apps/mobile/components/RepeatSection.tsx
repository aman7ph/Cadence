import { RepeatFields } from "./RepeatFields";
import { RepeatPill } from "./RepeatPill";
import type { useRepeatFields } from "../lib/useRepeatFields";

// Pill + panel, the whole repeat block of a bottom-sheet form. Shared by the
// routine form and the staged-task assign modal, which rendered it identically.
// AddTaskBar is deliberately not a caller — its toggle is an inline ↻ icon
// button in the capture row, not a labelled pill.
export function RepeatSection({
  repeat,
  cadenceLabel = "each day",
  disabled,
}: {
  repeat: ReturnType<typeof useRepeatFields>;
  cadenceLabel?: string;
  disabled?: boolean;
}) {
  return (
    <>
      <RepeatPill enabled={repeat.enabled} onToggle={repeat.toggle} disabled={disabled} />
      {repeat.enabled && (
        <RepeatFields
          target={repeat.target}
          interval={repeat.interval}
          error={repeat.error}
          disabled={disabled}
          cadenceLabel={cadenceLabel}
          onTargetChange={repeat.setTarget}
          onIntervalChange={repeat.setInterval}
        />
      )}
    </>
  );
}
