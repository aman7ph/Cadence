import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useColors } from "../../lib/theme";
import { radii } from "../../lib/radii";

interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Forms need the keyboard pushed out of the way; menus and pickers do not. */
  avoidKeyboard?: boolean;
  /** The grab handle. Menus omit it — their title row reads as the top edge. */
  handle?: boolean;
  /** Caps a scrolling body. Omit for sheets that size to their content. */
  maxHeight?: ViewStyle["maxHeight"];
  style?: StyleProp<ViewStyle>;
}

/**
 * THE bottom sheet. Every modal surface in the app is this component.
 *
 * The counterpart to web's `Drawer`, and it exists for the reason web's does:
 * nine sheets had each hand-written the same shell — scrim, backdrop dismiss,
 * top radius, border, bottom padding — and they had already drifted apart on
 * corner radius (20 vs 22) and, more visibly, on whether their corners were
 * clipped at all. Fixing that one file at a time kept missing files.
 *
 * **`overflow: "hidden"` is the load-bearing line here.** React Native does not
 * clip children to a parent's `borderRadius`, so a rounded sheet with any
 * edge-to-edge child renders square corners. Owning it in one place is the
 * only way that stays true as sheets gain content.
 *
 * Content is entirely the caller's: this provides containment and dismissal,
 * not layout. `FormFooter` handles the actions row, `ConfirmSheet` composes
 * both for confirmations.
 */
export function Sheet({
  visible,
  onClose,
  children,
  avoidKeyboard = false,
  handle = true,
  maxHeight,
  style,
}: Props) {
  const c = useColors();

  const s = StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: c.scrim },
    backdrop: { flex: 1 },
    sheet: {
      backgroundColor: c.bgE,
      borderTopLeftRadius: radii.sheet,
      borderTopRightRadius: radii.sheet,
      // Without this the corners above are drawn and then painted over.
      overflow: "hidden",
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: c.bd2,
      paddingBottom: 32,
    },
    grip: {
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.bd3,
      alignSelf: "center",
      marginTop: 10,
      marginBottom: 4,
    },
  });

  const body = (
    <>
      <TouchableOpacity
        style={s.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[s.sheet, maxHeight !== undefined && { maxHeight }, style]}>
        {handle && <View style={s.grip} />}
        {children}
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={s.overlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        <View style={s.overlay}>{body}</View>
      )}
    </Modal>
  );
}
