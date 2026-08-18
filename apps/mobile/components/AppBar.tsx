import { DrawerActions, useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../lib/theme";
import { display } from "../lib/fonts";

/**
 * `title` is omitted only on Today, which carries its own greeting header — so
 * that page's bar is the burger alone. This matches the prototype's phone
 * frame, whose Today bar has no wordmark either.
 */
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
    title:       { ...display("bold"), fontSize: 17, color: c.t1, letterSpacing: -0.3, flex: 1 },
  });

  return (
    <View style={s.bar}>
      <TouchableOpacity onPress={toggleDrawer} style={s.ham} hitSlop={8}>
        <View style={s.line} />
        <View style={s.line} />
        <View style={s.line} />
      </TouchableOpacity>
      {title ? <Text style={s.title}>{title}</Text> : null}
    </View>
  );
}
