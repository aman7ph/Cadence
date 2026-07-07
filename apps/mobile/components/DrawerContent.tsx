import { DrawerContentScrollView } from "@react-navigation/drawer";
import type { DrawerContentComponentProps } from "@react-navigation/drawer";
import { usePathname, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";

const NAV = [
  { name: "index",    label: "Today",    route: "/(drawer)/"        },
  { name: "routines", label: "Routines", route: "/(drawer)/routines" },
  { name: "staging",  label: "Staging",  route: "/(drawer)/staging"  },
  { name: "goals",    label: "Goals",    route: "/(drawer)/goals"    },
  { name: "history",  label: "History",  route: "/(drawer)/history"  },
  { name: "insights", label: "Insights", route: "/(drawer)/insights" },
] as const;

export function DrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const c = useColors();

  const go = (route: string) => {
    router.push(route as any);
    props.navigation.closeDrawer();
  };

  const active = (name: string) =>
    name === "index"
      ? pathname === "/" || pathname === "/(drawer)/"
      : pathname.includes(name);

  const s = StyleSheet.create({
    container:    { flex: 1, backgroundColor: c.bgE },
    head:         { flexDirection: "row", alignItems: "center",
                    paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14,
                    borderBottomWidth: 1, borderBottomColor: c.bd1 },
    brand:        { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
    brandMark:    { width: 28, height: 28, borderRadius: 8, backgroundColor: c.prim,
                    justifyContent: "center", alignItems: "center" },
    brandMarkTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
    brandName:    { fontSize: 18, fontWeight: "700", color: c.t1, letterSpacing: -0.4 },
    gear:         { padding: 4 },
    gearTxt:      { fontSize: 20, color: c.t2 },
    navList:      { paddingVertical: 8 },
    item:         { paddingHorizontal: 20, paddingVertical: 12, position: "relative" },
    itemOn:       { backgroundColor: c.accBg },
    accent:       { position: "absolute", left: 0, top: 6, bottom: 6, width: 3,
                    borderRadius: 2, backgroundColor: c.prim },
    label:        { fontSize: 14, fontWeight: "500", color: c.t2, marginLeft: 14 },
    labelOn:      { color: c.t1, fontWeight: "600" },
  });

  return (
    <View style={s.container}>
      <View style={s.head}>
        <View style={s.brand}>
          <View style={s.brandMark}><Text style={s.brandMarkTxt}>C</Text></View>
          <Text style={s.brandName}>Cadence</Text>
        </View>
        <TouchableOpacity onPress={() => go("/(drawer)/settings")} hitSlop={10} style={s.gear}>
          <Text style={s.gearTxt}>⚙</Text>
        </TouchableOpacity>
      </View>
      <DrawerContentScrollView {...props} scrollEnabled={false} contentContainerStyle={s.navList}>
        {NAV.map((item) => {
          const on = active(item.name);
          return (
            <TouchableOpacity key={item.name} style={[s.item, on && s.itemOn]}
              onPress={() => go(item.route)}>
              {on && <View style={s.accent} />}
              <Text style={[s.label, on && s.labelOn]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>
    </View>
  );
}
