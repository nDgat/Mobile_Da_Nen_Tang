import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CinemaMap } from "../components/CinemaMap";
import { getActiveCinemas } from "../services/api";
import { requestUserLocation } from "../services/user-location";
import type { Cinema } from "../types/api";
import { cinemaCoordinates, cinemaDirectionsUrl, cinemaMapUrl, distanceKilometers, formatDistance, type Coordinates } from "../utils/cinema-location";

export default function CinemasMapScreen() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void getActiveCinemas(controller.signal).then(items => {
      setCinemas(items);
      setSelectedCinemaId(items.find(item => cinemaCoordinates(item))?.id ?? null);
    }).catch(loadError => {
      if (!(loadError instanceof Error && loadError.name === "AbortError")) setError("Không thể tải vị trí các rạp.");
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const locate = useCallback(async () => {
    try { setLocating(true); setError(""); setUserLocation(await requestUserLocation()); }
    catch (locationError) { setError(locationError instanceof Error ? locationError.message : "Không thể lấy vị trí hiện tại."); }
    finally { setLocating(false); }
  }, []);

  const locatedCinemas = useMemo(() => cinemas.filter(cinema => cinemaCoordinates(cinema)), [cinemas]);
  const sortedCinemas = useMemo(() => [...locatedCinemas].sort((left, right) => {
    if (!userLocation) return left.city.localeCompare(right.city, "vi");
    return distanceKilometers(userLocation, cinemaCoordinates(left)!) - distanceKilometers(userLocation, cinemaCoordinates(right)!);
  }), [locatedCinemas, userLocation]);

  const openCinema = (cinema: Cinema, directions: boolean) => {
    const url = directions ? cinemaDirectionsUrl(cinema, userLocation) : cinemaMapUrl(cinema);
    if (url) void Linking.openURL(url);
  };

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="light" />
    <View style={styles.header}><Pressable accessibilityLabel="Quay lại" onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹</Text></Pressable><View><Text style={styles.eyebrow}>CINEBOOK</Text><Text style={styles.title}>Bản đồ rạp</Text></View><Pressable disabled={locating} onPress={() => void locate()} style={styles.locateButton}>{locating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.locateText}>⌖</Text>}</Pressable></View>
    {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#FF526F" /><Text style={styles.muted}>Đang tải bản đồ...</Text></View> :
    <ScrollView contentContainerStyle={styles.content}>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <CinemaMap cinemas={locatedCinemas} userLocation={userLocation} selectedCinemaId={selectedCinemaId} onSelectCinema={setSelectedCinemaId} />
      <Text style={styles.note}>{userLocation ? "Danh sách đã sắp xếp theo khoảng cách từ vị trí của bạn." : "Bấm nút định vị để xem khoảng cách và rạp gần nhất."}</Text>
      {sortedCinemas.map(cinema => {
        const coordinate = cinemaCoordinates(cinema)!;
        const distance = userLocation ? distanceKilometers(userLocation, coordinate) : null;
        return <Pressable key={cinema.id} onPress={() => setSelectedCinemaId(cinema.id)} style={[styles.card, selectedCinemaId === cinema.id && styles.selectedCard]}>
          <View style={styles.cardMain}><Text style={styles.name}>{cinema.name}</Text><Text style={styles.address}>{cinema.address}, {cinema.city}</Text>{distance !== null && <Text style={styles.distance}>Cách bạn {formatDistance(distance)}</Text>}</View>
          <View style={styles.cardActions}><Pressable onPress={() => openCinema(cinema, false)} style={styles.secondary}><Text style={styles.secondaryText}>Xem bản đồ</Text></Pressable><Pressable onPress={() => openCinema(cinema, true)} style={styles.primary}><Text style={styles.primaryText}>Chỉ đường</Text></Pressable></View>
        </Pressable>;
      })}
      {!locatedCinemas.length && <Text style={styles.empty}>Chưa có rạp nào được thiết lập tọa độ.</Text>}
    </ScrollView>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0D0F17" }, header: { minHeight: 76, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: "#252938" }, backButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, back: { color: "#FFF", fontSize: 42, lineHeight: 44 }, eyebrow: { color: "#FF7089", fontSize: 9, fontWeight: "900", letterSpacing: 1.5 }, title: { color: "#FFF", fontSize: 20, fontWeight: "900" }, locateButton: { marginLeft: "auto", width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#C92E4C" }, locateText: { color: "#FFF", fontSize: 23 },
  content: { padding: 18, gap: 13, paddingBottom: 45 }, center: { flex: 1, alignItems: "center", justifyContent: "center" }, muted: { marginTop: 10, color: "#9EA3B4" }, error: { padding: 12, borderRadius: 12, backgroundColor: "#321923", color: "#FFC0CC" }, note: { color: "#969BAD", fontSize: 12, lineHeight: 18 },
  card: { padding: 15, borderRadius: 16, backgroundColor: "#181A25", borderWidth: 1, borderColor: "#292E3C" }, selectedCard: { borderColor: "#FF526F", backgroundColor: "#281824" }, cardMain: { gap: 5 }, name: { color: "#FFF", fontSize: 15, fontWeight: "900" }, address: { color: "#9FA4B5", fontSize: 12, lineHeight: 18 }, distance: { color: "#F2C86D", fontSize: 12, fontWeight: "800" }, cardActions: { marginTop: 12, flexDirection: "row", gap: 8 }, secondary: { flex: 1, alignItems: "center", padding: 10, borderRadius: 10, backgroundColor: "#292E3E" }, secondaryText: { color: "#E1E4EC", fontWeight: "800", fontSize: 11 }, primary: { flex: 1, alignItems: "center", padding: 10, borderRadius: 10, backgroundColor: "#C92E4C" }, primaryText: { color: "#FFF", fontWeight: "900", fontSize: 11 }, empty: { padding: 25, color: "#9FA4B5", textAlign: "center" },
});