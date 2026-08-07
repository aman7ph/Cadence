import { RepeatField } from "./repeat-field";
import { RepeatToggle } from "./repeat-toggle";
import type { useRepeatFields } from "@/lib/use-repeat-fields";

// Toggle + panel + error, the whole repeat block of a creation form. All three
// forms (routine create, routine edit, staged-task assign) rendered the same
// fourteen lines; this is that block, once.
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
      <RepeatToggle enabled={repeat.enabled} onToggle={repeat.toggle} />
      {repeat.enabled && (
        <RepeatField
          target={repeat.target}
          interval={repeat.interval}
          onTargetChange={repeat.setTarget}
          onIntervalChange={repeat.setInterval}
          cadenceLabel={cadenceLabel}
          disabled={disabled}
        />
      )}
      {repeat.error && (
        <p className="text-[12px] text-[var(--red-600)]">{repeat.error}</p>
      )}
    </>
  );
}
