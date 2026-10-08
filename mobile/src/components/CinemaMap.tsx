import { StyleSheet, Text, View } from "react-native";
import type { Cinema } from "../types/api";
import type { Coordinates } from "../utils/cinema-location";

export interface CinemaMapProps {
  cinemas: Cinema[];
  userLocation: Coordinates | null;
  selectedCinemaId: number | null;
  onSelectCinema: (cinemaId: number) => void;
}

export function CinemaMap({ cinemas }: CinemaMapProps) {
  return <View style={styles.fallback}><Text style={styles.title}>Bản đồ rạp CineBook</Text><Text style={styles.text}>{cinemas.length} rạp có tọa độ. Chọn “Xem bản đồ” bên dưới để mở vị trí trên OpenStreetMap.</Text></View>;
}

const styles = StyleSheet.create({
  fallback: { minHeight: 210, alignItems: "center", justifyContent: "center", padding: 24, borderRadius: 18, backgroundColor: "#181A25", borderWidth: 1, borderColor: "#303446" },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  text: { marginTop: 8, color: "#9EA3B4", textAlign: "center", lineHeight: 20 },
});