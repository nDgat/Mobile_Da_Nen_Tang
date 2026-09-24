import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { getCachedTicket, getTicket } from "@/services/api";
import { scheduleTicketReminder } from "@/services/local-notifications";
import type { Ticket } from "@/types/api";

const money = (value: string) => `${Number(value).toLocaleString("vi-VN")}đ`;
const dateTime = (value: string) => new Date(value).toLocaleString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function ElectronicTicketScreen() {
  const { bookingId: value } = useLocalSearchParams<{ bookingId: string }>();
  const bookingId = Number(value);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!Number.isInteger(bookingId) || bookingId <= 0) { setError("Mã vé không hợp lệ."); setLoading(false); return; }
    try { setError(null); setTicket(await getTicket(bookingId)); setOffline(false); }
    catch (loadError) {
      const cached = await getCachedTicket(bookingId);
      if (cached) { setTicket(cached); setOffline(true); }
      else setError(loadError instanceof Error ? loadError.message : "Không thể tải vé điện tử.");
    } finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => { void load(); }, [load]);
  const share = async () => { if (!ticket) return; await Share.share({ message: `CineBook – ${ticket.movie.title}\n${dateTime(ticket.showtime.startsAt)}\n${ticket.cinema.name} · ${ticket.room.name}\nGhế ${ticket.seats.join(", ")}\nMã vé: ${ticket.bookingCode}` }); };
  const remind = async () => { if (!ticket) return; try { const result = await scheduleTicketReminder(ticket); setReminderMessage(result === "SCHEDULED" ? "Đã đặt lời nhắc trước giờ chiếu 30 phút." : result === "DENIED" ? "Bạn chưa cho phép ứng dụng gửi thông báo." : "Suất chiếu còn dưới 30 phút nên không thể đặt lời nhắc."); } catch { setReminderMessage("Không thể đặt lời nhắc lúc này."); } };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF526F" /><Text style={styles.muted}>Đang chuẩn bị vé điện tử...</Text></View>;
  if (!ticket) return <View style={styles.center}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Thử lại</Text></Pressable></View>;

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>← Quay lại</Text></Pressable><Text style={styles.headerTitle}>Vé điện tử</Text><View style={styles.headerSpacer} /></View>
    {offline && <Text style={styles.offline}>Đang hiển thị vé đã lưu trên thiết bị</Text>}
    <View style={styles.ticket}>
      <Text style={styles.brand}>CINEBOOK</Text><Text style={styles.movie}>{ticket.movie.title}</Text>
      <View style={styles.qrBox}><QRCode value={ticket.qrValue} size={220} backgroundColor="#FFFFFF" color="#10121A" /></View>
      <Text style={styles.scanHint}>Đưa mã QR này cho nhân viên soát vé</Text>
      <View style={styles.cutLine} />
      <View style={styles.grid}><View style={styles.field}><Text style={styles.label}>SUẤT CHIẾU</Text><Text style={styles.value}>{dateTime(ticket.showtime.startsAt)}</Text></View><View style={styles.field}><Text style={styles.label}>PHÒNG / GHẾ</Text><Text style={styles.value}>{ticket.room.name} · {ticket.seats.join(", ")}</Text></View><View style={styles.field}><Text style={styles.label}>RẠP</Text><Text style={styles.value}>{ticket.cinema.name}</Text><Text style={styles.subValue}>{ticket.cinema.address}, {ticket.cinema.city}</Text></View><View style={styles.field}><Text style={styles.label}>NGƯỜI ĐẶT</Text><Text style={styles.value}>{ticket.holder.fullName}</Text><Text style={styles.subValue}>{ticket.holder.email}</Text></View></View>
      {ticket.concessions.length > 0 && <View style={styles.extra}><Text style={styles.label}>BẮP NƯỚC</Text><Text style={styles.value}>{ticket.concessions.map(item => `${item.name} × ${item.quantity}`).join(" · ")}</Text></View>}
      <View style={styles.cutLine} />
      <View style={styles.summary}><View><Text style={styles.label}>TỔNG TIỀN</Text><Text style={styles.total}>{money(ticket.totalAmount)}</Text></View><View style={styles.right}><Text style={styles.label}>MÃ VÉ</Text><Text style={styles.code}>{ticket.bookingCode}</Text></View></View>
      {ticket.paymentCode && <Text style={styles.payment}>Giao dịch: {ticket.paymentCode}{ticket.voucherCode ? ` · Voucher: ${ticket.voucherCode}` : ""}</Text>}
    </View>
    <Pressable onPress={() => void share()} style={styles.share}><Text style={styles.shareText}>Chia sẻ thông tin vé</Text></Pressable>
    <Pressable onPress={() => void remind()} style={styles.reminder}><Text style={styles.reminderText}>🔔 Nhắc tôi trước giờ chiếu 30 phút</Text></Pressable>
    {reminderMessage && <Text style={styles.reminderMessage}>{reminderMessage}</Text>}
    <Text style={styles.note}>Vui lòng đến trước giờ chiếu 15 phút và không chia sẻ mã QR công khai.</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0F17" }, content: { padding: 20, paddingTop: 54, paddingBottom: 44 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#0D0F17" }, muted: { marginTop: 10, color: "#979BAB" }, error: { color: "#FF8599", textAlign: "center" }, retry: { marginTop: 16, color: "#FF7089", fontWeight: "800" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }, back: { color: "#FF8198", fontSize: 12, fontWeight: "800" }, headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" }, headerSpacer: { width: 60 }, offline: { marginBottom: 12, padding: 10, borderRadius: 10, backgroundColor: "#3A321B", color: "#F3CD79", fontSize: 11, textAlign: "center" },
  ticket: { padding: 22, borderRadius: 24, backgroundColor: "#F8F7F3" }, brand: { color: "#FF526F", fontSize: 12, fontWeight: "900", letterSpacing: 2, textAlign: "center" }, movie: { marginTop: 7, color: "#11131C", fontSize: 23, fontWeight: "900", textAlign: "center" }, qrBox: { alignSelf: "center", marginTop: 20, padding: 10, borderRadius: 14, backgroundColor: "#FFFFFF" }, scanHint: { marginTop: 11, color: "#72747D", fontSize: 10, textAlign: "center" }, cutLine: { marginVertical: 20, borderTopWidth: 1, borderStyle: "dashed", borderColor: "#C8C6C0" }, grid: { gap: 16 }, field: { gap: 3 }, label: { color: "#8A8990", fontSize: 9, fontWeight: "900", letterSpacing: 1 }, value: { color: "#171821", fontSize: 13, fontWeight: "800" }, subValue: { color: "#686972", fontSize: 10 }, extra: { gap: 4, marginTop: 17, padding: 13, borderRadius: 12, backgroundColor: "#ECEAE4" }, summary: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, total: { marginTop: 4, color: "#FF526F", fontSize: 22, fontWeight: "900" }, right: { flex: 1, alignItems: "flex-end" }, code: { marginTop: 5, color: "#171821", fontSize: 10, fontWeight: "800", textAlign: "right" }, payment: { marginTop: 15, color: "#77777E", fontSize: 9, textAlign: "center" },
  share: { alignItems: "center", marginTop: 16, paddingVertical: 15, borderRadius: 15, backgroundColor: "#FF526F" }, shareText: { color: "#FFFFFF", fontWeight: "900" }, note: { marginTop: 14, color: "#808596", fontSize: 10, lineHeight: 16, textAlign: "center" },
  reminder: { alignItems: "center", marginTop: 10, paddingVertical: 14, borderRadius: 15, backgroundColor: "#252836" }, reminderText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" }, reminderMessage: { marginTop: 10, color: "#F1C77A", fontSize: 10, textAlign: "center" },
});
