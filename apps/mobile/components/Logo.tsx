import { useEffect } from "react";

import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "../lib/theme";
import {
  CORRECT_LEGS,
  DOT_PULSE_MS,
  DOT_PULSE_OPACITY,
  DOT_PULSE_SCALE,
  DOT_RATIO,
  MIN_3D_SIZE,
  SPIN_DIR,
  SPIN_MS,
  TILT,
  TILT_FLAT,
} from "../lib/markSpec";
import { GyroRing } from "./GyroRing";

interface Props {
  /** Rendered edge length. Everything else scales from this. */
  size?: number;
  /** Spin and correct. Off by default — chrome is static, the loader opts in. */
  animated?: boolean;
}

/**
 * The gyroscope mark — three rings, always correcting.
 *
 * Geometry and durations live in lib/markSpec.ts, lifted from the web's
 * mark.css so the two apps stay identical.
 *
 * Below MIN_3D_SIZE the rings are drawn at an opened-up tilt rather than the
 * display tilt: at 26px a 68° foreshortening collapses the three ellipses into
 * a blob. Web solves the same problem by swapping in a flattened SVG glyph;
 * opening the angle achieves it here without adding react-native-svg.
 *
 * Reduced motion is honoured with a static, legible pose — not a frozen
 * mid-spin frame — matching the web's media query.
 */
export function Logo({ size = 26, animated = false }: Props) {
  const c = useColors();
  const reduceMotion = useReducedMotion();
  const spin = animated && !reduceMotion;

  const tilt = size < MIN_3D_SIZE ? TILT_FLAT : TILT;
  const dot = size * DOT_RATIO;

  const wobble = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!spin) {
      wobble.value = 0;
      pulse.value = 1;
      return;
    }
    // The correction sequence: never settles, never repeats the same way twice
    // against the rings, because none of the four periods divide each other.
    wobble.value = withRepeat(
      withSequence(
        ...CORRECT_LEGS.map((l) =>
          withTiming(l.to, { duration: l.ms, easing: Easing.inOut(Easing.quad) }),
        ),
      ),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(DOT_PULSE_SCALE, { duration: DOT_PULSE_MS / 2, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: DOT_PULSE_MS / 2, easing: Easing.inOut(Easing.quad) }),
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
    opacity: 1 - (pulse.value - 1) / (DOT_PULSE_SCALE - 1) * (1 - DOT_PULSE_OPACITY),
  }));

  return (
    <Animated.View
      accessibilityRole="image"
      accessibilityLabel="Cadence"
      style={[{ width: size, height: size, alignItems: "center", justifyContent: "center" }, wobbleStyle]}
    >
      <GyroRing size={size} color={c.prim}  tiltX={tilt} tiltY={0}    dir={SPIN_DIR.a} durationMs={SPIN_MS.a} spin={spin} />
      <GyroRing size={size} color={c.markB} tiltX={0}    tiltY={tilt} dir={SPIN_DIR.b} durationMs={SPIN_MS.b} spin={spin} />
      <GyroRing size={size} color={c.markC} tiltX={tilt} tiltY={tilt} dir={SPIN_DIR.c} durationMs={SPIN_MS.c} spin={spin} />
      <Animated.View
        style={[
          { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: c.t1 },
          dotStyle,
        ]}
      />
    </Animated.View>
  );
}
