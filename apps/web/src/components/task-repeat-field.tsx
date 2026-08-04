import { MAX_REPEAT_TARGET, MIN_REPEAT_TARGET } from "@cadence/shared";

// Minutes offered as the minimum wait between check-ins. 0 is a legitimate
// choice — N times today, whenever you like.
const INTERVAL_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "No minimum wait" },
  { value: 15, label: "15 minutes apart" },
  { value: 30, label: "30 minutes apart" },
  { value: 60, label: "1 hour apart" },
  { value: 120, label: "2 hours apart" },
  { value: 240, label: "4 hours apart" },
  { value: 480, label: "8 hours apart" },
];

interface TaskRepeatFieldProps {
  target: string;
  interval: string;
  onTargetChange: (value: string) => void;
  onIntervalChange: (value: string) => void;
}

// Count + interval for a repeatable task, shown in the same expanding panel
// idiom the goal picker already uses in this form.
export function TaskRepeatField({
  target,
  interval,
  onTargetChange,
  onIntervalChange,
}: TaskRepeatFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={MIN_REPEAT_TARGET}
        max={MAX_REPEAT_TARGET}
        value={target}
        onChange={(e) => onTargetChange(e.target.value)}
        placeholder="times"
        aria-label="How many times today"
        className="w-24 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-2 py-1.5 text-[13px] text-foreground placeholder:text-[var(--text-tertiary)] focus:border-[var(--action-primary)] focus:outline-none transition-colors"
      />
      <span className="text-[12px] text-[var(--text-tertiary)] shrink-0">
        times today,
      </span>
      <select
        value={interval}
        onChange={(e) => onIntervalChange(e.target.value)}
        aria-label="Minimum wait between check-ins"
        className="flex-1 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-1.5 text-[13px] text-foreground focus:border-[var(--action-primary)] focus:outline-none transition-colors"
      >
        {INTERVAL_OPTIONS.map((o) => (
          <option key={o.value} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
