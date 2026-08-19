import { StyleSheet, Text, View } from "react-native";
import { addDays } from "@cadence/shared";
import { fmtLong } from "../lib/dateUtils";
import { useColors } from "../lib/theme";
import { display } from "../lib/fonts";
import { radii } from "../lib/radii";
import { DayNav } from "./DayNav";

interface Props {
  viewedDate: string;
  today: string;
  isPast: boolean;
  firstName: string;
  onChangeDate: (next: string) => void;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The greeting (or the date, on a past day) and the day navigator.
 *
 * The date sits ABOVE the greeting, which is the order the prototype's phone
 * frame uses — the greeting is the heading and the date is its kicker.
 */
export function TodayHeader({
  viewedDate,
  today,
  isPast,
  firstName,
  onChangeDate,
}: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 },
    greeting: {
      ...display("semibold"),
      fontSize: 23,
      color: c.t1,
      letterSpacing: -0.4,
    },
    date: { fontSize: 12, color: c.t2, marginBottom: 2 },
    dateHeading: {
      ...display("semibold"),
      fontSize: 23,
      color: c.t1,
      letterSpacing: -0.3,
      marginBottom: 4,
    },
    pastBadge: {
      alignSelf: "flex-start",
      backgroundColor: c.accBg,
      borderRadius: radii.pill,
      paddingHorizontal: 10,
      paddingVertical: 3,
      marginBottom: 2,
    },
    pastBadgeTxt: { fontSize: 11, fontWeight: "600", color: c.carry },
  });

  return (
    <View style={s.header}>
      {isPast ? (
        <>
          <Text style={s.dateHeading}>{fmtLong(viewedDate)}</Text>
          <View style={s.pastBadge}>
            <Text style={s.pastBadgeTxt}>Viewing past day</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={s.date}>{fmtLong(viewedDate)}</Text>
          <Text style={s.greeting}>
            {greeting()}, {firstName}
          </Text>
        </>
      )}
      <DayNav
        date={viewedDate}
        today={today}
        onPrev={() => onChangeDate(addDays(viewedDate, -1))}
        onNext={() => onChangeDate(addDays(viewedDate, 1))}
        onToday={() => onChangeDate(today)}
      />
    </View>
  );
}
