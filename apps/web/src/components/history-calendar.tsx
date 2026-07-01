import { daysInMonth, firstWeekdayOfMonth } from "@cadence/shared";
import { cn } from "@/lib/utils";

const DOW_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function scoreToHeat(score: number | undefined): 0 | 1 | 2 | 3 | 4 {
  if (score === undefined || score === 0) return 0;
  if (score < 25) return 1;
  if (score < 50) return 2;
  if (score < 75) return 3;
  return 4;
}

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
          const heat = scoreToHeat(scoreByDate.get(date));

          return (
            <button
              key={date}
              type="button"
              disabled={isFuture}
              onClick={() => onSelect(date)}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-[8px] py-2.5 px-1 transition-all duration-150 text-center",
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
