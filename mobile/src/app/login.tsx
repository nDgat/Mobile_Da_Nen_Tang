import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError, login, registerAndLogin } from "@/services/api";

export default function LoginScreen() {
  const [registerMode, setRegisterMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password || (registerMode && !fullName.trim())) { setError("Vui lòng nhập đủ thông tin."); return; }
    try {
      setSubmitting(true); setError(null);
      if (registerMode) await registerAndLogin(fullName.trim(), email.trim(), password); else await login(email.trim(), password);
      if (router.canGoBack()) router.back(); else router.replace("/");
    } catch (submitError) { setError(submitError instanceof ApiError ? submitError.message : "Không thể kết nối máy chủ."); }
    finally { setSubmitting(false); }
  };

  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#0D0F17" }} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.screen}><View style={styles.form}>
    <Text style={styles.eyebrow}>CINEBOOK</Text><Text style={styles.title}>{registerMode ? "Tạo tài khoản" : "Đăng nhập"}</Text>
    <Text style={styles.caption}>Bộ phim tiếp theo đang chờ bạn. Đăng nhập để đặt ghế và lưu vé điện tử.</Text>
    {registerMode && <TextInput value={fullName} onChangeText={setFullName} placeholder="Họ và tên" placeholderTextColor="#737889" style={styles.input} />}
    <Text style={styles.label}>Email</Text>
    <TextInput accessibilityLabel="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" placeholder="ban@example.com" placeholderTextColor="#A1A5B5" style={styles.input} />
    <Text style={styles.label}>Mật khẩu</Text>
    <View style={styles.passwordRow}><TextInput accessibilityLabel="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" placeholder="Nhập mật khẩu" placeholderTextColor="#A1A5B5" style={styles.passwordInput} /><Pressable accessibilityLabel={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onPress={() => setShowPassword(value => !value)} style={styles.reveal}><Text style={styles.revealText}>{showPassword ? "Ẩn" : "Hiện"}</Text></Pressable></View>
    {error && <Text style={styles.error}>{error}</Text>}
    <Pressable disabled={submitting} onPress={() => void submit()} style={styles.button}>{submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{registerMode ? "Đăng ký" : "Đăng nhập"}</Text>}</Pressable>
    <Pressable onPress={() => { setRegisterMode(value => !value); setError(null); }}><Text style={styles.switch}>{registerMode ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}</Text></Pressable>
  </View></ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  screen: { flexGrow: 1, justifyContent: "center", padding: 20 }, form: { width: "100%", maxWidth: 460, alignSelf: "center", padding: 24, backgroundColor: "#171924", borderRadius: 24, borderWidth: 1, borderColor: "#2B2E3C" }, eyebrow: { color: "#FF7089", fontSize: 11, fontWeight: "900", letterSpacing: 2 }, title: { marginTop: 12, color: "#FFFFFF", fontSize: 32, fontWeight: "900" }, caption: { marginTop: 12, marginBottom: 26, color: "#ADB1C0", lineHeight: 22 },
  label: { color: "#D5D8E3", fontSize: 13, fontWeight: "600", marginBottom: 8 },
  passwordRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#2B2E3C", borderRadius: 14, backgroundColor: "#191B27", marginBottom: 20 },
  passwordInput: { flex: 1, minWidth: 0, padding: 14, color: "#FFFFFF", minHeight: 50 },
  reveal: { minHeight: 48, justifyContent: "center", paddingHorizontal: 14 }, revealText: { color: "#FF8BA0", fontWeight: "700" },
  input: { marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: "#191B27", borderWidth: 1, borderColor: "#2B2E3C", color: "#FFFFFF" }, error: { marginBottom: 12, color: "#FF8599" },
  button: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FF526F" }, buttonText: { color: "#FFFFFF", fontWeight: "900" }, switch: { marginTop: 20, color: "#FF8BA0", textAlign: "center", fontWeight: "700" },
});
