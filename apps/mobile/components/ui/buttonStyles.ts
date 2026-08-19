import type { TextStyle, ViewStyle } from "react-native";
import type { Colors } from "../../lib/colors";
import { radii } from "../../lib/radii";

// Resolver for <Button>. Lives apart from the component only to keep both
// files under the project's 150-line limit.
//
// This is the RN equivalent of the web's cva table in ui/button.tsx, and the
// variant names are deliberately identical so the two apps share one
// vocabulary. Values come from the same measurements.

export type ButtonVariant =
  | "solid" // accent CTA — Save, Create, Apply
  | "ghost" // plain-text secondary — Cancel, Close
  | "danger" // plain-text destructive — Sign out, Delete
  | "outline" // bordered action — Edit, Mark complete, Abandon (tone-able)
  | "segment" // bordered pill in a segmented control
  | "tab" // page-level tab — r=9, NO border (distinct from segment)
  | "block" // full-width bordered add-row
  | "fab"; // mobile-only: the floating add action (M5)

export type ButtonTone = "neutral" | "success" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const SIZES: Record<ButtonSize, { pad: ViewStyle; font: number }> = {
  sm: { pad: { paddingHorizontal: 14, paddingVertical: 6 }, font: 11.5 },
  md: { pad: { paddingHorizontal: 16, paddingVertical: 7 }, font: 12 },
  lg: { pad: { paddingHorizontal: 16, paddingVertical: 9 }, font: 13 },
  icon: { pad: { padding: 8 }, font: 13 },
};

/** Colour of an `outline` — the prototype tones Mark complete with the accent. */
function outlineTone(c: Colors, tone: ButtonTone) {
  if (tone === "success") return { border: c.cplt, text: c.cplt };
  if (tone === "danger") return { border: c.danger, text: c.danger };
  return { border: c.bd1, text: c.t2 };
}

export function buttonStyles(
  c: Colors,
  variant: ButtonVariant,
  tone: ButtonTone,
  size: ButtonSize,
  selected: boolean,
): { box: ViewStyle; label: TextStyle } {
  const { pad, font } = SIZES[size];
  const base: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...pad,
  };
  const label: TextStyle = { fontSize: font, fontWeight: "600" };

  switch (variant) {
    case "solid":
      return {
        box: { ...base, borderRadius: radii.sm, backgroundColor: c.prim },
        label: { ...label, color: c.onPrim },
      };

    // Plain-text treatments carry no box, so horizontal padding would only
    // push them away from their neighbours — same call as web.
    case "ghost":
      return {
        box: { ...base, ...pad, paddingHorizontal: 4, borderRadius: radii.sm },
        label: { ...label, color: c.t2 },
      };
    case "danger":
      return {
        box: { ...base, ...pad, paddingHorizontal: 4, borderRadius: radii.sm },
        label: { ...label, color: c.danger },
      };

    case "outline": {
      const t = outlineTone(c, tone);
      return {
        box: {
          ...base,
          borderRadius: radii.sm,
          borderWidth: 1,
          borderColor: t.border,
        },
        label: { ...label, color: t.text },
      };
    }

    case "segment":
      return {
        box: {
          ...base,
          // `sm`, not the pill web uses. The prototype differs by platform
          // here: its desktop segmented controls measure r=20, its PHONE frame
          // measures 9 (alert mode) and 11 (theme picker). Mobile follows its
          // own frame, as it does for the FAB and the Today composer.
          borderRadius: radii.sm,
          borderWidth: 1,
          borderColor: selected ? c.bdAcc : c.bd1,
          backgroundColor: selected ? c.accBg : "transparent",
        },
        label: { ...label, color: selected ? c.tacc : c.t2 },
      };

    case "tab":
      return {
        box: {
          ...base,
          borderRadius: radii.sm,
          backgroundColor: selected ? c.accBg : "transparent",
        },
        label: { ...label, color: selected ? c.tacc : c.t2 },
      };

    case "block":
      return {
        box: {
          ...base,
          alignSelf: "stretch",
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: c.bd1,
        },
        label: { ...label, color: c.t2 },
      };

    case "fab":
      return {
        box: {
          ...base,
          // 48, measured off the prototype's phone frames — not the 50 the
          // three pages had each hand-written.
          width: 48,
          height: 48,
          padding: 0,
          borderRadius: radii.full,
          backgroundColor: c.prim,
          shadowColor: c.prim,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 8,
        },
        label: { ...label, color: c.onPrim, fontSize: 26, fontWeight: "300" },
      };
  }
}
