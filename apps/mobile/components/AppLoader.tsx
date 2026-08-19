import { useEffect } from "react";
import { Text, View } from "react-native";
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
import { display } from "../lib/fonts";
import { WORD_MS } from "../lib/markSpec";
import { Logo } from "./Logo";

/**
 * Full-screen opening state: the gyroscope, the wordmark, the promise.
 *
 * The mark is the only thing in the app that animates by default; everywhere
 * else it renders static.
 *
 * The plate follows the theme rather than staying dark as in the prototype — a
 * dark loader handing off to a light app reads as a flash of the wrong screen.
 * The app *icon* keeps its dark plate, which is a different surface. Same call
 * the web made.
 */
export function AppLoader() {
  const c = useColors();
  const reduceMotion = useReducedMotion();

  const word = useSharedValue(reduceMotion ? 1 : 0);
  const lift = useSharedValue(reduceMotion ? 0 : 6);

  useEffect(() => {
    if (reduceMotion) {
      word.value = 1;
      lift.value = 0;
      return;
    }
    // `cad-word-fade`: in at 15%, hold to 75%, out by 92%.
    word.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 0.15 * WORD_MS,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(1, { duration: 0.6 * WORD_MS }),
        withTiming(0, {
          duration: 0.17 * WORD_MS,
          easing: Easing.in(Easing.quad),
        }),
        withTiming(0, { duration: 0.08 * WORD_MS }),
      ),
      -1,
      false,
    );
    lift.value = withRepeat(
      withSequence(
        withTiming(0, {
          duration: 0.15 * WORD_MS,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(0, { duration: 0.6 * WORD_MS }),
        withTiming(-4, {
          duration: 0.17 * WORD_MS,
          easing: Easing.in(Easing.quad),
        }),
        withTiming(6, { duration: 0.08 * WORD_MS }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(word);
      cancelAnimation(lift);
    };
  }, [reduceMotion, word, lift]);

  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.value,
    transform: [{ translateY: lift.value }],
  }));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
    >
      <View style={{ alignItems: "center", gap: 28 }}>
        <Logo size={132} animated />
        <Animated.View style={[{ alignItems: "center", gap: 8 }, wordStyle]}>
          <Text style={{ ...display("semibold"), fontSize: 26, color: c.t1 }}>
            Cadence
          </Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "600",
              letterSpacing: 1.6,
              color: c.t3,
            }}
          >
            SMALL CORRECTIONS. STEADY COURSE.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
