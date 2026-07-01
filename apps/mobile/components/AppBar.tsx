import { DrawerActions, useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";

type Props = { title?: string };

export function AppBar({ title }: Props) {
  const navigation = useNavigation();
  const c = useColors();
  const toggleDrawer = () => navigation.dispatch(DrawerActions.toggleDrawer());

  const s = StyleSheet.create({
    bar:         { height: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: 14,
                   borderBottomWidth: 1, borderBottomColor: c.bd1, gap: 10 },
    ham:         { width: 38, height: 38, justifyContent: "center", gap: 5, paddingHorizontal: 10 },
    line:        { width: 18, height: 1.5, backgroundColor: c.t1, borderRadius: 1 },
    title:       { fontSize: 17, fontWeight: "700", color: c.t1, letterSpacing: -0.3, flex: 1 },
    logo:        { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
    logoMark:    { width: 26, height: 26, borderRadius: 7, backgroundColor: c.prim,
                   justifyContent: "center", alignItems: "center" },
    logoMarkTxt: { color: "#fff", fontWeight: "700", fontSize: 13 },
    logoName:    { fontSize: 17, fontWeight: "700", color: c.t1, letterSpacing: -0.3 },
  });

  return (
    <View style={s.bar}>
      <TouchableOpacity onPress={toggleDrawer} style={s.ham} hitSlop={8}>
        <View style={s.line} />
        <View style={s.line} />
        <View style={s.line} />
      </TouchableOpacity>
      {title ? (
        <Text style={s.title}>{title}</Text>
      ) : (
        <View style={s.logo}>
          <View style={s.logoMark}>
            <Text style={s.logoMarkTxt}>C</Text>
          </View>
          <Text style={s.logoName}>Cadence</Text>
        </View>
      )}
    </View>
  );
}
