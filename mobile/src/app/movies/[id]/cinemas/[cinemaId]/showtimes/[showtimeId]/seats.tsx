import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { ApiError, getSeatMap, hasSession, holdSeats, releaseHold } from "@/services/api";
import type { SeatHold, SeatMap, ShowtimeSeat } from "@/types/api";

function money(value: string) { return `${Number(value).toLocaleString("vi-VN")}đ`; }
function showtime(value: string) { return new Date(value).toLocaleString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); }

export default function SeatMapScreen() {
  const { showtimeId } = useLocalSearchParams<{ showtimeId: string }>();
  const numericId = Number(showtimeId);
  const [data, setData] = useState<SeatMap | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hold, setHold] = useState<SeatHold | null>(null);
  const [holding, setHolding] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!Number.isInteger(numericId) || numericId <= 0) { setError("ID suất chiếu không hợp lệ."); setLoading(false); return; }
    try { setError(null); setData(await getSeatMap(numericId, signal)); setSelectedIds(new Set()); }
    catch (loadError) { if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("Không thể tải sơ đồ ghế."); }
    finally { setLoading(false); }
  }, [numericId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const rows = useMemo(() => {
    const grouped = new Map<string, ShowtimeSeat[]>();
    for (const seat of data?.seats ?? []) grouped.set(seat.rowLabel, [...(grouped.get(seat.rowLabel) ?? []), seat]);
    return [...grouped.entries()].map(([label, seats]) => ({ label, seats: seats.sort((a, b) => a.seatNumber - b.seatNumber) }));
  }, [data]);
  const selectedSeats = useMemo(() => data?.seats.filter(seat => selectedIds.has(seat.id)) ?? [], [data, selectedIds]);
  const total = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);

  useEffect(() => {
    if (!hold) return;
    const tick = () => { const seconds = Math.max(0, Math.ceil((new Date(hold.expiresAt).getTime() - Date.now()) / 1000)); setRemainingSeconds(seconds); if (seconds === 0) { setHold(null); void load(); } };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [hold, load]);

  const toggleSeat = (seat: ShowtimeSeat) => {
    if (seat.status !== "AVAILABLE") return;
    setSelectedIds(current => { const next = new Set(current); if (next.has(seat.id)) next.delete(seat.id); else if (next.size < 8) next.add(seat.id); return next; });
  };

  const submitHold = async () => {
    if (selectedIds.size === 0 || holding) return;
    if (!(await hasSession())) { router.push("/login" as never); return; }
    try { setHolding(true); setHoldError(null); const result = await holdSeats(numericId, [...selectedIds]); setHold(result); await load(); }
    catch (submitError) { if (submitError instanceof ApiError && submitError.status === 401) router.push("/login" as never); else { setHoldError(submitError instanceof Error ? submitError.message : "Không thể giữ ghế."); await load(); } }
    finally { setHolding(false); }
  };

  const cancelHold = async () => {
    if (!hold || holding) return;
    try { setHolding(true); setHoldError(null); await releaseHold(hold.id); setHold(null); await load(); }
    catch (releaseError) { setHoldError(releaseError instanceof Error ? releaseError.message : "Không thể hủy lượt giữ ghế."); }
    finally { setHolding(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF526F" /><Text style={styles.muted}>Đang tải sơ đồ ghế...</Text></View>;
  if (error || !data) return <View style={styles.center}><Text style={styles.errorTitle}>Không tải được ghế</Text><Text style={styles.muted}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Thử lại</Text></Pressable></View>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF526F" />}>
      <Text style={styles.eyebrow}>BƯỚC 3 / 4</Text><Text style={styles.title}>Chọn vị trí{"\n"}bạn yêu thích</Text>
      <View style={styles.summary}><Text style={styles.movie}>{data.movie.title}</Text><Text style={styles.meta}>{data.cinema.name} · {data.room.name}</Text><Text style={styles.meta}>{showtime(data.showtime.startsAt)}</Text></View>

      <View style={styles.screenBar}><View style={styles.screenGlow} /><Text style={styles.screenText}>MÀN HÌNH</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seatMap}>
        <View>{rows.map(row => <View key={row.label} style={styles.row}><Text style={styles.rowLabel}>{row.label}</Text>{row.seats.map(seat => { const selected = selectedIds.has(seat.id); return <Pressable key={seat.id} disabled={seat.status !== "AVAILABLE"} onPress={() => toggleSeat(seat)} style={[styles.seat, seat.type === "VIP" && styles.vipSeat, seat.status === "HELD" && styles.heldSeat, seat.status === "BOOKED" && styles.bookedSeat, selected && styles.selectedSeat]}><Text style={[styles.seatText, selected && styles.selectedSeatText]}>{seat.seatNumber}</Text></Pressable>; })}</View>)}</View>
      </ScrollView>

      <View style={styles.legend}><Legend color="#252936" label="Trống" /><Legend color="#70402B" label="Đang giữ" /><Legend color="#454957" label="Đã đặt" /><Legend color="#FF526F" label="Đang chọn" /></View>
      <Text style={styles.vipNote}>Ghế viền vàng là ghế VIP · Chọn tối đa 8 ghế</Text>

      {hold ? <View style={styles.holdResult}><Text style={styles.holdResultTitle}>Đang giữ ghế {hold.seats.map(seat => seat.label).join(", ")}</Text><Text style={styles.countdown}>Còn {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:{String(remainingSeconds % 60).padStart(2, "0")}</Text><Text style={styles.holdResultMeta}>Mã: {hold.code} · {money(hold.totalAmount)}</Text><Pressable onPress={() => router.push(`/bookings/${hold.id}` as never)} style={styles.continueButton}><Text style={styles.holdText}>Tiếp tục đặt vé</Text></Pressable><Pressable disabled={holding} onPress={() => void cancelHold()}><Text style={styles.cancelHold}>Hủy giữ ghế</Text></Pressable></View> : selectedSeats.length > 0 ? <View style={styles.checkout}><View><Text style={styles.selectedLabel}>{selectedSeats.map(seat => `${seat.rowLabel}${seat.seatNumber}`).join(", ")}</Text><Text style={styles.total}>{total.toLocaleString("vi-VN")}đ</Text></View><Pressable disabled={holding} onPress={() => void submitHold()} style={styles.holdButton}>{holding ? <ActivityIndicator color="#FFFFFF" /> : <><Text style={styles.holdText}>Giữ {selectedSeats.length} ghế</Text><Text style={styles.holdHint}>Trong 5 phút</Text></>}</Pressable></View> : <Text style={styles.guide}>Chạm vào ghế trống để chọn.</Text>}
      {holdError && <Text style={styles.holdError}>{holdError}</Text>}
    </ScrollView>
  );
}

function Legend({ color, label }: { color: string; label: string }) { return <View style={styles.legendItem}><View style={[styles.legendBox, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0F17" }, content: { padding: 20, paddingBottom: 42 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#0D0F17" },
  eyebrow: { color: "#FF7089", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 }, title: { marginTop: 7, color: "#FFFFFF", fontSize: 30, lineHeight: 36, fontWeight: "900" },
  summary: { marginTop: 17, padding: 15, borderRadius: 16, backgroundColor: "#181A25" }, movie: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" }, meta: { marginTop: 5, color: "#9DA1B0", fontSize: 12 },
  screenBar: { alignItems: "center", marginTop: 34, marginHorizontal: 24 }, screenGlow: { width: "100%", height: 5, borderRadius: 5, backgroundColor: "#E8DCEC", shadowColor: "#FFFFFF", shadowOpacity: 0.7, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, screenText: { marginTop: 8, color: "#696E80", fontSize: 9, fontWeight: "800", letterSpacing: 3 },
  seatMap: { minWidth: "100%", justifyContent: "center", paddingTop: 28, paddingHorizontal: 4 }, row: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 9 }, rowLabel: { width: 21, color: "#7F8495", fontSize: 11, fontWeight: "800" },
  seat: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "#252936", borderWidth: 1, borderColor: "#353A49" }, vipSeat: { borderColor: "#B58A3A" }, heldSeat: { backgroundColor: "#70402B", borderColor: "#8D573D" }, bookedSeat: { backgroundColor: "#454957", borderColor: "#454957" }, selectedSeat: { backgroundColor: "#FF526F", borderColor: "#FF8BA0" },
  seatText: { color: "#BDC1CE", fontSize: 10, fontWeight: "800" }, selectedSeatText: { color: "#FFFFFF" }, legend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 22 }, legendItem: { flexDirection: "row", alignItems: "center" }, legendBox: { width: 13, height: 13, marginRight: 5, borderRadius: 4 }, legendText: { color: "#9296A7", fontSize: 10 },
  vipNote: { marginTop: 13, color: "#B5A06C", textAlign: "center", fontSize: 10 }, checkout: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 25, padding: 16, borderRadius: 18, backgroundColor: "#191B27", borderWidth: 1, borderColor: "#2B2E3C" },
  selectedLabel: { maxWidth: 150, color: "#C7CAD5", fontSize: 11, fontWeight: "700" }, total: { marginTop: 5, color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, holdButton: { alignItems: "center", paddingHorizontal: 18, paddingVertical: 11, borderRadius: 13, backgroundColor: "#FF526F" }, holdText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, holdHint: { marginTop: 2, color: "#FFD2DA", fontSize: 9 },
  holdResult: { alignItems: "center", marginTop: 25, padding: 18, borderRadius: 18, backgroundColor: "#191B27", borderWidth: 1, borderColor: "#4D3040" }, holdResultTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, countdown: { marginTop: 7, color: "#FF7089", fontSize: 28, fontWeight: "900" }, holdResultMeta: { marginTop: 5, color: "#9DA1B0", fontSize: 11 }, cancelHold: { marginTop: 14, color: "#FF9AAD", fontWeight: "800" }, holdError: { marginTop: 13, color: "#FF8599", textAlign: "center" },
  continueButton: { marginTop: 16, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 13, backgroundColor: "#FF526F" },
  guide: { marginTop: 22, color: "#8F93A4", textAlign: "center", fontSize: 12 }, muted: { marginTop: 9, color: "#979BAB", textAlign: "center" }, errorTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" }, retry: { marginTop: 16, color: "#FF7089", fontWeight: "800" },
});
