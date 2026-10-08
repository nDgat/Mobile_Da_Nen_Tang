import MapView, { Marker } from "react-native-maps";
import { useEffect, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import type { Cinema } from "../types/api";
import { cinemaCoordinates, type Coordinates } from "../utils/cinema-location";

export interface CinemaMapProps {
  cinemas: Cinema[];
  userLocation: Coordinates | null;
  selectedCinemaId: number | null;
  onSelectCinema: (cinemaId: number) => void;
}

export function CinemaMap({ cinemas, userLocation, selectedCinemaId, onSelectCinema }: CinemaMapProps) {
  const mapRef = useRef<MapView>(null);
  const located = useMemo(() => cinemas.flatMap(cinema => {
    const coordinate = cinemaCoordinates(cinema);
    return coordinate ? [{ cinema, coordinate }] : [];
  }), [cinemas]);
  const center = userLocation ?? located[0]?.coordinate ?? { latitude: 16.2, longitude: 107.8 };

  useEffect(() => {
    if (!userLocation) return;
    mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: 0.25, longitudeDelta: 0.25 }, 450);
  }, [userLocation]);

  useEffect(() => {
    const selected = located.find(item => item.cinema.id === selectedCinemaId);
    if (!selected) return;
    mapRef.current?.animateToRegion({ ...selected.coordinate, latitudeDelta: 0.12, longitudeDelta: 0.12 }, 350);
  }, [located, selectedCinemaId]);

  return <MapView
    ref={mapRef}
    style={styles.map}
    initialRegion={{ ...center, latitudeDelta: userLocation ? 0.35 : 14, longitudeDelta: userLocation ? 0.35 : 10 }}
    showsUserLocation={!!userLocation}
    showsMyLocationButton={!!userLocation}
  >
    {located.map(({ cinema, coordinate }) => <Marker
      key={cinema.id}
      coordinate={coordinate}
      title={cinema.name}
      description={cinema.address + ", " + cinema.city}
      pinColor={cinema.id === selectedCinemaId ? "#FF526F" : "#8F243B"}
      onPress={() => onSelectCinema(cinema.id)}
    />)}
  </MapView>;
}

const styles = StyleSheet.create({ map: { width: "100%", height: 330, borderRadius: 18 } });



