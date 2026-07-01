import { StatCard } from "@/components/ui/stat-card";
import { ProductivityTile } from "./productivity-tile";

interface TodayStatCardsProps {
  dayPct: number | null;
  totalDone: number;
  totalScheduled: number;
  bestStreak: number;
  bestStreakName: string;
  productivity: number;
  isPast: boolean;
  thirtyDayRate: number | null;
  dayStatsLength: number | undefined;
  routineWeight: number | undefined;
}

export function TodayStatCards({
  dayPct,
  totalDone,
  totalScheduled,
  bestStreak,
  bestStreakName,
  productivity,
  isPast,
  thirtyDayRate,
  dayStatsLength,
  routineWeight,
}: TodayStatCardsProps) {
  return (
    <section
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
    >
      <StatCard
        label="Day's progress"
        value={dayPct ?? "—"}
        unit={dayPct !== null ? "%" : undefined}
        delta={totalScheduled > 0 ? `${totalDone} of ${totalScheduled} done` : "Nothing scheduled"}
        deltaDir={dayPct === null ? "flat" : dayPct >= 50 ? "up" : "flat"}
      />
      <StatCard
        label="Best streak"
        value={bestStreak}
        unit={bestStreak === 1 ? "day" : "days"}
        delta={bestStreakName}
        deltaDir="flat"
      />
      <ProductivityTile
        value={productivity}
        delta={isPast ? "On this day" : "Today"}
        routineWeight={routineWeight}
      />
      <StatCard
        label="30-day rate"
        value={thirtyDayRate ?? "—"}
        unit={thirtyDayRate !== null ? "%" : undefined}
        muted={thirtyDayRate === null}
        delta={
          dayStatsLength === undefined
            ? "Loading…"
            : dayStatsLength === 0
              ? "Awaiting activity"
              : `${dayStatsLength} day${dayStatsLength === 1 ? "" : "s"} tracked`
        }
        deltaDir="flat"
      />
    </section>
  );
}
