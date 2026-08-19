import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";
import { display } from "../lib/fonts";
import { SectionLabel } from "./ui/SectionLabel";
import type { Granularity } from "../lib/insightUtils";
import { fmtXLabel, pickLabelIndices } from "../lib/insightUtils";

export function ChartCard({
  title,
  label,
  children,
}: {
  title: string;
  label?: string;
  children: ReactNode;
}) {
  const c = useColors();
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderWidth: 1,
        borderColor: c.bd1,
        borderRadius: radii.lg,
        padding: 16,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text style={{ ...display("semibold"), fontSize: 13, color: c.t1 }}>
          {title}
        </Text>
        {label ? <SectionLabel>{label}</SectionLabel> : null}
      </View>
      {children}
    </View>
  );
}

export function Loading() {
  const c = useColors();
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [opacity]);
  return (
    <View style={{ gap: 10, paddingVertical: 6 }}>
      <Animated.View
        style={{
          height: 120,
          borderRadius: radii.sm,
          backgroundColor: c.active,
          opacity,
        }}
      />
      <Animated.View
        style={{
          height: 16,
          borderRadius: radii.sm,
          backgroundColor: c.active,
          opacity,
          width: "60%",
        }}
      />
    </View>
  );
}

export function Empty({ msg }: { msg: string }) {
  const c = useColors();
  return (
    <View style={{ alignItems: "center", paddingVertical: 30 }}>
      <Text style={{ fontSize: 13, color: c.t3 }}>{msg}</Text>
    </View>
  );
}

export function XLabels({
  dates,
  granularity,
}: {
  dates: string[];
  granularity: Granularity;
}) {
  const c = useColors();
  const indices = pickLabelIndices(dates.length);
  if (indices.length === 0) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
      }}
    >
      {indices.map((idx) => (
        <Text key={idx} style={{ fontSize: 10, color: c.t2 }}>
          {fmtXLabel(dates[idx]!, granularity)}
        </Text>
      ))}
    </View>
  );
}
