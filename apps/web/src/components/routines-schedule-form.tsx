import { Button } from "@/components/ui/button";
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
          <Button
            key={s}
            variant="segment"
            size="sm"
            selected={scheduleType === s}
            onClick={() => onChange(s)}
            disabled={disabled}
            className="capitalize"
          >
            {s}
          </Button>
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
                    ? "border-[var(--border-accent)] bg-[var(--action-primary)] text-[var(--text-on-accent)]"
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
