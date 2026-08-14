import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AuthColors, AuthScreen, BrandMark, PrimaryButton, SecondaryLink } from "@/components/auth-screen";

export default function WelcomeScreen() {
  return (
    <AuthScreen scroll={false}>
      <View style={styles.hero}>
        <BrandMark />
        <View style={styles.orbit}>
          <View style={styles.orbitInner}><Text style={styles.check}>✓</Text></View>
        </View>
        <Text style={styles.title}>Plan your tasks.{"\n"}Own your day.</Text>
        <Text style={styles.subtitle}>Stay focused, organized, and one step ahead with TaskFlow.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Get Started" onPress={() => router.push("/(auth)/register")} />
        <SecondaryLink label="I already have an account" onPress={() => router.push("/(auth)/login")} />
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: "center" },
  orbit: { width: 168, height: 168, borderRadius: 84, borderWidth: 1, borderColor: "#3B2A7C", alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 38, backgroundColor: "#111630" },
  orbitInner: { width: 106, height: 106, borderRadius: 53, backgroundColor: AuthColors.primary, alignItems: "center", justifyContent: "center", shadowColor: AuthColors.primary, shadowOpacity: 0.6, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  check: { color: "white", fontSize: 56, fontWeight: "800" },
  title: { color: AuthColors.text, fontSize: 35, lineHeight: 41, fontWeight: "800", letterSpacing: -1.2, textAlign: "center", marginBottom: 14 },
  subtitle: { color: AuthColors.muted, fontSize: 15, lineHeight: 23, textAlign: "center", maxWidth: 310, alignSelf: "center" },
  actions: { alignItems: "center", paddingBottom: 14 },
});
