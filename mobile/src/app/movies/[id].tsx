import { Link, type Href, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { addFavorite, deleteMovieReview, getFavoriteStatus, getMovieDetails, getMyMovieReview, removeFavorite, saveMovieReview } from "../../services/api";
import type { Movie, MovieReview, ReviewPage, Showtime } from "../../types/api";

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
  const [reviews, setReviews] = useState<ReviewPage | null>(null);
  const [myReview, setMyReview] = useState<MovieReview | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState(false);
  const [favorite, setFavorite] = useState<boolean | null>(null);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    if (!Number.isInteger(movieId) || movieId <= 0) { setError("ID phim không hợp lệ."); setLoading(false); return; }
    try { setError(null); const result = await getMovieDetails(movieId, signal); setMovie(result.movie); setShowtimes(result.showtimes); setReviews(result.reviews); try { const [mine, isFavorite] = await Promise.all([getMyMovieReview(movieId), getFavoriteStatus(movieId)]); setMyReview(mine); setFavorite(isFavorite); if (mine) { setRating(mine.rating); setComment(mine.comment ?? ""); } } catch { setMyReview(null); setFavorite(null); } }
    catch (loadError) { if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("Không thể tải chi tiết phim."); }
    finally { setLoading(false); }
  }, [movieId]);

  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);
  const upcoming = useMemo(() => showtimes.filter(item => Date.parse(item.startsAt) >= Date.now()).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)), [showtimes]);
  const saveReview = async () => { try { setSavingReview(true); setReviewMessage(null); const saved = await saveMovieReview(movieId, rating, comment); setMyReview(saved); setReviewMessage("Đã lưu đánh giá của bạn."); const refreshed = await getMovieDetails(movieId); setReviews(refreshed.reviews); } catch (reviewError) { setReviewMessage(reviewError instanceof Error ? reviewError.message : "Không thể lưu đánh giá."); } finally { setSavingReview(false); } };
  const removeReview = async () => { try { setSavingReview(true); await deleteMovieReview(movieId); setMyReview(null); setRating(5); setComment(""); setReviewMessage("Đã xóa đánh giá."); const refreshed = await getMovieDetails(movieId); setReviews(refreshed.reviews); } catch (reviewError) { setReviewMessage(reviewError instanceof Error ? reviewError.message : "Không thể xóa đánh giá."); } finally { setSavingReview(false); } };
  const toggleFavorite = async () => { try { setSavingFavorite(true); setFavoriteMessage(null); if (favorite) { await removeFavorite(movieId); setFavorite(false); setFavoriteMessage("Đã bỏ khỏi danh sách yêu thích."); } else { await addFavorite(movieId); setFavorite(true); setFavoriteMessage("Đã thêm vào danh sách yêu thích."); } } catch (favoriteError) { setFavoriteMessage(favoriteError instanceof Error ? favoriteError.message : "Không thể cập nhật yêu thích."); } finally { setSavingFavorite(false); } };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF526F" /><Text style={styles.muted}>Đang tải chi tiết...</Text></View>;
  if (error || !movie) return <View style={styles.center}><Text style={styles.errorTitle}>Không mở được phim</Text><Text style={styles.muted}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Thử lại</Text></Pressable></View>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF526F" />}>
      {movie.posterUrl ? <Image source={{ uri: movie.posterUrl }} style={styles.poster} /> : <View style={[styles.poster, styles.placeholder]}><Text style={styles.posterIcon}>🎬</Text><Text style={styles.posterInitial}>{movie.title.slice(0, 1)}</Text></View>}
      <View style={styles.main}>
        <Text style={styles.label}>CINEBOOK FEATURE</Text>
        <View style={styles.titleRow}><Text style={styles.title}>{movie.title}</Text><Pressable disabled={savingFavorite} onPress={() => void toggleFavorite()} style={[styles.favoriteButton, favorite && styles.favoriteButtonActive]}><Text style={[styles.favoriteIcon, favorite && styles.favoriteIconActive]}>{favorite ? "♥" : "♡"}</Text></Pressable></View>
        {favoriteMessage && <Text style={styles.favoriteMessage}>{favoriteMessage}</Text>}
        <View style={styles.metaRow}><Meta label={`${movie.durationMinutes} phút`} /><Meta label={`Khởi chiếu ${formatDate(movie.releaseDate)}`} /></View>
        <Text style={styles.sectionTitle}>Nội dung phim</Text>
        <Text style={styles.synopsis}>{movie.synopsis ?? "Nội dung phim đang được cập nhật."}</Text>

        <View style={styles.reviewHeader}><Text style={styles.sectionTitle}>Đánh giá khán giả</Text><Text style={styles.reviewScore}>★ {reviews?.meta.averageRating.toFixed(1) ?? "0.0"} · {reviews?.meta.total ?? 0} đánh giá</Text></View>
        <View style={styles.reviewForm}><Text style={styles.formTitle}>{myReview ? "Đánh giá của bạn" : "Bạn thấy phim thế nào?"}</Text><View style={styles.stars}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} onPress={() => setRating(value)}><Text style={[styles.star, value <= rating && styles.starActive]}>★</Text></Pressable>)}</View><TextInput value={comment} onChangeText={setComment} maxLength={1000} multiline placeholder="Chia sẻ cảm nhận của bạn..." placeholderTextColor="#6F7485" style={styles.commentInput} /><Pressable disabled={savingReview} onPress={() => void saveReview()} style={styles.saveReview}>{savingReview ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveReviewText}>{myReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}</Text>}</Pressable>{myReview && <Pressable disabled={savingReview} onPress={() => void removeReview()}><Text style={styles.deleteReview}>Xóa đánh giá</Text></Pressable>}{reviewMessage && <Text style={styles.reviewMessage}>{reviewMessage}</Text>}</View>
        {reviews && reviews.data.length > 0 && <View style={styles.reviewList}>{reviews.data.map(review => <View key={review.id} style={styles.reviewCard}><View style={styles.reviewTop}><Text style={styles.reviewer}>{review.reviewerName ?? "Khán giả CineBook"}</Text><Text style={styles.reviewStars}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</Text></View>{review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}<Text style={styles.reviewDate}>{new Date(review.updatedAt).toLocaleDateString("vi-VN")}</Text></View>)}</View>}

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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 }, favoriteButton: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 23, backgroundColor: "#20222E", borderWidth: 1, borderColor: "#343746" }, favoriteButtonActive: { backgroundColor: "#4A1E31", borderColor: "#8A3555" }, favoriteIcon: { color: "#B3B6C3", fontSize: 26 }, favoriteIconActive: { color: "#FF7089" }, favoriteMessage: { marginTop: 8, color: "#F1C77A", fontSize: 10 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 16 }, meta: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: "#1E202C" }, metaText: { color: "#BEC1CD", fontSize: 11, fontWeight: "700" },
  sectionTitle: { marginTop: 27, color: "#FFFFFF", fontSize: 18, fontWeight: "800" }, synopsis: { marginTop: 10, color: "#A6AAB9", fontSize: 14, lineHeight: 22 },
  scheduleHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }, scheduleCount: { color: "#FF7089", fontSize: 12, fontWeight: "800" }, scheduleList: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 13 },
  showtimeChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: "#3C192A", borderWidth: 1, borderColor: "#642A42" }, showtimeText: { color: "#FFC0CD", fontSize: 11, fontWeight: "700" },
  emptySchedule: { marginTop: 13, padding: 16, borderRadius: 14, backgroundColor: "#181A25" }, emptyText: { color: "#9296A7", fontSize: 13 },
  nextStep: { marginTop: 28, padding: 20, borderRadius: 20, backgroundColor: "#181A25", borderWidth: 1, borderColor: "#292C3A" }, nextLabel: { color: "#777C8F", fontSize: 9, fontWeight: "900", letterSpacing: 1.4 },
  nextTitle: { marginTop: 6, color: "#FFFFFF", fontSize: 17, fontWeight: "800" }, nextText: { marginTop: 5, color: "#9195A5", fontSize: 12 }, muted: { marginTop: 10, color: "#979BAB", textAlign: "center" },
  reviewHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }, reviewScore: { color: "#F4C95D", fontSize: 11, fontWeight: "800" }, reviewForm: { marginTop: 13, padding: 16, borderRadius: 17, backgroundColor: "#181A25", borderWidth: 1, borderColor: "#292C3A" }, formTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, stars: { flexDirection: "row", gap: 8, marginTop: 10 }, star: { color: "#474B5B", fontSize: 27 }, starActive: { color: "#F4C95D" }, commentInput: { minHeight: 82, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "#10121A", color: "#FFFFFF", fontSize: 12, textAlignVertical: "top" }, saveReview: { minHeight: 43, alignItems: "center", justifyContent: "center", marginTop: 11, borderRadius: 12, backgroundColor: "#FF526F" }, saveReviewText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, deleteReview: { marginTop: 12, color: "#FF91A5", fontSize: 11, fontWeight: "800", textAlign: "center" }, reviewMessage: { marginTop: 10, color: "#F1C77A", fontSize: 10, textAlign: "center" }, reviewList: { gap: 10, marginTop: 12 }, reviewCard: { padding: 14, borderRadius: 14, backgroundColor: "#171924" }, reviewTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, reviewer: { flex: 1, color: "#FFFFFF", fontSize: 12, fontWeight: "800" }, reviewStars: { color: "#F4C95D", fontSize: 11 }, reviewComment: { marginTop: 8, color: "#B2B5C2", fontSize: 12, lineHeight: 18 }, reviewDate: { marginTop: 8, color: "#696E7F", fontSize: 9 },
  errorTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800" }, retry: { marginTop: 16, color: "#FF7089", fontWeight: "800" },
});
