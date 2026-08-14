import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState, type PropsWithChildren } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

export const AuthColors = {
  background: "#060A16",
  surface: "#101729",
  surfaceRaised: "#151D33",
  border: "#283252",
  text: "#F5F7FF",
  muted: "#8993B2",
  primary: "#7D4DFF",
  primaryDeep: "#5630D9",
  blue: "#439BFF",
  danger: "#FF6B7A",
};

export function AuthScreen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const content = <View style={styles.content}>{children}</View>;
  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

export function BrandMark() {
  return (
    <View style={styles.brandRow}>
      <LinearGradient colors={[AuthColors.primary, AuthColors.blue]} style={styles.brandIcon}>
        <Text style={styles.brandCheck}>✓</Text>
      </LinearGradient>
      <Text style={styles.brandText}>Task<Text style={styles.brandAccent}>Flow</Text></Text>
    </View>
  );
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <BrandMark />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function AuthInput({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType = "default", autoCapitalize = "none", maxLength }: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad";
  autoCapitalize?: "none" | "words";
  maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={AuthColors.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        autoCorrect={false}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
}

export function PrimaryButton({ label, onPress, loading = false }: { label: string; onPress: () => void; loading?: boolean }) {
  return (
    <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      <LinearGradient colors={[AuthColors.primary, AuthColors.primaryDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.buttonGradient}>
        {loading ? <ActivityIndicator color={AuthColors.text} /> : <Text style={styles.buttonText}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

export function SecondaryLink({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} hitSlop={8}><Text style={styles.link}>{label}</Text></Pressable>;
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return <View style={styles.error}><Text style={styles.errorText}>{message}</Text></View>;
}

export function BackButton() {
  return <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}><Text style={styles.backText}>‹</Text><Text style={styles.backLabel}>Back</Text></Pressable>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingVertical: 28, justifyContent: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 42 },
  brandIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  brandCheck: { color: "white", fontSize: 21, fontWeight: "800" },
  brandText: { color: AuthColors.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.8 },
  brandAccent: { color: AuthColors.primary },
  header: { marginBottom: 28 },
  title: { color: AuthColors.text, fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.8, marginBottom: 10 },
  subtitle: { color: AuthColors.muted, fontSize: 15, lineHeight: 22 },
  inputWrap: { marginBottom: 16 },
  label: { color: AuthColors.text, fontSize: 13, fontWeight: "700", marginBottom: 8 },
  input: { color: AuthColors.text, backgroundColor: AuthColors.surface, borderColor: AuthColors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, minHeight: 54, fontSize: 15 },
  inputFocused: { borderColor: AuthColors.primary },
  button: { borderRadius: 15, overflow: "hidden", marginTop: 8, marginBottom: 18 },
  buttonGradient: { minHeight: 54, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  buttonText: { color: "white", fontSize: 15, fontWeight: "800" },
  link: { color: AuthColors.primary, fontSize: 14, fontWeight: "700" },
  error: { backgroundColor: "#321A2B", borderColor: "#6C2A4A", borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: "#FFB5C0", fontSize: 13, lineHeight: 18 },
  back: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 24 },
  backText: { color: AuthColors.text, fontSize: 30, lineHeight: 30 },
  backLabel: { color: AuthColors.muted, fontSize: 14, fontWeight: "600" },
});
