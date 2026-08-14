import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AuthHeader, AuthInput, AuthScreen, AuthColors, BackButton, ErrorBanner, PrimaryButton, SecondaryLink } from "@/components/auth-screen";
import { forgotPassword, getApiErrorMessage } from "@/lib/taskflow-auth";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) return setError("Enter a valid email address");
    setLoading(true); setError(null); setMessage(null);
    try {
      const response = await forgotPassword(normalizedEmail);
      setMessage(response.message);
      router.push({ pathname: "/(auth)/reset-password", params: { email: normalizedEmail } });
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setLoading(false); }
  }

  return (
    <AuthScreen>
      <BackButton />
      <AuthHeader title="Reset your password" subtitle="Enter your email and we’ll send a one-time verification code." />
      <ErrorBanner message={error} />
      {message ? <View style={styles.success}><Text style={styles.successText}>{message}</Text></View> : null}
      <AuthInput label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
      <PrimaryButton label="Send Verification Code" onPress={submit} loading={loading} />
      <View style={styles.footer}><Text style={styles.footerText}>Remembered it? </Text><SecondaryLink label="Log in" onPress={() => router.push("/(auth)/login")} /></View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  success: { backgroundColor: "#12362D", borderColor: "#2B8A6D", borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  successText: { color: "#A7F3D0", fontSize: 13, lineHeight: 18 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 26 },
  footerText: { color: AuthColors.muted, fontSize: 14 },
});
