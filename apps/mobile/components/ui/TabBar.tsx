import { StyleSheet, View } from "react-native";
import { Button } from "./Button";

interface Props<T extends string> {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  /** Rendered after the label, e.g. a count. */
  label?: (tab: T) => string;
}

/**
 * The page-level tab row — Active/Archived, Unscheduled/Scheduled, and the
 * three goal states.
 *
 * Three screens had this row hand-written with byte-identical styles. The tab
 * treatment itself already lived in `Button variant="tab"`; this is the strip
 * that holds them, so the spacing cannot drift page to page either.
 */
export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  label,
}: Props<T>) {
  const s = StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 6,
    },
  });

  return (
    <View style={s.row}>
      {tabs.map((t) => (
        <Button
          key={t}
          variant="tab"
          selected={active === t}
          title={label ? label(t) : t}
          onPress={() => onChange(t)}
        />
      ))}
    </View>
  );
}
