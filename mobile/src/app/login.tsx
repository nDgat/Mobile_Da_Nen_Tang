import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError, login, registerAndLogin } from "@/services/api";

export default function LoginScreen() {
  const [registerMode, setRegisterMode] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password || (registerMode && !fullName.trim())) { setError("Vui lòng nhập đủ thông tin."); return; }
    try {
      setSubmitting(true); setError(null);
      if (registerMode) await registerAndLogin(fullName.trim(), email.trim(), password); else await login(email.trim(), password);
      router.back();
    } catch (submitError) { setError(submitError instanceof ApiError ? submitError.message : "Không thể kết nối máy chủ."); }
    finally { setSubmitting(false); }
  };

  return <View style={styles.screen}>
    <Text style={styles.eyebrow}>CINEBOOK</Text><Text style={styles.title}>{registerMode ? "Tạo tài khoản" : "Đăng nhập"}</Text>
    <Text style={styles.caption}>Đăng nhập để giữ ghế trong 5 phút.</Text>
    {registerMode && <TextInput value={fullName} onChangeText={setFullName} placeholder="Họ và tên" placeholderTextColor="#737889" style={styles.input} />}
    <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor="#737889" style={styles.input} />
    <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Mật khẩu" placeholderTextColor="#737889" style={styles.input} />
    {error && <Text style={styles.error}>{error}</Text>}
    <Pressable disabled={submitting} onPress={() => void submit()} style={styles.button}>{submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{registerMode ? "Đăng ký" : "Đăng nhập"}</Text>}</Pressable>
    <Pressable onPress={() => { setRegisterMode(value => !value); setError(null); }}><Text style={styles.switch}>{registerMode ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#0D0F17" }, eyebrow: { color: "#FF7089", fontSize: 11, fontWeight: "900", letterSpacing: 2 }, title: { marginTop: 8, color: "#FFFFFF", fontSize: 32, fontWeight: "900" }, caption: { marginTop: 8, marginBottom: 22, color: "#9DA1B0" },
  input: { marginBottom: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, backgroundColor: "#191B27", borderWidth: 1, borderColor: "#2B2E3C", color: "#FFFFFF" }, error: { marginBottom: 12, color: "#FF8599" },
  button: { minHeight: 50, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#FF526F" }, buttonText: { color: "#FFFFFF", fontWeight: "900" }, switch: { marginTop: 20, color: "#FF8BA0", textAlign: "center", fontWeight: "700" },
});
