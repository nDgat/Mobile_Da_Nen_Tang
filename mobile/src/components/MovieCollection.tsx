import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Movie } from "../types/api";
import { MovieCarousel } from "./MovieCarousel";

const tabs: { key: Movie["category"]; label: string }[] = [
  { key: "NOW_SHOWING", label: "Đang chiếu" },
  { key: "SPECIAL", label: "Đặc biệt" },
  { key: "COMING_SOON", label: "Sắp chiếu" },
];
export function MovieCollection({ movies }: { movies: Movie[] }) {
  const [category, setCategory] = useState<Movie["category"]>("NOW_SHOWING");
  const filtered = movies.filter(movie => (movie.category ?? "NOW_SHOWING") === category);
  return <View>
    <View accessibilityRole="tablist" style={s.tabs}>{tabs.map(tab => <Pressable key={tab.key} accessibilityRole="tab" accessibilityState={{ selected: category === tab.key }} onPress={() => setCategory(tab.key)} style={[s.tab, category === tab.key && s.active]}><Text style={[s.label, category === tab.key && s.selected]}>{tab.label}</Text></Pressable>)}</View>
    <MovieCarousel key={category} movies={filtered} />
  </View>;
}
const s = StyleSheet.create({ tabs: { flexDirection: "row", backgroundColor: "#202737", marginBottom: 12 }, tab: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 58, paddingVertical: 14, borderBottomWidth: 3, borderColor: "transparent" }, active: { borderColor: "#FF6582", backgroundColor: "#303348" }, label: { color: "#BFC4D5", fontSize: 15 }, selected: { color: "white", fontWeight: "800" } });
