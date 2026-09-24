import { Link, type Href, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { getShowtimeSelectionData } from "../../../../services/api";
import type { Cinema, Movie, Room, Showtime } from "../../../../types/api";

interface Data { movie: Movie; cinema: Cinema; rooms: Room[]; showtimes: Showtime[]; }
function dateKey(value: string) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function dateParts(key: string) { const date = new Date(`${key}T12:00:00`); return { weekday: date.toLocaleDateString("vi-VN", { weekday: "short" }), day: String(date.getDate()).padStart(2, "0"), month: `Th ${date.getMonth() + 1}` }; }
function time(value: string) { return new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); }

export default function SelectShowtimeScreen() {
  const params = useLocalSearchParams<{ id: string; cinemaId: string }>();
  const movieId = Number(params.id);
  const cinemaId = Number(params.cinemaId);
  const [data, setData] = useState<Data | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedShowtimeId, setSelectedShowtimeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (![movieId, cinemaId].every(value => Number.isInteger(value) && value > 0)) { setError("Thông tin phim hoặc rạp không hợp lệ."); setLoading(false); return; }
    try { setError(null); setData(await getShowtimeSelectionData(movieId, cinemaId, signal)); }
    catch (loadError) { if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("Không thể tải lịch chiếu."); }
    finally { setLoading(false); }
  }, [cinemaId, movieId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const roomById = useMemo(() => new Map(data?.rooms.map(room => [room.id, room]) ?? []), [data]);
  const upcoming = useMemo(() => (data?.showtimes ?? []).filter(item => Date.parse(item.startsAt) >= Date.now()).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)), [data]);
  const dates = useMemo(() => [...new Set(upcoming.map(item => dateKey(item.startsAt)))], [upcoming]);
  useEffect(() => { if (dates.length > 0 && (!selectedDate || !dates.includes(selectedDate))) { setSelectedDate(dates[0]!); setSelectedShowtimeId(null); } }, [dates, selectedDate]);
  const visibleShowtimes = useMemo(() => upcoming.filter(item => dateKey(item.startsAt) === selectedDate), [selectedDate, upcoming]);
  const selected = upcoming.find(item => item.id === selectedShowtimeId);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF526F" /><Text style={styles.muted}>Đang tải lịch chiếu...</Text></View>;
  if (error || !data) return <View style={styles.center}><Text style={styles.errorTitle}>Không tải được lịch</Text><Text style={styles.muted}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Thử lại</Text></Pressable></View>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF526F" />}>
      <Text style={styles.eyebrow}>BƯỚC 2 / 3</Text><Text style={styles.title}>Chọn ngày{"\n"}và suất chiếu</Text>
      <View style={styles.summary}><Text style={styles.movie}>{data.movie.title}</Text><Text style={styles.cinema}>{data.cinema.name} · {data.cinema.city}</Text></View>

      {dates.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dates}>{dates.map(key => { const part = dateParts(key); const active = selectedDate === key; return <Pressable key={key} onPress={() => { setSelectedDate(key); setSelectedShowtimeId(null); }} style={[styles.dateCard, active && styles.dateCardActive]}><Text style={[styles.weekday, active && styles.activeText]}>{part.weekday}</Text><Text style={[styles.day, active && styles.activeText]}>{part.day}</Text><Text style={[styles.month, active && styles.activeText]}>{part.month}</Text></Pressable>; })}</ScrollView> : null}

      <Text style={styles.sectionTitle}>Giờ chiếu</Text>
      {visibleShowtimes.length > 0 ? <View style={styles.showtimeList}>{visibleShowtimes.map(item => { const active = selectedShowtimeId === item.id; return <Pressable key={item.id} onPress={() => setSelectedShowtimeId(item.id)} style={[styles.showtimeCard, active && styles.showtimeCardActive]}><View><Text style={[styles.time, active && styles.activeText]}>{time(item.startsAt)}</Text><Text style={[styles.ends, active && styles.activeMuted]}>Kết thúc {time(item.endsAt)}</Text></View><View style={styles.roomBlock}><Text style={[styles.room, active && styles.activeText]}>{roomById.get(item.roomId)?.name ?? `Phòng ${item.roomId}`}</Text><Text style={[styles.format, active && styles.activeMuted]}>2D</Text></View></Pressable>; })}</View> : <View style={styles.empty}><Text style={styles.emptyText}>Không có suất chiếu trong ngày này.</Text></View>}

      {selected ? <View style={styles.footer}><Text style={styles.selectedLabel}>ĐÃ CHỌN</Text><Text style={styles.selectedText}>{time(selected.startsAt)} · {roomById.get(selected.roomId)?.name}</Text><Link href={`/movies/${movieId}/cinemas/${cinemaId}/showtimes/${selected.id}/seats` as Href} asChild><Pressable style={styles.nextButton}><Text style={styles.nextButtonText}>Tiếp tục chọn ghế  →</Text><Text style={styles.nextHint}>Mở sơ đồ ghế của suất này</Text></Pressable></Link></View> : <Text style={styles.guide}>Chọn một giờ chiếu để tiếp tục.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0F17" }, content: { padding: 20, paddingBottom: 42 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#0D0F17" },
  eyebrow: { color: "#FF7089", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 }, title: { marginTop: 7, color: "#FFFFFF", fontSize: 30, lineHeight: 36, fontWeight: "900" },
  summary: { marginTop: 17, padding: 15, borderRadius: 16, backgroundColor: "#181A25" }, movie: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, cinema: { marginTop: 5, color: "#9CA0B0", fontSize: 12 },
  dates: { gap: 9, paddingTop: 22, paddingBottom: 6 }, dateCard: { width: 66, alignItems: "center", paddingVertical: 11, borderRadius: 17, backgroundColor: "#1A1C27", borderWidth: 1, borderColor: "#292C3A" }, dateCardActive: { backgroundColor: "#FF526F", borderColor: "#FF526F" },
  weekday: { color: "#9296A7", fontSize: 10, fontWeight: "700" }, day: { marginTop: 4, color: "#FFFFFF", fontSize: 21, fontWeight: "900" }, month: { marginTop: 2, color: "#9296A7", fontSize: 10 }, activeText: { color: "#FFFFFF" }, activeMuted: { color: "#FFD3DB" },
  sectionTitle: { marginTop: 24, marginBottom: 12, color: "#FFFFFF", fontSize: 18, fontWeight: "800" }, showtimeList: { gap: 10 }, showtimeCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 17, backgroundColor: "#181A25", borderWidth: 1, borderColor: "#292C3A" },
  showtimeCardActive: { backgroundColor: "#4A1D31", borderColor: "#FF526F" }, time: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, ends: { marginTop: 4, color: "#868B9C", fontSize: 10 }, roomBlock: { alignItems: "flex-end" }, room: { color: "#C7CAD5", fontSize: 12, fontWeight: "800" }, format: { marginTop: 4, color: "#FF7089", fontSize: 10, fontWeight: "800" },
  empty: { padding: 18, borderRadius: 15, backgroundColor: "#181A25" }, emptyText: { color: "#9397A7", fontSize: 13 }, footer: { marginTop: 24, padding: 18, borderRadius: 19, backgroundColor: "#191B27", borderWidth: 1, borderColor: "#2B2E3C" },
  selectedLabel: { color: "#FF7089", fontSize: 9, fontWeight: "900", letterSpacing: 1.4 }, selectedText: { marginTop: 6, color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, nextButton: { alignItems: "center", marginTop: 15, padding: 14, borderRadius: 14, backgroundColor: "#FF526F" }, nextButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, nextHint: { marginTop: 3, color: "#FFD2DA", fontSize: 10 },
  guide: { marginTop: 22, color: "#8F93A4", textAlign: "center", fontSize: 12 }, muted: { marginTop: 9, color: "#979BAB", textAlign: "center" }, errorTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" }, retry: { marginTop: 16, color: "#FF7089", fontWeight: "800" },
});
