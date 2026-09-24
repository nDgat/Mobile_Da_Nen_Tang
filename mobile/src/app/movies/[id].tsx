import { Link, type Href, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { getMovieDetails } from "../../services/api";
import type { Movie, Showtime } from "../../types/api";

function formatDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }); }
function formatShowtime(value: string) { return new Date(value).toLocaleString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const movieId = Number(id);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!Number.isInteger(movieId) || movieId <= 0) { setError("ID phim không hợp lệ."); setLoading(false); return; }
    try { setError(null); const result = await getMovieDetails(movieId, signal); setMovie(result.movie); setShowtimes(result.showtimes); }
    catch (loadError) { if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("Không thể tải chi tiết phim."); }
    finally { setLoading(false); }
  }, [movieId]);

  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);
  const upcoming = useMemo(() => showtimes.filter(item => Date.parse(item.startsAt) >= Date.now()).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)), [showtimes]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF526F" /><Text style={styles.muted}>Đang tải chi tiết...</Text></View>;
  if (error || !movie) return <View style={styles.center}><Text style={styles.errorTitle}>Không mở được phim</Text><Text style={styles.muted}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Thử lại</Text></Pressable></View>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF526F" />}>
      {movie.posterUrl ? <Image source={{ uri: movie.posterUrl }} style={styles.poster} /> : <View style={[styles.poster, styles.placeholder]}><Text style={styles.posterIcon}>🎬</Text><Text style={styles.posterInitial}>{movie.title.slice(0, 1)}</Text></View>}
      <View style={styles.main}>
        <Text style={styles.label}>CINEBOOK FEATURE</Text>
        <Text style={styles.title}>{movie.title}</Text>
        <View style={styles.metaRow}><Meta label={`${movie.durationMinutes} phút`} /><Meta label={`Khởi chiếu ${formatDate(movie.releaseDate)}`} /></View>
        <Text style={styles.sectionTitle}>Nội dung phim</Text>
        <Text style={styles.synopsis}>{movie.synopsis ?? "Nội dung phim đang được cập nhật."}</Text>

        <View style={styles.scheduleHeader}><Text style={styles.sectionTitle}>Suất chiếu sắp tới</Text><Text style={styles.scheduleCount}>{upcoming.length} suất</Text></View>
        {upcoming.length > 0 ? (
          <View style={styles.scheduleList}>{upcoming.slice(0, 8).map(item => <View key={item.id} style={styles.showtimeChip}><Text style={styles.showtimeText}>{formatShowtime(item.startsAt)}</Text></View>)}</View>
        ) : <View style={styles.emptySchedule}><Text style={styles.emptyText}>Phim chưa có lịch chiếu sắp tới.</Text></View>}

        {upcoming.length > 0 ? (
          <Link href={`/movies/${movie.id}/cinemas` as Href} asChild><Pressable style={styles.nextStep}><Text style={styles.nextLabel}>BƯỚC TIẾP THEO</Text><Text style={styles.nextTitle}>Chọn rạp và suất chiếu  →</Text><Text style={styles.nextText}>Xem các rạp đang có lịch chiếu phim này.</Text></Pressable></Link>
        ) : <View style={styles.nextStep}><Text style={styles.nextLabel}>CHƯA THỂ ĐẶT VÉ</Text><Text style={styles.nextTitle}>Chưa có rạp phù hợp</Text><Text style={styles.nextText}>Vui lòng quay lại khi phim có lịch chiếu.</Text></View>}
      </View>
    </ScrollView>
  );
}

function Meta({ label }: { label: string }) { return <View style={styles.meta}><Text style={styles.metaText}>{label}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0F17" }, content: { paddingBottom: 42 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#0D0F17" },
  poster: { width: "100%", height: 330 }, placeholder: { alignItems: "center", justifyContent: "center", backgroundColor: "#3D1730" }, posterIcon: { fontSize: 58 }, posterInitial: { marginTop: 10, color: "#FFB3C2", fontSize: 44, fontWeight: "900" },
  main: { marginTop: -24, paddingHorizontal: 20, paddingTop: 25, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: "#0D0F17" },
  label: { color: "#FF7089", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 }, title: { marginTop: 8, color: "#FFFFFF", fontSize: 30, lineHeight: 37, fontWeight: "900", letterSpacing: -0.7 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 16 }, meta: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: "#1E202C" }, metaText: { color: "#BEC1CD", fontSize: 11, fontWeight: "700" },
  sectionTitle: { marginTop: 27, color: "#FFFFFF", fontSize: 18, fontWeight: "800" }, synopsis: { marginTop: 10, color: "#A6AAB9", fontSize: 14, lineHeight: 22 },
  scheduleHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }, scheduleCount: { color: "#FF7089", fontSize: 12, fontWeight: "800" }, scheduleList: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 13 },
  showtimeChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: "#3C192A", borderWidth: 1, borderColor: "#642A42" }, showtimeText: { color: "#FFC0CD", fontSize: 11, fontWeight: "700" },
  emptySchedule: { marginTop: 13, padding: 16, borderRadius: 14, backgroundColor: "#181A25" }, emptyText: { color: "#9296A7", fontSize: 13 },
  nextStep: { marginTop: 28, padding: 20, borderRadius: 20, backgroundColor: "#181A25", borderWidth: 1, borderColor: "#292C3A" }, nextLabel: { color: "#777C8F", fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  nextTitle: { marginTop: 6, color: "#FFFFFF", fontSize: 17, fontWeight: "800" }, nextText: { marginTop: 5, color: "#9195A5", fontSize: 12 }, muted: { marginTop: 10, color: "#979BAB", textAlign: "center" },
  errorTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" }, retry: { marginTop: 16, color: "#FF7089", fontWeight: "800" },
});
