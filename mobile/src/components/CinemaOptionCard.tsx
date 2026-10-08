import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import type { Cinema } from "../types/api";
import { formatDistance } from "../utils/cinema-location";

interface Props {
  cinema: Cinema;
  showtimeCount: number;
  nextShowtime: string;
  distanceKm: number | null;
  selected: boolean;
  onPress: () => void;
  onDirections: () => void;
}

export function CinemaOptionCard({ cinema, showtimeCount, nextShowtime, distanceKm, selected, onPress, onDirections }: Props) {
  const directions = (event: GestureResponderEvent) => { event.stopPropagation(); onDirections(); };
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}>
      <View style={styles.topRow}><View style={styles.icon}><Text style={styles.iconText}>🎦</Text></View><View style={styles.heading}><Text style={styles.name}>{cinema.name}</Text><Text style={styles.city}>{cinema.city}</Text></View><View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View></View>
      <Text style={styles.address}>{cinema.address}</Text>
      <View style={styles.locationRow}>
        <Text style={styles.distance}>{distanceKm === null ? "Chưa có khoảng cách" : "Cách bạn " + formatDistance(distanceKm)}</Text>
        {cinema.latitude !== null && cinema.longitude !== null && <Pressable accessibilityRole="link" onPress={directions} style={styles.mapButton}><Text style={styles.mapButtonText}>Chỉ đường</Text></Pressable>}
      </View>
      <View style={styles.footer}><Text style={styles.next}>Gần nhất: {nextShowtime}</Text><Text style={styles.count}>{showtimeCount} suất</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 17, borderRadius: 20, backgroundColor: "#181A25", borderWidth: 1, borderColor: "#292C3A" }, selected: { backgroundColor: "#291725", borderColor: "#FF526F" }, pressed: { opacity: 0.8 },
  topRow: { flexDirection: "row", alignItems: "center" }, icon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "#3D1A2B" }, iconText: { fontSize: 20 },
  heading: { flex: 1, marginLeft: 12 }, name: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, city: { marginTop: 3, color: "#FF9AAF", fontSize: 11, fontWeight: "700" },
  radio: { width: 22, height: 22, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 2, borderColor: "#555A6B" }, radioSelected: { borderColor: "#FF526F" }, radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF526F" },
  address: { marginTop: 13, color: "#9CA0B0", fontSize: 12, lineHeight: 18 }, locationRow: { marginTop: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  distance: { flex: 1, color: "#F2C86D", fontSize: 11, fontWeight: "800" }, mapButton: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10, backgroundColor: "#272C3D" }, mapButtonText: { color: "#FF8FA4", fontSize: 10, fontWeight: "900" },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#292C39" },
  next: { color: "#C4C7D2", fontSize: 11, fontWeight: "600" }, count: { color: "#FF7089", fontSize: 11, fontWeight: "800" },
});