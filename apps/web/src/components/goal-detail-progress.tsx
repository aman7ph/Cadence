import { goalProgress } from "@cadence/shared";

interface ProgressProps {
  targetValue: number;
  currentValue: number;
  unit: string | undefined;
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-md border border-[var(--border-subtle)] bg-card ${className}`}
    >
      {children}
    </div>
  );
}

export function GoalDetailProgress({
  targetValue,
  currentValue,
  unit,
}: ProgressProps) {
  const { pct, reached } = goalProgress(currentValue, targetValue);

  return (
    <SectionCard className="p-5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[52px] font-bold leading-none text-foreground">
            {currentValue}
          </span>
          <span className="text-[18px] text-[var(--text-secondary)]">
            / {targetValue}
            {unit && <span className="ml-1 text-[15px]">{unit}</span>}
          </span>
        </div>
        {/* The tick is how "target reached" reads now. It used to be a colour
            change — status-complete against action-primary — but the palette
            has no green and both roles resolve to the same gold, so the signal
            had silently disappeared. A glyph says it without needing a hue,
            and matches the tick the task and routine rows already use. */}
        <span
          className="flex items-baseline gap-1.5 font-mono text-[22px] font-bold"
          style={{ color: "var(--action-primary)" }}
        >
          {reached && <span aria-hidden="true">✓</span>}
          {pct}%
        </span>
      </div>
      <div className="mt-3 h-[4px] w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: "var(--action-primary)" }}
        />
      </div>
    </SectionCard>
  );
}
