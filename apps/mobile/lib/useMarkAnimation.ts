import { useEffect } from "react";
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  CORRECT_LEGS,
  DOT_PULSE_MS,
  DOT_PULSE_OPACITY,
  DOT_PULSE_SCALE,
} from "./markSpec";

/**
 * The gyroscope's correction wobble and its centre-dot pulse.
 *
 * The wobble is the idea, not decoration: it never settles, and never repeats
 * the same way against the rings, because none of the four periods divide each
 * other. Kept out of the component so the mark file is geometry and the timing
 * lives beside the spec it reads.
 */
export function useMarkAnimation(spin: boolean) {
  const wobble = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!spin) {
      wobble.value = 0;
      pulse.value = 1;
      return;
    }
    wobble.value = withRepeat(
      withSequence(
        ...CORRECT_LEGS.map((l) =>
          withTiming(l.to, {
            duration: l.ms,
            easing: Easing.inOut(Easing.quad),
          }),
        ),
      ),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(DOT_PULSE_SCALE, {
          duration: DOT_PULSE_MS / 2,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, {
          duration: DOT_PULSE_MS / 2,
          easing: Easing.inOut(Easing.quad),
        }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(wobble);
      cancelAnimation(pulse);
    };
  }, [spin, wobble, pulse]);

  const wobbleStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${wobble.value}deg` }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    // Tied to the same driver as the scale so the two can never drift apart.
    opacity:
      1 - ((pulse.value - 1) / (DOT_PULSE_SCALE - 1)) * (1 - DOT_PULSE_OPACITY),
  }));

  return { wobbleStyle, dotStyle };
}
