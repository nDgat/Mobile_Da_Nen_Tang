import { Link, type Href, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { CinemaOptionCard } from "../../../components/CinemaOptionCard";
import { getCinemaOptions } from "../../../services/api";
import type { Cinema, Room, Showtime } from "../../../types/api";

interface Option { cinema: Cinema; showtimes: Showtime[]; }
function formatTime(value: string) { return new Date(value).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }

export default function SelectCinemaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const movieId = Number(id);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!Number.isInteger(movieId) || movieId <= 0) { setError("ID phim không hợp lệ."); setLoading(false); return; }
    try { setError(null); const result = await getCinemaOptions(movieId, signal); setCinemas(result.cinemas); setRooms(result.rooms); setShowtimes(result.showtimes); }
    catch (loadError) { if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("Không thể tải danh sách rạp."); }
    finally { setLoading(false); }
  }, [movieId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const options = useMemo<Option[]>(() => {
    const roomCinema = new Map(rooms.map(room => [room.id, room.cinemaId]));
    const now = Date.now();
    return cinemas.map(cinema => ({ cinema, showtimes: showtimes.filter(item => roomCinema.get(item.roomId) === cinema.id && Date.parse(item.startsAt) >= now).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)) })).filter(item => item.showtimes.length > 0);
  }, [cinemas, rooms, showtimes]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF526F" /><Text style={styles.muted}>Đang tìm rạp...</Text></View>;
  return (
    <View style={styles.screen}>
      <FlatList data={options} keyExtractor={item => String(item.cinema.id)} contentContainerStyle={styles.list} ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF526F" />}
        ListHeaderComponent={<View style={styles.header}><Text style={styles.eyebrow}>BƯỚC 1 / 3</Text><Text style={styles.title}>Bạn muốn xem{"\n"}ở rạp nào?</Text><Text style={styles.subtitle}>Chỉ hiển thị rạp có suất chiếu sắp tới.</Text>{error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Thử lại</Text></Pressable></View> : null}</View>}
        renderItem={({ item }) => <CinemaOptionCard cinema={item.cinema} showtimeCount={item.showtimes.length} nextShowtime={formatTime(item.showtimes[0]!.startsAt)} selected={selectedId === item.cinema.id} onPress={() => setSelectedId(item.cinema.id)} />}
        ListEmptyComponent={!error ? <View style={styles.empty}><Text style={styles.emptyIcon}>🏢</Text><Text style={styles.emptyTitle}>Chưa có rạp phù hợp</Text><Text style={styles.muted}>Phim chưa có suất chiếu sắp tới.</Text></View> : null}
        ListFooterComponent={selectedId ? <View style={styles.footer}><Text style={styles.selectedText}>Đã chọn: {cinemas.find(item => item.id === selectedId)?.name}</Text><Link href={`/movies/${movieId}/cinemas/${selectedId}` as Href} asChild><Pressable style={styles.nextButton}><Text style={styles.nextButtonText}>Tiếp tục chọn ngày và suất  →</Text><Text style={styles.nextHint}>Xem lịch chiếu tại rạp đã chọn</Text></Pressable></Link></View> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0F17" }, list: { padding: 20, paddingBottom: 42 }, separator: { height: 13 }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0D0F17" },
  header: { paddingBottom: 22 }, eyebrow: { color: "#FF7089", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 }, title: { marginTop: 7, color: "#FFFFFF", fontSize: 30, lineHeight: 36, fontWeight: "900" }, subtitle: { marginTop: 8, color: "#979BAB", fontSize: 13 },
  error: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#321923" }, errorText: { color: "#FFC0CC", fontSize: 13 }, retry: { marginTop: 8, color: "#FF7089", fontWeight: "800" },
  empty: { alignItems: "center", paddingVertical: 55 }, emptyIcon: { fontSize: 42 }, emptyTitle: { marginTop: 12, color: "#FFFFFF", fontSize: 18, fontWeight: "800" }, muted: { marginTop: 9, color: "#979BAB", textAlign: "center" },
  footer: { marginTop: 22 }, selectedText: { marginBottom: 10, color: "#AEB2C0", fontSize: 12 }, nextButton: { alignItems: "center", padding: 15, borderRadius: 16, backgroundColor: "#FF526F" }, nextButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, nextHint: { marginTop: 3, color: "#FFD2DA", fontSize: 10 },
});
