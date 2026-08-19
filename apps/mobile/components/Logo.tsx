import Animated, { useReducedMotion } from "react-native-reanimated";
import { useColors } from "../lib/theme";
import {
  DOT_RATIO,
  MIN_3D_SIZE,
  SPIN_DIR,
  SPIN_MS,
  TILT,
  TILT_FLAT,
} from "../lib/markSpec";
import { GyroRing } from "./GyroRing";
import { useMarkAnimation } from "../lib/useMarkAnimation";

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

  const { wobbleStyle, dotStyle } = useMarkAnimation(spin);

  return (
    <Animated.View
      accessibilityRole="image"
      accessibilityLabel="Cadence"
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        wobbleStyle,
      ]}
    >
      <GyroRing
        size={size}
        color={c.prim}
        tiltX={tilt}
        tiltY={0}
        dir={SPIN_DIR.a}
        durationMs={SPIN_MS.a}
        spin={spin}
      />
      <GyroRing
        size={size}
        color={c.markB}
        tiltX={0}
        tiltY={tilt}
        dir={SPIN_DIR.b}
        durationMs={SPIN_MS.b}
        spin={spin}
      />
      <GyroRing
        size={size}
        color={c.markC}
        tiltX={tilt}
        tiltY={tilt}
        dir={SPIN_DIR.c}
        durationMs={SPIN_MS.c}
        spin={spin}
      />
      <Animated.View
        style={[
          {
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: c.t1,
          },
          dotStyle,
        ]}
      />
    </Animated.View>
  );
}
