import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Cinema } from "../types/api";

export function CinemaOptionCard({ cinema, showtimeCount, nextShowtime, selected, onPress }: { cinema: Cinema; showtimeCount: number; nextShowtime: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}>
      <View style={styles.topRow}><View style={styles.icon}><Text style={styles.iconText}>🎦</Text></View><View style={styles.heading}><Text style={styles.name}>{cinema.name}</Text><Text style={styles.city}>{cinema.city}</Text></View><View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View></View>
      <Text style={styles.address}>{cinema.address}</Text>
      <View style={styles.footer}><Text style={styles.next}>Gần nhất: {nextShowtime}</Text><Text style={styles.count}>{showtimeCount} suất</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 17, borderRadius: 20, backgroundColor: "#181A25", borderWidth: 1, borderColor: "#292C3A" }, selected: { backgroundColor: "#291725", borderColor: "#FF526F" }, pressed: { opacity: 0.8 },
  topRow: { flexDirection: "row", alignItems: "center" }, icon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#3D1A2B" }, iconText: { fontSize: 20 },
  heading: { flex: 1, marginLeft: 12 }, name: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, city: { marginTop: 3, color: "#FF9AAF", fontSize: 11, fontWeight: "700" },
  radio: { width: 22, height: 22, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 2, borderColor: "#555A6B" }, radioSelected: { borderColor: "#FF526F" }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF526F" },
  address: { marginTop: 13, color: "#9CA0B0", fontSize: 12, lineHeight: 18 }, footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#292C39" },
  next: { color: "#C4C7D2", fontSize: 11, fontWeight: "600" }, count: { color: "#FF7089", fontSize: 11, fontWeight: "800" },
});
