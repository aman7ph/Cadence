import type { ReactNode } from "react";
import { FormDrawer } from "@/components/ui/form-drawer";

interface ConfirmDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
 * The confirmation every destructive action uses.
 *
 * It is `FormDrawer` with no fields rather than a separate dialog, so a confirm
 * cannot drift from a create form — same width, same footer, same Escape and
 * backdrop behaviour (D17).
 *
 * Tone carries the distinction that matters: `danger` for deletes, which cannot
 * be undone, and `accent` for archive / unschedule / complete, which can. A
 * red button on a reversible action teaches people to ignore red.
 */
export function ConfirmDrawer({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  tone = "danger",
  onConfirm,
  children,
}: ConfirmDrawerProps) {
  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      submitLabel={confirmLabel}
      tone={tone}
      size="confirm"
      onSubmit={onConfirm}
    >
      {children}
    </FormDrawer>
  );
}
