import { Image, StyleSheet, Text, View } from "react-native";
import type { Movie } from "../types/api";

export function HomeMovieCard({ movie, nextShowtime }: { movie: Movie; nextShowtime?: string }) {
  return (
    <View style={styles.card}>
      {movie.posterUrl ? <Image source={{ uri: movie.posterUrl }} style={styles.poster} /> : (
        <View style={[styles.poster, styles.placeholder]}><Text style={styles.placeholderIcon}>🎬</Text><Text style={styles.placeholderText}>{movie.title.slice(0, 1)}</Text></View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.meta}>{movie.durationMinutes} phút</Text>
        <Text style={styles.showtime} numberOfLines={1}>{nextShowtime ?? "Chưa có lịch chiếu"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 168, marginRight: 14, overflow: "hidden", borderRadius: 18, backgroundColor: "#1B1D2A", borderWidth: 1, borderColor: "#2B2E3E" },
  poster: { width: "100%", height: 190 },
  placeholder: { alignItems: "center", justifyContent: "center", backgroundColor: "#642A3C" },
  placeholderIcon: { fontSize: 38 }, placeholderText: { marginTop: 8, color: "#FFD7DF", fontSize: 28, fontWeight: "800" },
  content: { minHeight: 116, padding: 12 }, title: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", lineHeight: 21 },
  meta: { marginTop: 7, color: "#A9ADBD", fontSize: 13 }, showtime: { marginTop: 10, color: "#FFB3C2", fontSize: 12, fontWeight: "600" },
});
