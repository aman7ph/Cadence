import { useState } from "react";
import { useQuery } from "convex/react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  endOfMonth,
  formatMonthYear,
  nextMonth,
  prevMonth,
  startOfMonth,
  todayLocal,
} from "@cadence/shared";
import { CalendarGrid } from "./history-calendar";
import { DayDetailPanel } from "./history-day-detail";
import { HistoryReflection } from "./history-reflection";
import { cn } from "@/lib/utils";

export function HistoryPage() {
  const today = todayLocal();
  const currentMonth = today.slice(0, 7);
  const yd = new Date(today + "T12:00:00");
  yd.setDate(yd.getDate() - 1);
  const yesterday = yd.toISOString().slice(0, 10);

  const [viewMonth, setViewMonth] = useState(yesterday.slice(0, 7));
  const [selectedDate, setSelectedDate] = useState<string | null>(yesterday);

  const statsRows = useQuery(api.analyticsProductivity.dayStatsRange, {
    from: startOfMonth(viewMonth + "-01"),
    to: endOfMonth(viewMonth + "-01"),
  });

  const scoreByDate = new Map<string, number>(
    (statsRows ?? []).map((r) => [r.date, r.productivityScore]),
  );

  return (
    <div className="flex flex-col gap-5">
      {/* ── Top: header + nav + legend, full width ── */}
      <header>
        <h1 className="font-display text-[22px] font-bold tracking-tight text-foreground">History</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Review past days — click any day to see its routines and tasks</p>
      </header>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => { setViewMonth(prevMonth(viewMonth)); setSelectedDate(null); }}
          className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground transition-all duration-150"
          aria-label="Previous month">
          <ChevronLeft className="size-4" />
        </button>
        <h2 className="text-[15px] font-semibold text-foreground min-w-[140px] text-center">
          {formatMonthYear(viewMonth + "-01")}
        </h2>
        <button type="button" onClick={() => { setViewMonth(nextMonth(viewMonth)); setSelectedDate(null); }}
          disabled={viewMonth >= currentMonth}
          className={cn("flex h-8 w-8 items-center justify-center rounded-[10px] border border-[var(--border-subtle)] transition-all duration-150",
            viewMonth < currentMonth ? "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground" : "text-[var(--text-tertiary)]/30 cursor-default")}
          aria-label="Next month">
          <ChevronRight className="size-4" />
        </button>
        {viewMonth !== currentMonth && (
          <button type="button" onClick={() => { setViewMonth(currentMonth); setSelectedDate(null); }}
            className="ml-2 text-[12px] font-semibold text-[var(--text-tertiary)] hover:text-foreground underline underline-offset-2 transition-colors">
            Today
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)] -mt-1">
        <span>Less</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className="h-3 w-3 rounded-[3px]" style={{ background: `var(--heat-${level})` }} />
        ))}
        <span>More</span>
      </div>

      {/* ── 50/50 grid: calendar left, detail right — both start at same row ── */}
      <div className="grid grid-cols-2 items-start gap-6">
        <div className="flex flex-col gap-5">
          <CalendarGrid viewMonth={viewMonth} today={today} scoreByDate={scoreByDate}
            selectedDate={selectedDate}
            onSelect={(date) => setSelectedDate((prev) => (prev === date ? null : date))} />
          {selectedDate && <HistoryReflection date={selectedDate} />}
        </div>

        <div className="min-w-0">
          {selectedDate ? (
            <DayDetailPanel date={selectedDate} today={today} onClose={() => setSelectedDate(null)} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-[var(--border-subtle)] py-20 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-accent)]">
                <CalendarDays className="size-6 text-[var(--text-accent)]" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-foreground">Select a day</p>
                <p className="mt-0.5 text-[13px] text-[var(--text-tertiary)]">Click any date to see its details.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
