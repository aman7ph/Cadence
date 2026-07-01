import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import { addDays, todayLocal, weekdayOf } from "@cadence/shared";

const DAYS = 365;

type Cell =
  | { kind: "pad" }
  | { kind: "day"; date: string; score: number | null; band: 0 | 1 | 2 | 3 | 4 };

// Banding: empty days are grey (heat-0); a recorded day with any activity
// at all is at least heat-1. Higher productivityScore steps through 2..4.
function bandFor(score: number | null): 0 | 1 | 2 | 3 | 4 {
  if (score === null) return 0;
  if (score >= 80) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 1) return 1;
  return 0;
}

function prettyDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ContributionHeatmap() {
  const today = todayLocal();
  const from = addDays(today, -(DAYS - 1));
  const rows = useQuery(api.analyticsProductivity.dayStatsRange, { from, to: today });

  const cells = useMemo<Cell[]>(() => {
    const scoreByDate = new Map<string, number>();
    if (rows) for (const r of rows) scoreByDate.set(r.date, r.productivityScore);

    // Leading padding so the first column begins on a Sunday (column-major,
    // grid-rows-7 means each column is one full week).
    const startPad = weekdayOf(from);
    const out: Cell[] = [];
    for (let i = 0; i < startPad; i++) out.push({ kind: "pad" });
    for (let d = 0; d < DAYS; d++) {
      const date = addDays(from, d);
      const score = scoreByDate.get(date) ?? null;
      out.push({ kind: "day", date, score, band: bandFor(score) });
    }
    return out;
  }, [from, rows]);

  return (
    <div className="grid grid-flow-col grid-rows-7 gap-[3px]" aria-label="365-day activity heatmap">
      {cells.map((c, i) =>
        c.kind === "pad" ? (
          <span key={`p-${i}`} className="h-3 w-3" aria-hidden />
        ) : (
          <span
            key={c.date}
            className="h-3 w-3 rounded-[3px]"
            style={{ background: `var(--heat-${c.band})` }}
            title={
              c.score === null
                ? `${prettyDate(c.date)} — no activity`
                : `${prettyDate(c.date)} — ${c.score}%`
            }
          />
        ),
      )}
    </div>
  );
}
