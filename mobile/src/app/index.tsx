import { Link, type Href, router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MovieCollection } from "../components/MovieCollection";
import { SiteBanner } from "../components/SiteBanner";
import { getCurrentUser, getHomeData, getNotifications, hasSession, logout } from "../services/api";
import type { Movie, Showtime } from "../types/api";

interface HomeData { movies: Movie[]; showtimes: Showtime[]; movieTotal: number; showtimeTotal: number; cinemaTotal: number; }

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 768;
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try { setError(null); setData(await getHomeData(signal)); }
    catch (loadError) { if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("Không thể kết nối CineBook API. Hãy kiểm tra backend và Wi-Fi."); }
  }, []);

  useEffect(() => { const controller = new AbortController(); void loadData(controller.signal); return () => controller.abort(); }, [loadData]);
  useFocusEffect(useCallback(() => {
    let current = true;
    setIsAdmin(false);
    void hasSession().then(async active => {
      if (!current) return;
      setLoggedIn(active);
      if (active) {
        const user = await getCurrentUser();
        if (!current) return;
        setIsAdmin(user.role === "ADMIN");
        const result = await getNotifications(1, true);
        if (current) setUnread(result.meta.unread);
      }
      else setUnread(0);
    }).catch(() => { if (current) setUnread(0); });
    return () => { current = false; };
  }, []));
  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);
  const confirmLogout = useCallback(() => {
    const exit = () => void logout().catch(() => undefined).finally(() => { setLoggedIn(false); setIsAdmin(false); setUnread(0); router.replace("/"); });
    if (Platform.OS === "web") { if (window.confirm("Đăng xuất khỏi CineBook?")) exit(); return; }
    Alert.alert("Đăng xuất", "Bạn muốn đăng xuất khỏi CineBook?", [
      { text: "Hủy", style: "cancel" }, { text: "Đăng xuất", style: "destructive", onPress: exit },
    ]);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF526F" />}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>CHÀO MỪNG ĐẾN</Text><Text style={styles.brand}>CineBook</Text></View>
          <View style={styles.headerActions}><Link href={"/notifications" as Href} asChild><Pressable style={styles.notificationButton}><Text style={styles.notificationText}>🔔</Text>{unread > 0 && <Text style={styles.unreadBadge}>{unread > 9 ? "9+" : unread}</Text>}</Pressable></Link><Link href={"/bookings" as Href} asChild><Pressable style={styles.myTickets}><Text style={styles.myTicketsText}>Vé của tôi</Text></Pressable></Link>{loggedIn ? <Pressable accessibilityRole="button" accessibilityLabel="Đăng xuất" onPress={confirmLogout} style={styles.accountButton}><Text style={styles.accountButtonText}>Thoát</Text></Pressable> : <Link href="/login" asChild><Pressable style={styles.accountButton}><Text style={styles.accountButtonText}>Đăng nhập</Text></Pressable></Link>}</View>
        </View>

        {isAdmin && <Link href={"/admin" as Href} asChild><Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>Mở khu vực quản trị →</Text></Pressable></Link>}
        <View style={[styles.hero, wide && styles.heroWide]}>
          <View style={styles.heroCopy}>
          <Text style={styles.heroLabel}>RẠP PHIM TRONG TẦM TAY</Text>
          <Text style={[styles.heroTitle, wide && styles.heroTitleWide]}>Một chỗ ngồi.{"\n"}Ngàn cảm xúc.</Text>
          <Text style={styles.heroText}>Lịch chiếu rõ ràng, ghế đẹp và vé điện tử ngay trên điện thoại.</Text>
          <Link href="/movies" asChild><Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>Khám phá phim  →</Text></Pressable></Link>
          </View>
          {wide && <View style={styles.heroTicket}><Text style={styles.ticketLabel}>CINEBOOK / MOVIE NIGHT</Text><Text style={styles.ticketTitle}>Hẹn bạn{"\n"}tại rạp.</Text><View style={styles.ticketRule} /><Text style={styles.ticketCaption}>Chọn phim · Chọn ghế · Tận hưởng</Text><Text style={styles.ticketNumber}>YOUR NEXT GREAT STORY</Text></View>}
        </View>
        <View style={styles.quickLinks}>
          {([{ href: "/movies", label: "Lịch chiếu", hint: "Tìm phim cho hôm nay" }, { href: "/bookings", label: "Vé của tôi", hint: "Lịch sử & vé điện tử" }, { href: "/favorites", label: "Yêu thích", hint: "Bộ sưu tập của bạn" }] as const).map(item => <Link key={item.href} href={item.href as Href} asChild><Pressable style={({ pressed }) => [styles.quickLink, pressed && styles.cardPressed]}><Text style={styles.quickTitle}>{item.label} ↗</Text><Text style={styles.quickHint}>{item.hint}</Text></Pressable></Link>)}
        </View>

        {error ? (
          <View style={styles.stateCard}><Text style={styles.errorTitle}>Chưa tải được dữ liệu</Text><Text style={styles.stateText}>{error}</Text><Pressable onPress={() => void loadData()}><Text style={styles.retry}>Thử lại</Text></Pressable></View>
        ) : !data ? (
          <View style={styles.loading}><ActivityIndicator color="#FF526F" size="large" /><Text style={styles.stateText}>Đang tải lịch phim...</Text></View>
        ) : (
          <>
            <View style={styles.stats}>
              <Stat value={data.movieTotal} label="Phim" /><View style={styles.divider} />
              <Stat value={data.cinemaTotal} label="Rạp" /><View style={styles.divider} />
              <Stat value={data.showtimeTotal} label="Suất chiếu" />
            </View>
            <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>ĐANG CHỜ BẠN</Text><Text style={styles.sectionTitle}>Phim nổi bật</Text></View><Link href="/movies" style={styles.viewAll}>Xem tất cả</Link></View>
            <MovieCollection movies={data.movies} />
            <SiteBanner />
          </>
        )}

        <View style={styles.tip}><Text style={styles.tipIcon}>✨</Text><View style={styles.tipContent}><Text style={styles.tipTitle}>Mẹo đặt vé</Text><Text style={styles.tipText}>Đặt sớm để chọn hàng ghế giữa và có góc nhìn đẹp nhất.</Text></View></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0D0F17" }, content: { paddingBottom: 42, width: "100%", maxWidth: 1180, alignSelf: "center" },
  header: { flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  eyebrow: { color: "#8F94A7", fontSize: 10, fontWeight: "700", letterSpacing: 2 }, brand: { marginTop: 2, color: "#FFFFFF", fontSize: 27, fontWeight: "900", letterSpacing: -0.7 },
  myTickets: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "#252836" }, myTicketsText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 }, notificationButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: "#252836" }, notificationText: { fontSize: 15 }, unreadBadge: { position: "absolute", top: -3, right: -3, minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: 9, overflow: "hidden", backgroundColor: "#FF526F", color: "#FFFFFF", fontSize: 9, fontWeight: "900", textAlign: "center", lineHeight: 17 },
  accountButton: { minHeight: 38, justifyContent: "center", paddingHorizontal: 11, borderRadius: 19, backgroundColor: "#3D1730", borderWidth: 1, borderColor: "#692744" }, accountButtonText: { color: "#FF99AD", fontSize: 10, fontWeight: "900" },
  hero: { marginHorizontal: 20, padding: 24, overflow: "hidden", borderRadius: 26, backgroundColor: "#3D1730", borderWidth: 1, borderColor: "#692744" },
  heroLabel: { color: "#FF99AD", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 }, heroTitle: { marginTop: 10, color: "#FFFFFF", fontSize: 31, fontWeight: "900", lineHeight: 37, letterSpacing: -0.8 },
  heroText: { marginTop: 16, maxWidth: 390, color: "#E5C9D5", fontSize: 15, lineHeight: 24 }, primaryButton: { alignSelf: "flex-start", minHeight: 48, justifyContent: "center", marginTop: 24, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 14, backgroundColor: "#FF526F" }, primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  heroWide: { flexDirection: "row", gap: 40, padding: 44, alignItems: "center" },
  heroCopy: { flex: 1 }, heroTitleWide: { fontSize: 52, lineHeight: 60, letterSpacing: -1.8 },
  heroTicket: { width: 280, padding: 26, borderRadius: 20, backgroundColor: "#F4DDD3", transform: [{ rotate: "4deg" }] },
  ticketLabel: { color: "#743D4D", fontSize: 10, letterSpacing: 2, fontWeight: "800" },
  ticketTitle: { color: "#3D1730", fontSize: 36, lineHeight: 42, fontWeight: "900", marginVertical: 24 },
  ticketRule: { borderTopWidth: 1, borderStyle: "dashed", borderColor: "#B88F91", marginBottom: 18 },
  ticketCaption: { color: "#683947", fontSize: 12 }, ticketNumber: { color: "#683947", fontSize: 9, letterSpacing: 2, marginTop: 18 },
  quickLinks: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginHorizontal: 20, marginTop: 20 },
  quickLink: { flexGrow: 1, flexBasis: 140, minHeight: 88, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: "#2B2E3E", backgroundColor: "#171924" },
  quickTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" }, quickHint: { color: "#ACB0C0", fontSize: 12, marginTop: 8 },
  loading: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 12 }, stateCard: { margin: 20, padding: 20, borderRadius: 18, backgroundColor: "#191B27" },
  errorTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" }, stateText: { marginTop: 6, color: "#A9ADBD", textAlign: "center", lineHeight: 20 }, retry: { marginTop: 14, color: "#FF7089", fontWeight: "800" },
  stats: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 18, paddingVertical: 18, borderRadius: 18, backgroundColor: "#171924" }, stat: { flex: 1, alignItems: "center" },
  statValue: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" }, statLabel: { marginTop: 3, color: "#8F94A7", fontSize: 11 }, divider: { width: 1, height: 30, backgroundColor: "#303342" },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 30, paddingHorizontal: 20 }, sectionEyebrow: { color: "#FF7089", fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  sectionTitle: { marginTop: 4, color: "#FFFFFF", fontSize: 24, fontWeight: "900" }, viewAll: { color: "#B7BBC8", fontSize: 13, fontWeight: "600" }, movieList: { paddingLeft: 20, paddingRight: 6, paddingTop: 16 },
  tip: { flexDirection: "row", marginHorizontal: 20, marginTop: 28, padding: 18, borderRadius: 18, backgroundColor: "#171924", borderWidth: 1, borderColor: "#282B39" }, tipIcon: { fontSize: 24 }, tipContent: { flex: 1, marginLeft: 13 },
  tipTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, tipText: { marginTop: 4, color: "#9DA1B1", fontSize: 13, lineHeight: 19 },
  cardPressed: { opacity: 0.78 },
});
