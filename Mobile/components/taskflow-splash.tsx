import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { AuthColors } from "@/components/auth-screen";

export function TaskFlowSplash() {
  return (
    <View style={styles.screen}>
      <LinearGradient colors={["#11163A", AuthColors.background]} style={styles.glow} />
      <View style={styles.logo}><Text style={styles.check}>✓</Text></View>
      <Text style={styles.title}>Task<Text style={styles.accent}>Flow</Text></Text>
      <Text style={styles.subtitle}>Plan. Focus. Achieve.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: AuthColors.background, alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute", width: 420, height: 420, borderRadius: 210, opacity: 0.7 },
  logo: { width: 84, height: 84, borderRadius: 27, backgroundColor: AuthColors.primary, alignItems: "center", justifyContent: "center", shadowColor: AuthColors.primary, shadowOpacity: 0.55, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  check: { color: "white", fontSize: 52, fontWeight: "800" },
  title: { color: AuthColors.text, fontSize: 34, fontWeight: "800", marginTop: 22, letterSpacing: -1 },
  accent: { color: AuthColors.primary },
  subtitle: { color: AuthColors.muted, fontSize: 14, marginTop: 8 },
});
