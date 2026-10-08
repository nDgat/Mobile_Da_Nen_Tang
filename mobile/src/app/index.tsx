import { Link, type Href, router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MovieCollection } from "../components/MovieCollection";
import { SiteBanner } from "../components/SiteBanner";
import { HomeContentSections } from "../components/HomeContentSections";
import { getCurrentUser, getHomeData, getNotifications, hasSession, logout } from "../services/api";
import type { AuthSession, Movie, Showtime } from "../types/api";

interface HomeData { movies: Movie[]; showtimes: Showtime[]; movieTotal: number; showtimeTotal: number; cinemaTotal: number; }
type CurrentUser = AuthSession["user"];

export default function HomeScreen() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try { setError(null); setData(await getHomeData(signal)); }
    catch (loadError) { if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("Không thể kết nối CineBook API. Hãy kiểm tra backend và Wi-Fi."); }
  }, []);

  useEffect(() => { const controller = new AbortController(); void loadData(controller.signal); return () => controller.abort(); }, [loadData]);
  useFocusEffect(useCallback(() => {
    let current = true;
    void hasSession().then(async active => {
      if (!active) { if (current) { setUser(null); setUnread(0); } return; }
      const account = await getCurrentUser();
      if (!current) return;
      setUser(account);
      const notifications = await getNotifications(1, true).catch(() => null);
      if (current) setUnread(notifications?.meta.unread ?? 0);
    }).catch(() => { if (current) { setUser(null); setUnread(0); } });
    return () => { current = false; };
  }, []));

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);
  const confirmLogout = useCallback(() => {
    const exit = () => void logout().catch(() => undefined).finally(() => { setMenuOpen(false); setUser(null); setUnread(0); router.replace("/"); });
    if (Platform.OS === "web") { if (window.confirm("Đăng xuất khỏi CineBook?")) exit(); return; }
    Alert.alert("Đăng xuất", "Bạn muốn đăng xuất khỏi CineBook?", [
      { text: "Hủy", style: "cancel" }, { text: "Đăng xuất", style: "destructive", onPress: exit },
    ]);
  }, []);
  const initials = user?.fullName.split(/\s+/).filter(Boolean).slice(-2).map(part => part[0]).join("").toUpperCase() || "CB";

  return <SafeAreaView style={styles.safeArea}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF526F" />}>
      <View style={styles.header}>
        <Link href={(user ? "/profile" : "/login") as Href} asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={user ? "Mở thông tin người dùng" : "Đăng nhập"} style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></Pressable>
        </Link>
        <View style={styles.logo}><Text style={styles.logoMark}>C</Text><View><Text style={styles.logoName}>CINEBOOK</Text><Text style={styles.logoCaption}>MOVIE EXPERIENCE</Text></View></View>
        <View style={styles.headerActions}>
          <Link href={"/bookings" as Href} asChild><Pressable accessibilityRole="button" accessibilityLabel="Vé của tôi" style={styles.iconButton}><Text style={styles.ticketIcon}>🎟</Text></Pressable></Link>
          <Pressable accessibilityRole="button" accessibilityLabel="Mở menu" accessibilityState={{ expanded: menuOpen }} onPress={() => setMenuOpen(true)} style={styles.menuButton}><View style={styles.menuLine} /><View style={styles.menuLine} /><View style={styles.menuLine} />{unread > 0 && <Text style={styles.unreadBadge}>{unread > 9 ? "9+" : unread}</Text>}</Pressable>
        </View>
      </View>

      <SiteBanner />
      {error ? <View style={styles.stateCard}><Text style={styles.errorTitle}>Chưa tải được dữ liệu</Text><Text style={styles.stateText}>{error}</Text><Pressable onPress={() => void loadData()}><Text style={styles.retry}>Thử lại</Text></Pressable></View>
        : !data ? <View style={styles.loading}><ActivityIndicator color="#FF526F" size="large" /><Text style={styles.stateText}>Đang tải lịch phim...</Text></View>
        : <MovieCollection movies={data.movies} />}
      <HomeContentSections />
    </ScrollView>

    <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
      <View style={styles.menuOverlay}>
        <Pressable accessibilityLabel="Đóng menu" style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
        <SafeAreaView style={styles.drawer}>
          <View style={styles.drawerHeader}><View><Text style={styles.drawerEyebrow}>CINEBOOK</Text><Text style={styles.drawerTitle}>{user?.fullName ?? "Xin chào bạn"}</Text><Text style={styles.drawerEmail}>{user?.email ?? "Đăng nhập để đặt vé và lưu phim"}</Text></View><Pressable accessibilityLabel="Đóng menu" onPress={() => setMenuOpen(false)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable></View>
          <ScrollView contentContainerStyle={styles.menuList}>
            <MenuLink href="/movies" icon="🎬" title="Phim và lịch chiếu" onOpen={() => setMenuOpen(false)} />
            <MenuLink href="/bookings" icon="🎟" title="Vé của tôi" onOpen={() => setMenuOpen(false)} />
            <MenuLink href="/favorites" icon="♥" title="Phim yêu thích" onOpen={() => setMenuOpen(false)} />
            <MenuLink href="/notifications" icon="🔔" title="Thông báo" badge={unread} onOpen={() => setMenuOpen(false)} />
            <View style={styles.menuDivider} />
            <MenuLink href={user ? "/profile" : "/login"} icon="👤" title={user ? "Thông tin tài khoản" : "Đăng nhập / Đăng ký"} onOpen={() => setMenuOpen(false)} />
            {Platform.OS === "web" && user?.role === "ADMIN" && <MenuLink href="/admin" icon="⚙" title="Khu vực quản trị" onOpen={() => setMenuOpen(false)} />}
            {user && <Pressable accessibilityRole="button" onPress={confirmLogout} style={styles.menuItem}><Text style={styles.menuIcon}>↪</Text><Text style={[styles.menuText, styles.logoutText]}>Đăng xuất</Text></Pressable>}
          </ScrollView>
          <Text style={styles.drawerFooter}>Một chỗ ngồi · Ngàn cảm xúc</Text>
        </SafeAreaView>
      </View>
    </Modal>
  </SafeAreaView>;
}

function MenuLink({ href, icon, title, badge, onOpen }: { href: string; icon: string; title: string; badge?: number; onOpen: () => void }) {
  return <Link href={href as Href} asChild><Pressable accessibilityRole="link" onPress={onOpen} style={styles.menuItem}><Text style={styles.menuIcon}>{icon}</Text><Text style={styles.menuText}>{title}</Text>{!!badge && <Text style={styles.menuBadge}>{badge > 99 ? "99+" : badge}</Text>}<Text style={styles.chevron}>›</Text></Pressable></Link>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0B0D14" }, content: { paddingBottom: 44, width: "100%", maxWidth: 1180, alignSelf: "center" },
  header: { minHeight: 84, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "#8F243B", borderWidth: 2, borderColor: "#F2D7DE" }, avatarText: { color: "#FFF", fontWeight: "900", fontSize: 14 },
  logo: { position: "absolute", left: "50%", transform: [{ translateX: -74 }], width: 148, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, logoMark: { color: "#FFF", fontSize: 38, fontWeight: "900", fontStyle: "italic" }, logoName: { color: "#FFF", fontSize: 16, fontWeight: "900", letterSpacing: 1.2 }, logoCaption: { color: "#9DA4B5", fontSize: 7, fontWeight: "700", letterSpacing: 1.4 },
  headerActions: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 8 }, iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, ticketIcon: { fontSize: 25 },
  menuButton: { width: 46, height: 46, alignItems: "center", justifyContent: "center", gap: 6 }, menuLine: { width: 28, height: 3, borderRadius: 2, backgroundColor: "#FFF" }, unreadBadge: { position: "absolute", top: 0, right: 0, minWidth: 18, height: 18, paddingHorizontal: 3, borderRadius: 9, overflow: "hidden", backgroundColor: "#E53252", color: "#FFF", fontSize: 9, fontWeight: "900", textAlign: "center", lineHeight: 18 },
  loading: { minHeight: 260, alignItems: "center", justifyContent: "center", gap: 12 }, stateCard: { margin: 20, padding: 20, borderRadius: 18, backgroundColor: "#191B27" }, errorTitle: { color: "#FFF", fontSize: 17, fontWeight: "800" }, stateText: { marginTop: 6, color: "#A9ADBD", textAlign: "center", lineHeight: 20 }, retry: { marginTop: 14, color: "#FF7089", fontWeight: "800" },
  menuOverlay: { flex: 1, flexDirection: "row", justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.34)" }, menuBackdrop: { ...StyleSheet.absoluteFillObject }, drawer: { width: "86%", maxWidth: 390, height: "100%", backgroundColor: "#121520", borderLeftWidth: 1, borderLeftColor: "#303546" },
  drawerHeader: { padding: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1, borderBottomColor: "#292E3C" }, drawerEyebrow: { color: "#FF6C87", fontSize: 10, letterSpacing: 2, fontWeight: "900" }, drawerTitle: { color: "#FFF", fontSize: 21, fontWeight: "900", marginTop: 8 }, drawerEmail: { color: "#9EA6B9", fontSize: 12, marginTop: 5, maxWidth: 250 }, closeButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#252A39" }, closeText: { color: "#FFF", fontSize: 30, lineHeight: 32 },
  menuList: { padding: 14, gap: 4 }, menuItem: { minHeight: 58, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, borderRadius: 12 }, menuIcon: { width: 34, color: "#FF6C87", fontSize: 20, textAlign: "center" }, menuText: { flex: 1, color: "#EEF0F6", fontSize: 15, fontWeight: "700", marginLeft: 12 }, chevron: { color: "#70798D", fontSize: 28 }, menuBadge: { minWidth: 24, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 12, backgroundColor: "#C92E4C", color: "#FFF", textAlign: "center", fontSize: 11, fontWeight: "900" }, menuDivider: { height: 1, backgroundColor: "#292E3C", marginVertical: 8 }, logoutText: { color: "#FF8AA0" }, drawerFooter: { color: "#717A8D", textAlign: "center", padding: 24, fontSize: 11, letterSpacing: 0.8 },
});
