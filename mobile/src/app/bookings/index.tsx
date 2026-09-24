import { Link, type Href, router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { ApiError, getBookingHistory } from "@/services/api";
import type { BookingHistoryItem, BookingStatus } from "@/types/api";

const filters: { label: string; status?: BookingStatus }[] = [{ label: "Tất cả" }, { label: "Đã thanh toán", status: "CONFIRMED" }, { label: "Chờ xử lý", status: "AWAITING_PAYMENT" }, { label: "Đã hủy", status: "CANCELLED" }, { label: "Hết hạn", status: "EXPIRED" }];
const statusLabel: Record<BookingStatus, string> = { PENDING: "Đang giữ ghế", AWAITING_PAYMENT: "Chờ thanh toán", CONFIRMED: "Đã thanh toán", CANCELLED: "Đã hủy", EXPIRED: "Hết hạn" };
const money = (value: string) => `${Number(value).toLocaleString("vi-VN")}đ`;
const dateTime = (value: string) => new Date(value).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function BookingHistoryScreen() {
  const [items, setItems] = useState<BookingHistoryItem[]>([]);
  const [status, setStatus] = useState<BookingStatus | undefined>();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextPage = 1, append = false) => {
    try { setError(null); const response = await getBookingHistory(nextPage, status); setItems(current => append ? [...current, ...response.data] : response.data); setPage(response.meta.page); setTotalPages(response.meta.totalPages); }
    catch (loadError) { if (loadError instanceof ApiError && loadError.status === 401) setError("Bạn cần đăng nhập để xem lịch sử đặt vé."); else setError(loadError instanceof Error ? loadError.message : "Không thể tải lịch sử đặt vé."); }
    finally { setLoading(false); setLoadingMore(false); setRefreshing(false); }
  }, [status]);

  useEffect(() => { setLoading(true); void load(); }, [load]);
  const refresh = () => { setRefreshing(true); void load(); };
  const more = () => { if (!loadingMore && page < totalPages) { setLoadingMore(true); void load(page + 1, true); } };

  return <View style={styles.screen}>
    <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>← Trang chủ</Text></Pressable><Text style={styles.title}>Lịch sử đặt vé</Text><View style={styles.spacer} /></View>
    <FlatList horizontal data={filters} keyExtractor={item => item.label} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterList} renderItem={({ item }) => <Pressable onPress={() => setStatus(item.status)} style={[styles.chip, status === item.status && styles.chipActive]}><Text style={[styles.chipText, status === item.status && styles.chipTextActive]}>{item.label}</Text></Pressable>} />
    {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#FF526F" /></View> : error ? <View style={styles.center}><Text style={styles.error}>{error}</Text>{error.includes("đăng nhập") ? <Link href={"/login" as Href} asChild><Pressable style={styles.login}><Text style={styles.loginText}>Đăng nhập</Text></Pressable></Link> : <Pressable onPress={() => void load()}><Text style={styles.retry}>Thử lại</Text></Pressable>}</View> : <FlatList data={items} keyExtractor={item => String(item.id)} contentContainerStyle={items.length ? styles.list : styles.emptyList} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#FF526F" />} onEndReached={more} onEndReachedThreshold={0.35} ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyTitle}>Chưa có đơn đặt vé</Text><Text style={styles.emptyText}>Đơn của bạn sẽ xuất hiện tại đây.</Text><Link href="/movies" style={styles.retry}>Khám phá phim</Link></View>} ListFooterComponent={loadingMore ? <ActivityIndicator color="#FF526F" /> : null} renderItem={({ item }) => <BookingCard item={item} />} />}
  </View>;
}

function BookingCard({ item }: { item: BookingHistoryItem }) {
  const target = item.status === "CONFIRMED" ? `/tickets/${item.id}` : `/bookings/${item.id}`;
  return <Link href={target as Href} asChild><Pressable style={styles.card}><View style={styles.cardTop}><View style={styles.movieInfo}><Text style={styles.movie}>{item.movie.title}</Text><Text style={styles.meta}>{dateTime(item.startsAt)}</Text></View><Text style={[styles.badge, item.status === "CONFIRMED" && styles.badgeSuccess]}>{statusLabel[item.status]}</Text></View><Text style={styles.cinema}>{item.cinemaName} · {item.roomName}</Text><Text style={styles.seats}>Ghế {item.seats.join(", ")}</Text><View style={styles.cardBottom}><Text style={styles.code}>Mã {item.code.slice(0, 8).toUpperCase()}</Text><Text style={styles.total}>{money(item.totalAmount)}</Text></View></Pressable></Link>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 54, backgroundColor: "#0D0F17" }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 }, back: { color: "#FF8198", fontSize: 11, fontWeight: "800" }, title: { color: "#FFFFFF", fontSize: 20, fontWeight: "900" }, spacer: { width: 58 }, filterList: { flexGrow: 0, marginTop: 20 }, filters: { gap: 8, paddingHorizontal: 20 }, chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: "#202330" }, chipActive: { backgroundColor: "#FF526F" }, chipText: { color: "#AEB2C0", fontSize: 11, fontWeight: "700" }, chipTextActive: { color: "#FFFFFF" },
  list: { padding: 20, gap: 12, paddingBottom: 40 }, emptyList: { flexGrow: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 }, card: { padding: 17, borderRadius: 17, backgroundColor: "#191B27", borderWidth: 1, borderColor: "#292C3A" }, cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, movieInfo: { flex: 1 }, movie: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" }, meta: { marginTop: 5, color: "#A7ABBA", fontSize: 11 }, badge: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, overflow: "hidden", backgroundColor: "#35303A", color: "#D3B8C0", fontSize: 9, fontWeight: "800" }, badgeSuccess: { backgroundColor: "#193525", color: "#7BE6A1" }, cinema: { marginTop: 13, color: "#D2D4DD", fontSize: 12 }, seats: { marginTop: 5, color: "#FF8198", fontSize: 12, fontWeight: "800" }, cardBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: "#292C3A" }, code: { color: "#777C8E", fontSize: 9 }, total: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" }, error: { color: "#FF8599", textAlign: "center", lineHeight: 20 }, retry: { marginTop: 15, color: "#FF7089", fontWeight: "800" }, login: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 13, backgroundColor: "#FF526F" }, loginText: { color: "#FFFFFF", fontWeight: "900" }, emptyTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" }, emptyText: { marginTop: 7, color: "#8F94A7" },
});
