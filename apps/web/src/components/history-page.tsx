import { useState } from "react";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@cadence/backend/convex/_generated/api";
import {
  endOfMonth,
  formatMonthYear,
  nextMonth,
  prevMonth,
  startOfMonth,
  todayLocal,
} from "@cadence/shared";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { CalendarGrid } from "./history-calendar";
import { DayDetailPanel } from "./history-day-detail";
import { HistoryReflection } from "./history-reflection";
import { PageHeader } from "./page-header";
import { cn } from "@/lib/utils";

export function HistoryPage() {
  const today = todayLocal();
  const currentMonth = today.slice(0, 7);

  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const statsRows = useQuery(api.analyticsProductivity.dayStatsRange, {
    from: startOfMonth(viewMonth + "-01"),
    to: endOfMonth(viewMonth + "-01"),
  });

  const scoreByDate = new Map<string, number>(
    (statsRows ?? []).map((r) => [r.date, r.productivityScore]),
  );

  const navBtn =
    "flex size-8 items-center justify-center rounded-sm border border-[var(--border-subtle)] transition-colors duration-150";

  return (
    <div className="flex flex-col gap-[22px]">
      <PageHeader
        title="History"
        subtitle="Review past days — click any day to see its routines and tasks."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setViewMonth(prevMonth(viewMonth))}
            className={cn(navBtn, "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground")}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="min-w-[140px] text-center font-display text-[14px] font-semibold text-foreground">
            {formatMonthYear(viewMonth + "-01")}
          </h2>
          <button
            type="button"
            onClick={() => setViewMonth(nextMonth(viewMonth))}
            disabled={viewMonth >= currentMonth}
            className={cn(
              navBtn,
              viewMonth < currentMonth
                ? "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-foreground"
                : "cursor-default text-[var(--text-tertiary)]/30",
            )}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </button>
          {viewMonth !== currentMonth && (
            <Button variant="ghost" size="sm" onClick={() => setViewMonth(currentMonth)}>
              Today
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              className="h-3 w-3 rounded-[3px]"
              style={{ background: `var(--heat-${level})` }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      <CalendarGrid
        viewMonth={viewMonth}
        today={today}
        scoreByDate={scoreByDate}
        selectedDate={selectedDate}
        onSelect={(date) => setSelectedDate(date)}
      />

      {/* Same drawer as Goals (D10) — History mounts its own content in it. */}
      <Drawer
        open={selectedDate !== null}
        onOpenChange={(o) => !o && setSelectedDate(null)}
        label="Day detail"
        closeLabel="Close"
        className="w-[513px] max-w-full gap-5 px-7 py-6"
      >
        {selectedDate && (
          <>
            <DayDetailPanel date={selectedDate} today={today} />
            <HistoryReflection date={selectedDate} />
          </>
        )}
      </Drawer>
    </div>
  );
}
