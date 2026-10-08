import { Link, type Href, router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentUser, logout } from "../services/api";
import type { AuthSession } from "../types/api";

type CurrentUser = AuthSession["user"];

export default function ProfileScreen() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true); setError("");
    void getCurrentUser().then(value => { if (active) setUser(value); }).catch(err => { if (active) setError(err instanceof Error ? err.message : "Không tải được thông tin tài khoản."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useFocusEffect(load);

  const signOut = useCallback(() => {
    const exit = () => void logout().catch(() => undefined).finally(() => router.replace("/"));
    if (Platform.OS === "web") { if (window.confirm("Đăng xuất khỏi CineBook?")) exit(); return; }
    Alert.alert("Đăng xuất", "Bạn muốn đăng xuất khỏi CineBook?", [{ text: "Hủy", style: "cancel" }, { text: "Đăng xuất", style: "destructive", onPress: exit }]);
  }, []);
  const initials = user?.fullName.split(/\s+/).filter(Boolean).slice(-2).map(part => part[0]).join("").toUpperCase() || "CB";

  if (loading) return <SafeAreaView style={s.safe}><ActivityIndicator color="#C52745" size="large" style={s.center} /></SafeAreaView>;
  if (!user) return <SafeAreaView style={s.safe}><View style={s.center}><Text style={s.error}>{error || "Bạn cần đăng nhập để xem thông tin tài khoản."}</Text><Link href="/login" style={s.login}>Đăng nhập</Link><Pressable onPress={() => router.back()}><Text style={s.backLink}>← Quay lại</Text></Pressable></View></SafeAreaView>;

  return <SafeAreaView style={s.safe}>
    <StatusBar style="dark" />
    <View style={s.header}><Pressable accessibilityLabel="Quay lại" onPress={() => router.back()} style={s.headerButton}><Text style={s.back}>‹</Text></Pressable><Text style={s.headerTitle}>Thành viên CineBook</Text><Link href="/bookings" asChild><Pressable accessibilityLabel="Vé của tôi" style={s.headerButton}><Text style={s.ticket}>🎟</Text></Pressable></Link></View>
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.identity}><View style={s.avatar}><Text style={s.initials}>{initials}</Text></View><View style={s.roleBadge}><Text style={s.roleText}>{user.role === "ADMIN" ? "QUẢN TRỊ" : "THÀNH VIÊN"}</Text></View><Text style={s.name}>{user.fullName.toLocaleUpperCase("vi")}</Text><Text style={s.memberId}>Mã thành viên CB{String(user.id).padStart(6, "0")}</Text></View>

      <View style={s.infoCard}><Text style={s.sectionTitle}>Thông tin tài khoản</Text><InfoRow label="Họ và tên" value={user.fullName} /><InfoRow label="Email" value={user.email} /><InfoRow label="Vai trò" value={user.role === "ADMIN" ? "Quản trị viên" : "Khách hàng"} /><InfoRow label="Mã người dùng" value={`#${user.id}`} last /></View>

      <View style={s.links}>
        <ProfileLink href="/favorites" icon="♥" title="Phim yêu thích" />
        <ProfileLink href="/bookings" icon="🎟" title="Lịch sử đặt vé" />
        <ProfileLink href="/notifications" icon="🔔" title="Thông báo" />
        {Platform.OS === "web" && user.role === "ADMIN" && <ProfileLink href="/admin" icon="⚙" title="Khu vực quản trị" />}
      </View>
      <Pressable accessibilityRole="button" onPress={signOut} style={s.logout}><Text style={s.logoutText}>Đăng xuất</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <View style={[s.infoRow, last && s.lastRow]}><Text style={s.infoLabel}>{label}</Text><Text selectable style={s.infoValue}>{value}</Text></View>;
}
function ProfileLink({ href, icon, title }: { href: string; icon: string; title: string }) {
  return <Link href={href as Href} asChild><Pressable style={s.linkRow}><Text style={s.linkIcon}>{icon}</Text><Text style={s.linkTitle}>{title}</Text><Text style={s.chevron}>›</Text></Pressable></Link>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F6" }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 24 },
  header: { height: 70, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#ECECEE" }, headerButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" }, back: { color: "#B3223E", fontSize: 46, lineHeight: 48, fontWeight: "300" }, ticket: { fontSize: 24 }, headerTitle: { color: "#17171A", fontSize: 21, fontWeight: "900" },
  content: { paddingBottom: 48 }, identity: { alignItems: "center", paddingTop: 30, paddingBottom: 26, backgroundColor: "#FFF" }, avatar: { width: 142, height: 142, borderRadius: 71, alignItems: "center", justifyContent: "center", backgroundColor: "#98243B", borderWidth: 6, borderColor: "#F3D7DC" }, initials: { color: "#FFF", fontSize: 45, fontWeight: "900" }, roleBadge: { marginTop: -17, paddingHorizontal: 13, paddingVertical: 6, borderRadius: 14, backgroundColor: "#D5304F", borderWidth: 3, borderColor: "#FFF" }, roleText: { color: "#FFF", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, name: { marginTop: 18, color: "#18181B", fontSize: 22, fontWeight: "900", textAlign: "center" }, memberId: { marginTop: 7, color: "#86868E", fontSize: 12, fontWeight: "600" },
  infoCard: { marginTop: 14, backgroundColor: "#FFF", paddingHorizontal: 20 }, sectionTitle: { color: "#C02745", fontSize: 14, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1, paddingVertical: 18 }, infoRow: { minHeight: 58, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 20, borderBottomWidth: 1, borderBottomColor: "#ECECEE" }, lastRow: { borderBottomWidth: 0 }, infoLabel: { color: "#66666D", fontSize: 14 }, infoValue: { flex: 1, color: "#202025", fontSize: 14, fontWeight: "700", textAlign: "right" },
  links: { marginTop: 14, backgroundColor: "#FFF" }, linkRow: { minHeight: 66, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#ECECEE" }, linkIcon: { width: 34, color: "#C02745", fontSize: 20, textAlign: "center" }, linkTitle: { flex: 1, color: "#343439", fontSize: 16, marginLeft: 14 }, chevron: { color: "#B6B6BA", fontSize: 30 },
  logout: { marginHorizontal: 20, marginTop: 22, minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 13, borderWidth: 1, borderColor: "#C02745", backgroundColor: "#FFF" }, logoutText: { color: "#B3223E", fontSize: 15, fontWeight: "900" }, error: { color: "#A6233D", textAlign: "center" }, login: { color: "#B3223E", fontSize: 16, fontWeight: "900" }, backLink: { color: "#555" },
});
