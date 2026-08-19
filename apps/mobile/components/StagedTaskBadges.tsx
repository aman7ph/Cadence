import { StyleSheet, Text, View } from "react-native";
import { fmtShort } from "../lib/insightUtils";
import { useColors } from "../lib/theme";
import { radii } from "../lib/radii";

/** Destination and date, shown on a staged task once it is scheduled. */
export function StagedTaskBadges({
  destLabel,
  scheduledDate,
}: {
  destLabel: string;
  scheduledDate: string;
}) {
  const c = useColors();

  const s = StyleSheet.create({
    dest: {
      backgroundColor: c.accBg,
      borderRadius: radii.pill,
      paddingHorizontal: 6,
      paddingVertical: 2,
      maxWidth: 130,
    },
    destTxt: { fontSize: 10, fontWeight: "700", color: c.tacc },
    date: {
      backgroundColor: c.active,
      borderRadius: radii.pill,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    dateTxt: { fontSize: 10, color: c.t3 },
  });

  return (
    <>
      <View style={s.dest}>
        <Text style={s.destTxt} numberOfLines={1}>
          {destLabel}
        </Text>
      </View>
      <View style={s.date}>
        <Text style={s.dateTxt}>{fmtShort(scheduledDate)}</Text>
      </View>
    </>
  );
}
