interface ProgressProps {
  targetValue: number;
  currentValue: number;
  unit: string | undefined;
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[16px] border border-[var(--border-subtle)] bg-card shadow-[var(--shadow-sm)] ${className}`}>
      {children}
    </div>
  );
}

export function GoalDetailProgress({ targetValue, currentValue, unit }: ProgressProps) {
  const pct = Math.min(100, Math.round((currentValue / targetValue) * 100));

  return (
    <SectionCard className="p-5">
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[52px] font-bold leading-none text-foreground">
            {currentValue}
          </span>
          <span className="text-[18px] text-[var(--text-secondary)]">
            / {targetValue}{unit && <span className="ml-1 text-[15px]">{unit}</span>}
          </span>
        </div>
        <span className="font-mono text-[22px] font-bold"
          style={{ color: pct === 100 ? "var(--status-complete)" : "var(--action-primary)" }}>
          {pct}%
        </span>
      </div>
      <div className="mt-3 h-[4px] w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
        <div className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: pct === 100 ? "var(--status-complete)" : "var(--action-primary)" }}
        />
      </div>
    </SectionCard>
  );
}
