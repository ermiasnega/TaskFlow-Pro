import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AuthHeader, AuthInput, AuthScreen, AuthColors, BackButton, ErrorBanner, PrimaryButton, SecondaryLink } from "@/components/auth-screen";
import { forgotPassword, getApiErrorMessage, resetPassword, verifyResetOtp } from "@/lib/taskflow-auth";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => setResendSeconds((seconds) => Math.max(seconds - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  async function verifyCode() {
    if (!email) return setError("This reset request is missing an email address");
    if (!/^\d{6}$/.test(otp)) return setError("Enter the six-digit code from your email");
    setLoading(true); setError(null);
    try {
      const response = await verifyResetOtp(email, otp);
      setResetToken(response.resetToken ?? null);
      setMessage("Code verified. Choose a new password below.");
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setLoading(false); }
  }

  async function resendCode() {
    if (!email || resendSeconds > 0 || resending) return;
    setResending(true); setError(null);
    try {
      const response = await forgotPassword(email);
      setMessage(response.message);
      setResendSeconds(60);
      setOtp("");
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setResending(false); }
  }

  async function submitPassword() {
    if (!resetToken) return setError("Verify the code before choosing a new password");
    if (password.length < 8) return setError("Password must be at least 8 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");
    setLoading(true); setError(null);
    try { const response = await resetPassword(resetToken, password); setMessage(response.message); setResetToken(null); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setLoading(false); }
  }

  return (
    <AuthScreen>
      <BackButton />
      <AuthHeader title={resetToken ? "Choose a new password" : "Verify your email"} subtitle={resetToken ? "Create a secure password to protect your TaskFlow account." : `Enter the six-digit code sent to ${email || "your email"}.`} />
      <ErrorBanner message={error} />
      {message ? <View style={styles.success}><Text style={styles.successText}>{message}</Text></View> : null}
      {!resetToken && !message?.startsWith("Password") ? <>
        <AuthInput label="Verification code" value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" keyboardType="number-pad" maxLength={6} />
        <PrimaryButton label="Verify Code" onPress={verifyCode} loading={loading} />
        <View style={styles.resendRow}>
          <Text style={styles.resendHint}>{resendSeconds > 0 ? `Didn’t receive it? Resend in ${resendSeconds}s` : "Didn’t receive the code?"}</Text>
          <Pressable disabled={resendSeconds > 0 || resending} onPress={resendCode} hitSlop={8}>
            <Text style={[styles.resendLink, (resendSeconds > 0 || resending) && styles.resendDisabled]}>{resending ? "Sending…" : "Resend OTP"}</Text>
          </Pressable>
        </View>
      </> : null}
      {resetToken ? <>
        <AuthInput label="New password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />
        <AuthInput label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry />
        <PrimaryButton label="Update Password" onPress={submitPassword} loading={loading} />
      </> : null}
      {message === "Password updated successfully" ? <SecondaryLink label="Return to login" onPress={() => router.replace("/(auth)/login")} /> : null}
      <View style={styles.footer}><Text style={styles.footerText}>Remembered it? </Text><SecondaryLink label="Log in" onPress={() => router.replace("/(auth)/login")} /></View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  success: { backgroundColor: "#12362D", borderColor: "#2B8A6D", borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  successText: { color: "#A7F3D0", fontSize: 14, lineHeight: 20 },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 26 },
  footerText: { color: AuthColors.muted, fontSize: 14 },
  resendRow: { alignItems: "center", gap: 6, marginTop: 2, marginBottom: 14 },
  resendHint: { color: AuthColors.muted, fontSize: 13, textAlign: "center" },
  resendLink: { color: AuthColors.primary, fontSize: 14, fontWeight: "800" },
  resendDisabled: { color: AuthColors.muted, opacity: 0.65 },
});
