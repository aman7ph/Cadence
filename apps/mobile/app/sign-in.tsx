import { useSSO } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "../lib/theme";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const c = useColors();
  const { startSSOFlow } = useSSO();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: Linking.createURL("/", { scheme: "cadence" }),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [startSSOFlow]);

  const s = StyleSheet.create({
    container:   { flex: 1, backgroundColor: c.bg },
    inner:       { flex: 1, justifyContent: "center", padding: 32, gap: 12 },
    logoRow:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
    logoMark:    { width: 40, height: 40, borderRadius: 11, backgroundColor: c.prim,
                   justifyContent: "center", alignItems: "center" },
    logoMarkTxt: { color: "#fff", fontWeight: "700", fontSize: 20 },
    logo:        { fontSize: 34, fontWeight: "700", color: c.t1, letterSpacing: -0.5 },
    tagline:     { fontSize: 15, color: c.t2, marginBottom: 28 },
    err:         { color: c.danger, fontSize: 13 },
    googleBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
                   backgroundColor: c.card, borderWidth: 1, borderColor: c.bd2,
                   borderRadius: 14, padding: 16, marginTop: 8 },
    googleTxt:   { fontSize: 16, fontWeight: "600", color: c.t1 },
  });

  return (
    <View style={s.container}>
      <View style={s.inner}>
        <View style={s.logoRow}>
          <View style={s.logoMark}>
            <Text style={s.logoMarkTxt}>C</Text>
          </View>
          <Text style={s.logo}>Cadence</Text>
        </View>
        <Text style={s.tagline}>Your habits, your goals, your progress.</Text>
        {error ? <Text style={s.err}>{error}</Text> : null}
        <TouchableOpacity style={s.googleBtn} onPress={handleGoogle} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color={c.t1} />
          ) : (
            <>
              <GoogleIcon />
              <Text style={s.googleTxt}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function GoogleIcon() {
  return (
    <View style={gStyles.wrapper}>
      <Text style={[gStyles.letter, { color: "#4285F4" }]}>G</Text>
      <Text style={[gStyles.letter, { color: "#EA4335" }]}>o</Text>
      <Text style={[gStyles.letter, { color: "#FBBC05" }]}>o</Text>
      <Text style={[gStyles.letter, { color: "#4285F4" }]}>g</Text>
      <Text style={[gStyles.letter, { color: "#34A853" }]}>l</Text>
      <Text style={[gStyles.letter, { color: "#EA4335" }]}>e</Text>
    </View>
  );
}

const gStyles = StyleSheet.create({
  wrapper: { flexDirection: "row" },
  letter:  { fontSize: 15, fontWeight: "700" },
});
