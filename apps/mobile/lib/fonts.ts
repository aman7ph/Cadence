// Cadence — mobile type layer.
//
// The counterpart to tailwind.config.ts `fontFamily` on web: body text stays on
// the platform UI face, and Lora carries the display roles (wordmark, screen
// and section headings, uppercase micro-labels, stat numerals) — about a
// quarter of the text, same split as web.
//
// IMPORTANT — React Native does not synthesise weights for custom faces the way
// a browser does. `fontWeight` selects nothing here: each weight is a SEPARATE
// registered family. Pairing a Lora family with `fontWeight` gets you either a
// silent no-op or a fake-bolded face, and the two platforms disagree about
// which. So always spread `display(weight)` and never set `fontWeight`
// alongside it.
//
//   <Text style={{ ...display("semibold"), fontSize: 17, color: c.t1 }} />

// Subpath imports, not the package root: the root re-exports all eight faces,
// so importing it would bundle four italics (~530KB) the design never uses.
import { Lora_400Regular } from "@expo-google-fonts/lora/400Regular";
import { Lora_500Medium } from "@expo-google-fonts/lora/500Medium";
import { Lora_600SemiBold } from "@expo-google-fonts/lora/600SemiBold";
import { Lora_700Bold } from "@expo-google-fonts/lora/700Bold";

/** The faces registered at startup. Matches the four weights web requests. */
export const displayFontMap = {
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
};

const FAMILIES = {
  regular: "Lora_400Regular",
  medium: "Lora_500Medium",
  semibold: "Lora_600SemiBold",
  bold: "Lora_700Bold",
} as const;

export type DisplayWeight = keyof typeof FAMILIES;

/**
 * Style fragment selecting a Lora face. `fontWeight` is deliberately pinned to
 * "normal": the face already carries the weight, and leaving it unset lets an
 * inherited or merged weight trigger synthetic bolding on top of a real bold.
 */
export function display(weight: DisplayWeight = "semibold") {
  return { fontFamily: FAMILIES[weight], fontWeight: "normal" } as const;
}
