import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AuthHeader, AuthInput, AuthScreen, AuthColors, BackButton, ErrorBanner, PrimaryButton, SecondaryLink } from "@/components/auth-screen";
import { useTaskFlowAuth } from "@/lib/taskflow-auth-context";

export default function LoginScreen() {
  const { login, loading, error, clearError } = useTaskFlowAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) return setLocalError("Enter a valid email address");
    if (!password) return setLocalError("Enter your password");
    setLocalError(null);
    clearError();
    try { await login(normalizedEmail, password); router.replace("/(tabs)"); }
    catch { /* context exposes the server error */ }
  }

  return (
    <AuthScreen>
      <BackButton />
      <AuthHeader title="Welcome back" subtitle="Sign in to keep your day moving forward." />
      <ErrorBanner message={localError ?? error} />
      <AuthInput label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
      <AuthInput label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry />
      <View style={styles.forgot}><SecondaryLink label="Forgot password?" onPress={() => router.push("/(auth)/forgot-password")} /></View>
      <PrimaryButton label="Log In" onPress={submit} loading={loading} />
      <View style={styles.footer}><Text style={styles.footerText}>New to TaskFlow? </Text><SecondaryLink label="Create an account" onPress={() => router.push("/(auth)/register")} /></View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  forgot: { alignItems: "flex-end", marginTop: -4, marginBottom: 12 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 14 },
  footerText: { color: AuthColors.muted, fontSize: 14 },
});
