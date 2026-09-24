import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ApiError, getBooking, releaseHold, submitBooking } from "@/services/api";
import type { BookingDetails } from "@/types/api";

const money = (value: string) => `${Number(value).toLocaleString("vi-VN")}đ`;
const dateTime = (value: string) => new Date(value).toLocaleString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);

  const load = useCallback(async () => {
    if (!Number.isInteger(bookingId) || bookingId <= 0) { setError("Mã đơn không hợp lệ."); setLoading(false); return; }
    try { setError(null); setBooking(await getBooking(bookingId)); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Không thể tải đơn đặt vé."); }
    finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!booking || booking.status === "CANCELLED" || booking.status === "EXPIRED" || booking.status === "CONFIRMED") return;
    const tick = () => { const seconds = Math.max(0, Math.ceil((new Date(booking.expiresAt).getTime() - Date.now()) / 1000)); setRemaining(seconds); if (seconds === 0) void load(); };
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [booking, load]);

  const submit = async () => { try { setSubmitting(true); setError(null); setBooking(await submitBooking(bookingId)); } catch (submitError) { setError(submitError instanceof ApiError ? submitError.message : "Không thể xác nhận đơn."); await load(); } finally { setSubmitting(false); } };
  const cancel = async () => { try { setSubmitting(true); setError(null); await releaseHold(bookingId); await load(); } catch (cancelError) { setError(cancelError instanceof Error ? cancelError.message : "Không thể hủy đơn."); } finally { setSubmitting(false); } };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF526F" /><Text style={styles.muted}>Đang tải đơn đặt vé...</Text></View>;
  if (!booking) return <View style={styles.center}><Text style={styles.title}>Không tải được đơn</Text><Text style={styles.error}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Thử lại</Text></Pressable></View>;
  const active = booking.status === "PENDING" || booking.status === "AWAITING_PAYMENT";

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>BƯỚC 4 / 4</Text><Text style={styles.title}>Xác nhận đặt vé</Text>
    <View style={styles.card}><Text style={styles.movie}>{booking.movie.title}</Text><Text style={styles.meta}>{booking.cinema.name} · {booking.room.name}</Text><Text style={styles.meta}>{dateTime(booking.showtime.startsAt)}</Text><Text style={styles.address}>{booking.cinema.address}, {booking.cinema.city}</Text></View>
    <View style={styles.card}><Text style={styles.sectionTitle}>Ghế đã chọn</Text><Text style={styles.seats}>{booking.seats.map(seat => seat.label).join(", ")}</Text>{booking.seats.map(seat => <View key={seat.id} style={styles.row}><Text style={styles.rowText}>Ghế {seat.label}</Text><Text style={styles.rowText}>{money(seat.price)}</Text></View>)}</View>
    <View style={styles.totalCard}><Text style={styles.totalLabel}>Tạm tính</Text><Text style={styles.total}>{money(booking.totalAmount)}</Text></View>
    {active && <View style={styles.timer}><Text style={styles.timerLabel}>{booking.status === "PENDING" ? "Thời gian giữ ghế" : "Thời gian thanh toán"}</Text><Text style={styles.timerValue}>{String(Math.floor(remaining / 60)).padStart(2, "0")}:{String(remaining % 60).padStart(2, "0")}</Text></View>}
    {booking.status === "PENDING" && <Pressable disabled={submitting} onPress={() => void submit()} style={styles.primary}>{submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Xác nhận đặt vé</Text>}</Pressable>}
    {booking.status === "AWAITING_PAYMENT" && <View style={styles.success}><Text style={styles.successTitle}>Đơn đã được tạo</Text><Text style={styles.successText}>Mã đơn {booking.code}{"\n"}Trạng thái: Đang chờ thanh toán</Text></View>}
    {booking.status === "EXPIRED" && <Text style={styles.stateText}>Đơn đã hết hạn và ghế đã được giải phóng.</Text>}
    {booking.status === "CANCELLED" && <Text style={styles.stateText}>Đơn đã được hủy.</Text>}
    {active && <Pressable disabled={submitting} onPress={() => void cancel()}><Text style={styles.cancel}>Hủy đơn</Text></Pressable>}
    {error && <Text style={styles.error}>{error}</Text>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0F17" }, content: { padding: 22, paddingTop: 60, paddingBottom: 44 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#0D0F17" },
  eyebrow: { color: "#FF7089", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 }, title: { marginTop: 7, marginBottom: 18, color: "#FFFFFF", fontSize: 30, fontWeight: "900" }, muted: { marginTop: 10, color: "#979BAB" },
  card: { marginBottom: 14, padding: 17, borderRadius: 17, backgroundColor: "#191B27", borderWidth: 1, borderColor: "#292C3A" }, movie: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" }, meta: { marginTop: 6, color: "#C3C6D1", fontSize: 12 }, address: { marginTop: 6, color: "#858A9B", fontSize: 11 },
  sectionTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, seats: { marginTop: 7, marginBottom: 11, color: "#FF8198", fontSize: 20, fontWeight: "900" }, row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderTopWidth: 1, borderTopColor: "#292C3A" }, rowText: { color: "#AEB2C0", fontSize: 12 },
  totalCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 17, borderRadius: 17, backgroundColor: "#24212B" }, totalLabel: { color: "#B9BDCA", fontWeight: "700" }, total: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  timer: { alignItems: "center", marginTop: 18 }, timerLabel: { color: "#9297A8", fontSize: 11 }, timerValue: { marginTop: 3, color: "#FF7089", fontSize: 28, fontWeight: "900" }, primary: { minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 18, borderRadius: 15, backgroundColor: "#FF526F" }, primaryText: { color: "#FFFFFF", fontWeight: "900" },
  success: { alignItems: "center", marginTop: 18, padding: 18, borderRadius: 16, backgroundColor: "#18271F", borderWidth: 1, borderColor: "#285A3C" }, successTitle: { color: "#7BE6A1", fontSize: 17, fontWeight: "900" }, successText: { marginTop: 7, color: "#B7C9BE", textAlign: "center", lineHeight: 20 }, stateText: { marginTop: 18, color: "#C7CAD5", textAlign: "center" }, cancel: { marginTop: 18, color: "#FF91A5", textAlign: "center", fontWeight: "800" }, error: { marginTop: 14, color: "#FF8599", textAlign: "center" }, retry: { marginTop: 16, color: "#FF7089", fontWeight: "800" },
});
