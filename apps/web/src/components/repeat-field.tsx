import { Repeat } from "lucide-react";
import {
  MAX_REPEAT_INTERVAL_MINUTES,
  MAX_REPEAT_TARGET,
  MIN_REPEAT_TARGET,
  formatIntervalMinutes,
} from "@cadence/shared";

const NUMBER_INPUT =
  "w-[72px] rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-2.5 py-1.5 text-[13px] font-mono text-foreground placeholder:text-[var(--text-tertiary)] focus:border-[var(--action-primary)] focus:outline-none transition-colors";
const LABEL = "text-[13px] text-[var(--text-secondary)] shrink-0";

interface RepeatFieldProps {
  target: string;
  interval: string;
  onTargetChange: (value: string) => void;
  onIntervalChange: (value: string) => void;
  /** "today" for tasks, "each day" for routines — the only wording difference. */
  cadenceLabel?: string;
  disabled?: boolean;
}

// Count + interval for a repeatable task or routine. The interval is
// free-entry minutes rather than a preset list — the backend accepts any whole
// 0..1440, and a fixed menu would rule out ordinary choices like 45. The
// humanized echo ("1h 30m") is what keeps "90" from being read as hours.
export function RepeatField({
  target,
  interval,
  onTargetChange,
  onIntervalChange,
  cadenceLabel = "today",
  disabled,
}: RepeatFieldProps) {
  const echo = interval.trim() === "" ? null : formatIntervalMinutes(Number(interval));

  return (
    <div className="flex flex-col gap-2.5 rounded-[12px] border border-[var(--border-subtle)] bg-card p-3.5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.10em] text-[var(--text-tertiary)]">
        <Repeat className="size-3" />
        Repeat {cadenceLabel}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={LABEL}>Complete it</span>
        <input
          type="number"
          min={MIN_REPEAT_TARGET}
          max={MAX_REPEAT_TARGET}
          value={target}
          onChange={(e) => onTargetChange(e.target.value)}
          placeholder="20"
          disabled={disabled}
          aria-label={`How many times ${cadenceLabel}`}
          className={NUMBER_INPUT}
        />
        <span className={LABEL}>times {cadenceLabel}, at least</span>
        <input
          type="number"
          min={0}
          max={MAX_REPEAT_INTERVAL_MINUTES}
          value={interval}
          onChange={(e) => onIntervalChange(e.target.value)}
          placeholder="60"
          disabled={disabled}
          aria-label="Minimum minutes between check-ins"
          className={NUMBER_INPUT}
        />
        <span className={LABEL}>minutes apart</span>
        {echo && (
          <span className="rounded-full bg-[var(--surface-active)] px-2 py-0.5 text-[11px] font-mono text-[var(--text-secondary)]">
            {echo}
          </span>
        )}
      </div>
    </div>
  );
}
