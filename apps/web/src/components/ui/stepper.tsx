import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Rendered after the number, e.g. "min (1h)" or a goal's unit. */
  suffix?: string;
  className?: string;
}

/**
 * `− [value] +` — the composer's only numeric input idiom.
 *
 * The number is a real text field, not a read-only display. A target of 56
 * pages or 23 check-ins must be typeable; making it button-only would mean 56
 * clicks. The buttons are for nudging, the field is for setting.
 *
 * Typing is held in local string state so a half-typed value ("" or "1" on the
 * way to "12") does not get clamped out from under the cursor. It commits on
 * every valid keystroke and normalises on blur.
 */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  suffix,
  className,
}: StepperProps) {
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Follow external changes — the +/- buttons, or a reset — but never while the
  // field has focus. Re-syncing mid-keystroke made the box fight the typist:
  // typing "12" into a field showing "2" briefly reads "212", clamps to the
  // maximum, and the caret lands after a number nobody typed.
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setDraft(String(value));
  }, [value]);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  // While typing, the draft is the user's; only in-range values are published.
  // Out-of-range input is left visible and settled on blur, so the number never
  // changes under the caret.
  const commit = (raw: string) => {
    setDraft(raw);
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) return;
    if (n >= min && n <= max) onChange(Math.round(n));
  };

  const settle = () => {
    const n = Number(draft);
    const next = draft.trim() === "" || !Number.isFinite(n) ? value : clamp(Math.round(n));
    onChange(next);
    setDraft(String(next));
  };

  const btn =
    "flex size-6 shrink-0 items-center justify-center rounded-sm border border-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-default)] hover:text-foreground disabled:opacity-40 disabled:hover:border-[var(--border-subtle)]";

  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <label className="text-[11.5px] text-[var(--text-secondary)]">{label}</label>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className={btn}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          <Minus className="size-3" strokeWidth={2.5} />
        </button>

        <span className="flex items-baseline gap-1 rounded-sm border border-[var(--border-subtle)] bg-[var(--surface-card)] px-2 py-1 focus-within:border-[var(--border-accent)]">
          <input
            type="text"
            inputMode="numeric"
            aria-label={label}
            value={draft}
            ref={inputRef}
            onChange={(e) => commit(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={settle}
            className="w-[3.5ch] bg-transparent text-right font-mono text-[11.5px] font-semibold tabular-nums text-foreground outline-none"
          />
          {suffix ? (
            <span className="whitespace-nowrap text-[10px] text-[var(--text-tertiary)]">
              {suffix}
            </span>
          ) : null}
        </span>

        <button
          type="button"
          aria-label={`Increase ${label}`}
          className={btn}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + step))}
        >
          <Plus className="size-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
