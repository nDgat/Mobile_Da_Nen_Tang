import { Link, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { HomeMovieCard } from "../components/HomeMovieCard";
import { getHomeData, getNotifications } from "../services/api";
import type { Movie, Showtime } from "../types/api";

interface HomeData { movies: Movie[]; showtimes: Showtime[]; movieTotal: number; showtimeTotal: number; cinemaTotal: number; }

function formatShowtime(value: string): string {
  return new Date(value).toLocaleString("vi-VN", { weekday: "short", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}

export default function HomeScreen() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    try { setError(null); setData(await getHomeData(signal)); }
    catch (loadError) { if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("Không thể kết nối CineBook API. Hãy kiểm tra backend và Wi-Fi."); }
  }, []);

  useEffect(() => { const controller = new AbortController(); void loadData(controller.signal); return () => controller.abort(); }, [loadData]);
  useEffect(() => { void getNotifications(1, true).then(result => setUnread(result.meta.unread)).catch(() => undefined); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, [loadData]);

  const nextShowtimeByMovie = useMemo(() => {
    const result = new Map<number, string>();
    if (!data) return result;
    const now = Date.now();
    for (const showtime of [...data.showtimes].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))) {
      if (!result.has(showtime.movieId) && Date.parse(showtime.startsAt) >= now) result.set(showtime.movieId, formatShowtime(showtime.startsAt));
    }
    return result;
  }, [data]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF526F" />}>
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>CHÀO MỪNG ĐẾN</Text><Text style={styles.brand}>CineBook</Text></View>
          <View style={styles.headerActions}><Link href={"/notifications" as Href} asChild><Pressable style={styles.notificationButton}><Text style={styles.notificationText}>🔔</Text>{unread > 0 && <Text style={styles.unreadBadge}>{unread > 9 ? "9+" : unread}</Text>}</Pressable></Link><Link href={"/bookings" as Href} asChild><Pressable style={styles.myTickets}><Text style={styles.myTicketsText}>Vé của tôi</Text></Pressable></Link></View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>RẠP PHIM TRONG TẦM TAY</Text>
          <Text style={styles.heroTitle}>Chọn phim hay.{"\n"}Đặt ghế thật nhanh.</Text>
          <Text style={styles.heroText}>Lịch chiếu rõ ràng, ghế đẹp và vé điện tử ngay trên điện thoại.</Text>
          <Link href="/movies" asChild><Pressable style={styles.primaryButton}><Text style={styles.primaryButtonText}>Khám phá phim  →</Text></Pressable></Link>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.movieList}>
              {data.movies.map(movie => (
                <Link key={movie.id} href={`/movies/${movie.id}` as Href} asChild>
                  <Pressable style={({ pressed }) => pressed && styles.cardPressed}>
                    <HomeMovieCard movie={movie} nextShowtime={nextShowtimeByMovie.get(movie.id)} />
                  </Pressable>
                </Link>
              ))}
            </ScrollView>
          </>
        )}

        <View style={styles.tip}><Text style={styles.tipIcon}>✨</Text><View style={styles.tipContent}><Text style={styles.tipTitle}>Mẹo đặt vé</Text><Text style={styles.tipText}>Đặt sớm để chọn hàng ghế giữa và có góc nhìn đẹp nhất.</Text></View></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) { return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0D0F17" }, content: { paddingBottom: 42 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 18 },
  eyebrow: { color: "#8F94A7", fontSize: 10, fontWeight: "700", letterSpacing: 2 }, brand: { marginTop: 2, color: "#FFFFFF", fontSize: 27, fontWeight: "900", letterSpacing: -0.7 },
  myTickets: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "#252836" }, myTicketsText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 }, notificationButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: "#252836" }, notificationText: { fontSize: 15 }, unreadBadge: { position: "absolute", top: -3, right: -3, minWidth: 17, height: 17, paddingHorizontal: 3, borderRadius: 9, overflow: "hidden", backgroundColor: "#FF526F", color: "#FFFFFF", fontSize: 9, fontWeight: "900", textAlign: "center", lineHeight: 17 },
  hero: { marginHorizontal: 20, padding: 24, overflow: "hidden", borderRadius: 26, backgroundColor: "#3D1730", borderWidth: 1, borderColor: "#692744" },
  heroLabel: { color: "#FF99AD", fontSize: 11, fontWeight: "800", letterSpacing: 1.4 }, heroTitle: { marginTop: 10, color: "#FFFFFF", fontSize: 31, fontWeight: "900", lineHeight: 37, letterSpacing: -0.8 },
  heroText: { marginTop: 12, maxWidth: 290, color: "#D7B9C5", fontSize: 14, lineHeight: 21 }, primaryButton: { alignSelf: "flex-start", marginTop: 22, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 14, backgroundColor: "#FF526F" }, primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
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
