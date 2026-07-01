import { useState } from "react";
import { View } from "react-native";
import type { LineSeries } from "../lib/insightUtils";

export function SimpleLineChart({
  series, height = 140, domainY = [0, 100],
}: {
  series: LineSeries[]; height: number; domainY?: [number, number];
}) {
  const [w, setW] = useState(300);
  const PAD = 6;

  return (
    <View style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {series.map((s, si) => {
        const n = s.data.length;
        if (n < 2) return null;
        const [yMin, yMax] = domainY;
        const yRange = yMax - yMin || 1;
        const chartH = height - PAD * 2;
        const pts = s.data.map((v, i) => ({
          x: (i / (n - 1)) * w,
          y: PAD + chartH - ((Math.max(yMin, Math.min(yMax, v)) - yMin) / yRange) * chartH,
        }));
        const sw = s.strokeWidth ?? 2;
        return (
          <View key={si} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: s.opacity ?? 1 }}>
            {pts.slice(1).map((p, i) => {
              const p0 = pts[i]!;
              const dx = p.x - p0.x;
              const dy = p.y - p0.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              if (len < 0.5) return null;
              const angle = Math.atan2(dy, dx) * (180 / Math.PI);
              return (
                <View key={i} style={{
                  position: "absolute",
                  left: (p0.x + p.x) / 2 - len / 2,
                  top: (p0.y + p.y) / 2 - sw / 2,
                  width: len, height: sw,
                  backgroundColor: s.color,
                  borderRadius: sw / 2,
                  transform: [{ rotate: `${angle}deg` }],
                }} />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
