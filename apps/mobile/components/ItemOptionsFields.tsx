import { View } from "react-native";
import type { ItemOptions } from "@cadence/shared";
import { ComposerGoalPanel } from "./ComposerGoalPanel";
import { ComposerSpreadPanel } from "./ComposerSpreadPanel";

interface Props {
  value: ItemOptions;
  onChange: (next: ItemOptions) => void;
  disabled?: boolean;
}

/**
 * The two optional settings every item shares, as ONE block — the mobile twin
 * of web's item-options-fields.tsx (D18).
 *
 * Mobile previously had a third implementation of these settings
 * (`GoalChipsField` + `RepeatSection`) that differed from web's in control type
 * *and* in holding the numbers as strings. The shape now comes from
 * `@cadence/shared`, so the two apps cannot disagree about what they send.
 */
export function ItemOptionsFields({ value, onChange, disabled }: Props) {
  const set = (patch: Partial<ItemOptions>) => onChange({ ...value, ...patch });

  return (
    <View style={{ gap: 18 }}>
      <ComposerGoalPanel
        goalId={value.goalId}
        contribution={value.goalContribution}
        disabled={disabled}
        onSelect={(goalId) => set({ goalId })}
        onContributionChange={(goalContribution) => set({ goalContribution })}
      />
      <ComposerSpreadPanel
        enabled={value.spread}
        onEnabledChange={(spread) => set({ spread })}
        target={value.repeatTarget}
        onTargetChange={(repeatTarget) => set({ repeatTarget })}
        intervalMinutes={value.repeatIntervalMinutes}
        onIntervalChange={(repeatIntervalMinutes) =>
          set({ repeatIntervalMinutes })
        }
        disabled={disabled}
      />
    </View>
  );
}
