import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AuthHeader, AuthInput, AuthScreen, AuthColors, BackButton, ErrorBanner, PrimaryButton, SecondaryLink } from "@/components/auth-screen";
import { getApiErrorMessage, resetPassword } from "@/lib/taskflow-auth";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!params.token) return setError("This reset link is missing its token");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setLoading(true); setError(null);
    try { const response = await resetPassword(params.token, password); setMessage(response.message); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setLoading(false); }
  }

  return (
    <AuthScreen>
      <BackButton />
      <AuthHeader title="Choose a new password" subtitle="Create a secure password to protect your TaskFlow account." />
      <ErrorBanner message={error} />
      {message ? <View style={styles.success}><Text style={styles.successText}>{message}</Text><SecondaryLink label="Return to login" onPress={() => router.replace("/(auth)/login")} /></View> : null}
      {!message ? <>
        <AuthInput label="New password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />
        <AuthInput label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry />
        <PrimaryButton label="Update Password" onPress={submit} loading={loading} />
      </> : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  success: { backgroundColor: "#12362D", borderColor: "#2B8A6D", borderWidth: 1, borderRadius: 12, padding: 14, gap: 12 },
  successText: { color: "#A7F3D0", fontSize: 14, lineHeight: 20 },
  footerText: { color: AuthColors.muted, fontSize: 14 },
});
