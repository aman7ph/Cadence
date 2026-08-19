import { Repeat } from "lucide-react";
import { Stepper } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";

interface ComposerSpreadPanelProps {
  enabled: boolean;
  onEnabledChange: (on: boolean) => void;
  target: number;
  onTargetChange: (n: number) => void;
  intervalMinutes: number;
  onIntervalChange: (n: number) => void;
}

function humaniseGap(m: number): string {
  if (m === 0) return "min (no wait)";
  if (m < 60) return "min";
  const h = m / 60;
  return `min (${Number.isInteger(h) ? h : h.toFixed(1)}h)`;
}

/**
 * Right half of the composer: "spread across the day", off by default behind a
 * switch. Bounds match the shared validators (target 2–100, gap 0–1440).
 */
export function ComposerSpreadPanel({
  enabled,
  onEnabledChange,
  target,
  onTargetChange,
  intervalMinutes,
  onIntervalChange,
}: ComposerSpreadPanelProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2.5 border-t border-[var(--border-subtle)] pt-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Repeat
            className="size-3 text-[var(--text-accent)]"
            strokeWidth={2.5}
          />
          <span className="font-display text-[10px] uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
            Spread across the day
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Spread across the day"
          onClick={() => onEnabledChange(!enabled)}
          className={cn(
            "relative h-[18px] w-[32px] shrink-0 rounded-pill border transition-colors",
            enabled
              ? "border-[var(--border-accent)] bg-[var(--surface-accent)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-sunken)]",
          )}
        >
          <span
            className={cn(
              "absolute top-[2px] size-[12px] rounded-full transition-all",
              enabled
                ? "left-[16px] bg-[var(--action-primary)]"
                : "left-[2px] bg-[var(--text-tertiary)]",
            )}
          />
        </button>
      </div>

      {enabled && (
        <div className="flex flex-col gap-2.5">
          <Stepper
            label="Check-ins"
            value={target}
            onChange={onTargetChange}
            min={2}
            max={100}
          />
          <Stepper
            label="Min. gap"
            value={intervalMinutes}
            onChange={onIntervalChange}
            min={0}
            max={1440}
            step={15}
            suffix={humaniseGap(intervalMinutes)}
          />
          {/* Verbatim from the design. It states the two rules the backend
              already enforces — non-compounding gaps and the daily reset — so
              it must not be reworded into something the backend does not do. */}
          <p className="text-[11px] leading-snug text-[var(--text-tertiary)]">
            Lateness never earns catch-up — the gap always counts from your last
            check-in. Unfinished counts restart at 0 tomorrow.
          </p>
        </div>
      )}
    </div>
  );
}
