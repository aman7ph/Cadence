import { useEffect } from "react";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { RING_BORDER_RATIO } from "../lib/markSpec";

interface Props {
  size: number;
  color: string;
  /** Degrees of X/Y tilt. The pair is what makes each ring a distinct plane. */
  tiltX: number;
  tiltY: number;
  /** 1 or -1 — ring B counter-rotates against A and C. */
  dir: 1 | -1;
  durationMs: number;
  spin: boolean;
}

/**
 * One ring of the gyroscope: a bordered circle tilted into its own plane and
 * turned about Z.
 *
 * Unlike web, there is no `preserve-3d` stage. It is not needed and RN does not
 * support it reliably: the rings are siblings rather than nested, so each one
 * carries its own transform and no shared 3D context is required.
 *
 * The `perspective` entry is deliberately large. mark.css sets none at all, so
 * web renders these orthographically; a far-away camera reproduces that while
 * keeping the transform on RN's 3D path, which is better supported than
 * rotateX/rotateY with no perspective at all.
 */
export function GyroRing({
  size,
  color,
  tiltX,
  tiltY,
  dir,
  durationMs,
  spin,
}: Props) {
  const z = useSharedValue(0);

  useEffect(() => {
    if (!spin) {
      z.value = 0;
      return;
    }
    z.value = withRepeat(
      withTiming(360 * dir, { duration: durationMs, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(z);
  }, [spin, dir, durationMs, z]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateX: `${tiltX}deg` },
      { rotateY: `${tiltY}deg` },
      { rotateZ: `${z.value}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: Math.max(1, size * RING_BORDER_RATIO),
          borderColor: color,
        },
        style,
      ]}
    />
  );
}
