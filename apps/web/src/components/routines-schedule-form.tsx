import { cn } from "@/lib/utils";

export type ScheduleType = "daily" | "weekdays" | "custom";
export const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"] as const;
export const WEEKDAY_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function scheduleLabel(scheduleType: ScheduleType, customDays?: number[]): string {
  if (scheduleType === "daily") return "Every day";
  if (scheduleType === "weekdays") return "Weekdays";
  if (!customDays || customDays.length === 0) return "Custom";
  return customDays.map((d) => WEEKDAY_FULL[d]).join(", ");
}

export function ScheduleForm({
  scheduleType,
  customDays,
  disabled,
  onChange,
  onDayToggle,
}: {
  scheduleType: ScheduleType;
  customDays: number[];
  disabled: boolean;
  onChange: (t: ScheduleType) => void;
  onDayToggle: (d: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {(["daily", "weekdays", "custom"] as ScheduleType[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            disabled={disabled}
            className={cn(
              "h-8 rounded-full border px-3.5 text-[12px] font-semibold capitalize transition-all duration-150",
              scheduleType === s
                ? "border-[var(--border-accent)] bg-[var(--surface-accent)] text-[var(--text-accent)]"
                : "border-[var(--border-subtle)] bg-card text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      {scheduleType === "custom" && (
        <div className="flex gap-1.5">
          {WEEKDAY_SHORT.map((label, idx) => {
            const active = customDays.includes(idx);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onDayToggle(idx)}
                disabled={disabled}
                className={cn(
                  "h-8 w-8 rounded-full border text-[11px] font-bold transition-all duration-150",
                  active
                    ? "border-[var(--border-accent)] bg-[var(--indigo-600)] text-white"
                    : "border-[var(--border-subtle)] bg-card text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]",
                )}
                aria-label={`Toggle ${WEEKDAY_FULL[idx]}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
