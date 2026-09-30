import { Link, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native";
import { MovieCollection } from "../../components/MovieCollection";
import { SiteBanner } from "../../components/SiteBanner";
import { getMoviesData } from "../../services/api";
import type { Movie } from "../../types/api";


export default function MoviesScreen() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      const result = await getMoviesData(signal);
      setMovies(result.movies);
    } catch (loadError) {
      if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("Không thể tải danh sách phim. Hãy kiểm tra backend và Wi-Fi.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const visibleMovies = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi-VN");
    return movies.filter(movie => {
      const matchesText = normalized === "" || movie.title.toLocaleLowerCase("vi-VN").includes(normalized);
      return matchesText;
    });
  }, [movies, query]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#FF526F" /><Text style={styles.help}>Đang tải phim...</Text></View>;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF526F" />}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>CINEBOOK COLLECTION</Text>
            <Text style={styles.heading}>Hôm nay, xem gì?</Text>
            <View style={styles.collectionRow}><Text style={styles.subheading}>{movies.length} phim đang hoạt động</Text><Link href={"/favorites" as Href} style={styles.favoriteLink}>♥ Phim yêu thích</Link></View>
            <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="Tìm tên phim" value={query} onChangeText={setQuery} placeholder="Tìm tên phim..." placeholderTextColor="#A1A5B5" style={styles.searchInput} returnKeyType="search" />{query.length > 0 && <Pressable accessibilityLabel="Xóa tìm kiếm" onPress={() => setQuery("")} style={{ padding: 12 }}><Text style={{ color: "#FFFFFF" }}>✕</Text></Pressable>}</View>

            {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>Thử lại</Text></Pressable></View> : null}
          </View>
        <MovieCollection movies={visibleMovies} />
        <SiteBanner />
        <Link href="/" style={styles.homeLink}>← Về trang chủ</Link>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0D0F17" }, list: { width: "100%", maxWidth: 1180, alignSelf: "center", padding: 20, paddingBottom: 42 }, separator: { height: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0D0F17" }, help: { marginTop: 9, color: "#9296A7", fontSize: 13 },
  header: { paddingBottom: 22 }, eyebrow: { color: "#FF7089", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  heading: { marginTop: 7, color: "#FFFFFF", fontSize: 31, lineHeight: 37, fontWeight: "900", letterSpacing: -0.7 }, subheading: { marginTop: 8, color: "#969AAA", fontSize: 13 },
  collectionRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }, favoriteLink: { marginTop: 8, color: "#FF8198", fontSize: 13, fontWeight: "800", paddingVertical: 8 },
  searchBox: { flexDirection: "row", alignItems: "center", marginTop: 20, height: 52, paddingHorizontal: 15, borderRadius: 16, backgroundColor: "#181A25", borderWidth: 1, borderColor: "#2A2D3B" },
  searchIcon: { marginRight: 10, color: "#FF7089", fontSize: 24 }, searchInput: { flex: 1, height: "100%", color: "#FFFFFF", fontSize: 15 },
  filters: { flexDirection: "row", gap: 10, marginTop: 14 }, filterButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: "#1B1D29" },
  filterButtonActive: { backgroundColor: "#FF526F" }, filterText: { color: "#A6AAB9", fontSize: 12, fontWeight: "700" }, filterTextActive: { color: "#FFFFFF" },
  error: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: "#321923" }, errorText: { color: "#FFC0CC", fontSize: 13, lineHeight: 19 }, retry: { marginTop: 8, color: "#FF7089", fontWeight: "800" },
  empty: { alignItems: "center", paddingVertical: 50 }, emptyIcon: { fontSize: 42 }, emptyTitle: { marginTop: 12, color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  homeLink: { alignSelf: "center", marginTop: 28, color: "#AEB2C0", fontSize: 14, fontWeight: "700" },
  pressed: { opacity: 0.78 },
});
