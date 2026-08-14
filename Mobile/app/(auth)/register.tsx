import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AuthHeader, AuthInput, AuthScreen, AuthColors, BackButton, ErrorBanner, PrimaryButton, SecondaryLink } from "@/components/auth-screen";
import { useTaskFlowAuth } from "@/lib/taskflow-auth-context";

export default function RegisterScreen() {
  const { register, loading, error, clearError } = useTaskFlowAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (name.trim().length < 2) return setLocalError("Enter your name");
    if (!normalizedEmail.includes("@")) return setLocalError("Enter a valid email address");
    if (password.length < 8) return setLocalError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setLocalError("Passwords do not match");
    setLocalError(null);
    clearError();
    try { await register(name.trim(), normalizedEmail, password); router.replace("/(tabs)"); }
    catch { /* context exposes the server error */ }
  }

  return (
    <AuthScreen>
      <BackButton />
      <AuthHeader title="Create your account" subtitle="Set up your workspace and start making progress." />
      <ErrorBanner message={localError ?? error} />
      <AuthInput label="Full name" value={name} onChangeText={setName} placeholder="Ermias Negash" autoCapitalize="words" />
      <AuthInput label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
      <AuthInput label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />
      <AuthInput label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry />
      <PrimaryButton label="Create Account" onPress={submit} loading={loading} />
      <View style={styles.footer}><Text style={styles.footerText}>Already have an account? </Text><SecondaryLink label="Log in" onPress={() => router.push("/(auth)/login")} /></View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 14 },
  footerText: { color: AuthColors.muted, fontSize: 14 },
});
