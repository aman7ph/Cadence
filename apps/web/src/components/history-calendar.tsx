import { daysInMonth, firstWeekdayOfMonth, scoreToHeatBand } from "@cadence/shared";
import { cn } from "@/lib/utils";

const DOW_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// The local scoreToHeat used to live here with its own 25/50/75 cuts, which
// disagreed with the activity heatmap's 1/40/60/80 cuts on 30 of the 101
// possible scores — under one shared "Less → More" legend. Both now read the
// same scale from @cadence/shared. See packages/shared/src/heat.ts.

export function formatFullDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

interface CalendarGridProps {
  viewMonth: string;
  today: string;
  scoreByDate: Map<string, number>;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

export function CalendarGrid({ viewMonth, today, scoreByDate, selectedDate, onSelect }: CalendarGridProps) {
  const count = daysInMonth(viewMonth);
  const offset = (firstWeekdayOfMonth(viewMonth) + 6) % 7;
  const totalCells = offset + count;
  const rows = Math.ceil(totalCells / 7);

  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-7 gap-1">
        {DOW_HEADERS.map((h) => (
          <div key={h} className="text-center text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)] py-1">
            {h}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: rows * 7 }, (_, i) => {
          const dayNum = i - offset + 1;
          if (dayNum < 1 || dayNum > count) return <div key={i} />;
          const dd = String(dayNum).padStart(2, "0");
          const date = `${viewMonth}-${dd}`;
          const isFuture = date > today;
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const heat = scoreToHeatBand(scoreByDate.get(date));

          return (
            <button
              key={date}
              type="button"
              disabled={isFuture}
              onClick={() => onSelect(date)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-sm py-2.5 px-1 transition-all duration-150 text-center",
                isFuture
                  ? "cursor-default opacity-25"
                  : isSelected
                    ? "bg-[var(--surface-accent)] shadow-[var(--shadow-sm)]"
                    : "hover:bg-[var(--surface-hover)]",
              )}
              aria-label={formatFullDate(date)}
              aria-pressed={isSelected}
            >
              <span className={cn("text-[13px] font-semibold leading-none", isToday || isSelected ? "text-[var(--text-accent)]" : "text-foreground")}>
                {dayNum}
              </span>
              <span
                className="h-[7px] w-[7px] rounded-full"
                style={{ background: `var(--heat-${heat})`, opacity: isFuture ? 0.3 : 1 }}
              />
              {isToday && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-[var(--text-accent)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
