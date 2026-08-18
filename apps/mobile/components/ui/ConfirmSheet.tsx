import type { ReactNode } from "react";
import { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "../../lib/theme";
import { display } from "../../lib/fonts";
import { radii } from "../../lib/radii";
import { FormFooter } from "./FormFooter";

interface Props {
  visible: boolean;
  onCancel: () => void;
  title: string;
  /** What happens, and whether it can be undone. */
  description: string;
  confirmLabel: string;
  /** `danger` for irreversible actions; `accent` for undoable ones. */
  tone?: "accent" | "danger";
  onConfirm: () => void | Promise<void>;
  /** Optional context, e.g. the item's name. */
  children?: ReactNode;
}

/**
 * The confirmation every destructive or significant action uses — the mobile
 * twin of web's ConfirmDrawer.
 *
 * Same construction for the same reason: it is the form sheet with no fields,
 * not a separate dialog, so a confirm cannot drift from a create form. It keeps
 * the handle, the scrim, the backdrop-dismiss and the `FormFooter`.
 *
 * Tone carries the distinction that matters: `danger` for deletes, which cannot
 * be undone, and `accent` for restore / archive / complete, which can. A red
 * button on a reversible action teaches people to ignore red.
 */
export function ConfirmSheet({
  visible,
  onCancel,
  title,
  description,
  confirmLabel,
  tone = "danger",
  onConfirm,
  children,
}: Props) {
  const c = useColors();
  const [pending, setPending] = useState(false);

  const confirm = async () => {
    if (pending) return;
    setPending(true);
    try {
      await onConfirm();
      onCancel();
    } finally {
      setPending(false);
    }
  };

  const s = StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: c.scrim },
    backdrop: { flex: 1 },
    sheet: {
      backgroundColor: c.bgE,
      borderTopLeftRadius: radii.sheet,
      borderTopRightRadius: radii.sheet,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: c.bd2,
      paddingBottom: 32,
    },
    handle: {
      width: 38, height: 4, borderRadius: 2, backgroundColor: c.bd3,
      alignSelf: "center", marginTop: 10, marginBottom: 4,
    },
    title: { ...display("semibold"), fontSize: 17, color: c.t1, paddingHorizontal: 20, paddingTop: 4 },
    desc: { fontSize: 12.5, color: c.t2, lineHeight: 18, paddingHorizontal: 20, paddingTop: 4 },
    body: { paddingHorizontal: 20, paddingTop: 12 },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onCancel} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>{title}</Text>
          <Text style={s.desc}>{description}</Text>
          {children ? <View style={s.body}>{children}</View> : null}
          <FormFooter
            onCancel={onCancel}
            onSubmit={confirm}
            submitLabel={confirmLabel}
            tone={tone}
            pending={pending}
          />
        </View>
      </View>
    </Modal>
  );
}
