import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { DrawerContent } from "../../components/DrawerContent";
import { useColors } from "../../lib/theme";

export default function DrawerLayout() {
  const c = useColors();
  return (
    <GestureHandlerRootView style={styles.root}>
      <Drawer
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: { backgroundColor: c.bgE, width: 280 },
          overlayColor: "rgba(0,0,0,0.55)",
          swipeEdgeWidth: 50,
        }}
      >
        <Drawer.Screen name="index"    options={{ title: "Today" }} />
        <Drawer.Screen name="routines" options={{ title: "Routines" }} />
        <Drawer.Screen name="goals"    options={{ title: "Goals" }} />
        <Drawer.Screen name="history"  options={{ title: "History" }} />
        <Drawer.Screen name="insights" options={{ title: "Insights" }} />
        <Drawer.Screen name="settings" options={{ title: "Settings" }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
