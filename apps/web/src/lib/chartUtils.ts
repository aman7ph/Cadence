import { formatDateShort, formatMonthYear } from "@cadence/shared";
import type { Granularity } from "@cadence/shared";

// `getGranularity` and its thresholds moved to @cadence/shared in Step 11.
// Web switched at 90/365 days and mobile at 30/180, so "Last 90 days" rendered
// as 90 daily points on one platform and weekly averages on the other — the
// same range over the same data showing two different sets of numbers. Both now
// read one implementation. Re-exported here so existing imports keep working.
export type { Granularity } from "@cadence/shared";
export { getGranularity } from "@cadence/shared";

// The bucketing moved to @cadence/shared too, for the same reason: mobile had a
// second copy of the same maths. Re-exported so existing imports keep working.
export {
  bucketByWeek,
  bucketByMonth,
  bucketCountsByWeek,
  bucketCountsByMonth,
  computeEMA,
} from "@cadence/shared";

export function formatXLabel(date: string, granularity: Granularity): string {
  if (granularity === "monthly") return formatMonthYear(date);
  return formatDateShort(date);
}

// `fillDailyGaps` used to live here and was never called by anything. It moved
// to @cadence/shared in Step 9, where mobile needs it too and where it is
// tested — see packages/shared/src/chart.ts.
