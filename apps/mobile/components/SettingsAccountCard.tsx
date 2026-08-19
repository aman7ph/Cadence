import { useUser } from "@clerk/clerk-expo";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../lib/theme";
import { display } from "../lib/fonts";
import { radii } from "../lib/radii";

/** Avatar, name and email — the card above the first Settings section. */
export function SettingsAccountCard() {
  const c = useColors();
  const { user } = useUser();

  const initial = (
    user?.firstName?.[0] ??
    user?.emailAddresses[0]?.emailAddress[0] ??
    "?"
  ).toUpperCase();

  const s = StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: c.card,
      borderRadius: radii.lg,
      padding: 14,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: c.bd1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: radii.full,
      backgroundColor: c.prim,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarTxt: { ...display("bold"), color: c.onPrim, fontSize: 17 },
    info: { flex: 1 },
    name: { fontSize: 15, fontWeight: "600", color: c.t1 },
    email: { fontSize: 12, color: c.t3 },
  });

  return (
    <View style={s.card}>
      <View style={s.avatar}>
        <Text style={s.avatarTxt}>{initial}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name}>{user?.firstName ?? "User"}</Text>
        <Text style={s.email} numberOfLines={1}>
          {user?.emailAddresses[0]?.emailAddress}
        </Text>
      </View>
    </View>
  );
}
