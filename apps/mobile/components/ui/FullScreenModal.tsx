import type { ReactNode } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColors } from "../../lib/theme";

/**
 * A full-screen page presented over the current one — goal detail and the
 * history day.
 *
 * Deliberately NOT `ui/Sheet` (D7). Both of these are pages: they carry
 * headers, cards and scrolling sections that a sheet capped at 85% would cut
 * off, and both *open* sheets of their own. Nesting a Modal inside a Modal is
 * the bug already found in StagedTaskScheduleModal, where two stacked modals
 * fought over the backdrop.
 *
 * `children` render only while open, so a page's queries unsubscribe on close
 * rather than idling behind an invisible modal.
 */
export function FullScreenModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const c = useColors();
  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bg },
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.screen} edges={["top", "bottom"]}>
        {visible ? children : <View />}
      </SafeAreaView>
    </Modal>
  );
}
