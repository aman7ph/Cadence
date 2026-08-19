import { useQuery } from "convex/react";
import { api } from "@cadence/backend/convex/_generated/api";
import type { DateRange } from "@cadence/shared";
import { fillDailyGaps } from "@cadence/shared";
import { View } from "react-native";
import { useColors } from "../lib/theme";
import type { Granularity } from "../lib/insightUtils";
import { seriesColors } from "../lib/insightUtils";
import { bucketCountsByWeek, bucketCountsByMonth } from "@cadence/shared";
import { SimpleLineChart } from "./SimpleLineChart";
import { Loading, Empty, XLabels } from "./InsightShared";

export function OpenTasksTrendChart({
  range,
  granularity,
}: {
  range: DateRange;
  granularity: Granularity;
}) {
  const rawRows = useQuery(api.analyticsTasks.openTasksByOriginDate, {
    from: range.from,
    to: range.to,
  });
  const SC = seriesColors(useColors());

  if (!rawRows) return <Loading />;
  if (rawRows.length === 0)
    return <Empty msg="No tasks still open from this window — all resolved!" />;

  // Counts are summed across a bucket, never averaged, and quiet days are
  // filled with 0 so they occupy the axis instead of vanishing from it.
  const filled = fillDailyGaps(rawRows, range.from, range.to, (date) => ({
    date,
    count: 0,
  }));
  const bucketed =
    granularity === "weekly"
      ? bucketCountsByWeek(filled, ["count"])
      : granularity === "monthly"
        ? bucketCountsByMonth(filled, ["count"])
        : filled;
  const maxVal = Math.max(...bucketed.map((r) => r.count), 1);

  return (
    <View>
      <SimpleLineChart
        series={[
          { data: bucketed.map((r) => r.count), color: SC[3]!, strokeWidth: 2 },
        ]}
        height={140}
        domainY={[0, maxVal]}
      />
      <XLabels dates={bucketed.map((r) => r.date)} granularity={granularity} />
    </View>
  );
}
