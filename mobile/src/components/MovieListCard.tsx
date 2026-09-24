import { Image, StyleSheet, Text, View } from "react-native";
import type { Movie } from "../types/api";

export function MovieListCard({ movie, showtimeCount }: { movie: Movie; showtimeCount: number }) {
  return (
    <View style={styles.card}>
      {movie.posterUrl ? <Image source={{ uri: movie.posterUrl }} style={styles.poster} /> : (
        <View style={[styles.poster, styles.placeholder]}><Text style={styles.icon}>🎞️</Text><Text style={styles.initial}>{movie.title.slice(0, 1)}</Text></View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.synopsis} numberOfLines={2}>{movie.synopsis ?? "Thông tin phim đang được cập nhật."}</Text>
        <View style={styles.footer}>
          <Text style={styles.duration}>{movie.durationMinutes} phút</Text>
          <View style={[styles.badge, showtimeCount === 0 && styles.badgeMuted]}>
            <Text style={[styles.badgeText, showtimeCount === 0 && styles.badgeTextMuted]}>{showtimeCount > 0 ? `${showtimeCount} suất` : "Sắp có lịch"}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", minHeight: 162, overflow: "hidden", borderRadius: 20, backgroundColor: "#181A25", borderWidth: 1, borderColor: "#282B39" },
  poster: { width: 112, minHeight: 162 }, placeholder: { alignItems: "center", justifyContent: "center", backgroundColor: "#3D1730" },
  icon: { fontSize: 28 }, initial: { marginTop: 5, color: "#FFB3C2", fontSize: 23, fontWeight: "900" },
  body: { flex: 1, padding: 14 }, title: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", lineHeight: 22 },
  synopsis: { marginTop: 7, color: "#9296A7", fontSize: 12, lineHeight: 18 }, footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 10 },
  duration: { color: "#C3C6D1", fontSize: 12, fontWeight: "600" }, badge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: "#4A1D31" },
  badgeMuted: { backgroundColor: "#272A36" }, badgeText: { color: "#FF9AAF", fontSize: 10, fontWeight: "800" }, badgeTextMuted: { color: "#9A9EAD" },
});
