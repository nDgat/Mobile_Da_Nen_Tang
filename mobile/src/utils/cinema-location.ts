import type { Cinema } from "../types/api";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function cinemaCoordinates(cinema: Cinema): Coordinates | null {
  if (cinema.latitude === null || cinema.longitude === null) return null;
  if (!Number.isFinite(cinema.latitude) || !Number.isFinite(cinema.longitude)) return null;
  return { latitude: cinema.latitude, longitude: cinema.longitude };
}

export function distanceKilometers(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371.0088;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return Math.max(1, Math.round(distanceKm * 1000)) + " m";
  return distanceKm.toLocaleString("vi-VN", { maximumFractionDigits: distanceKm < 10 ? 1 : 0 }) + " km";
}

export function cinemaMapUrl(cinema: Cinema): string | null {
  const coordinate = cinemaCoordinates(cinema);
  if (!coordinate) return null;
  return "https://www.openstreetmap.org/?mlat=" + coordinate.latitude + "&mlon=" + coordinate.longitude + "#map=17/" + coordinate.latitude + "/" + coordinate.longitude;
}

export function cinemaDirectionsUrl(cinema: Cinema, origin?: Coordinates | null): string | null {
  const destination = cinemaCoordinates(cinema);
  if (!destination) return null;
  const originPart = origin ? "&origin=" + origin.latitude + "," + origin.longitude : "";
  return "https://www.google.com/maps/dir/?api=1&destination=" + destination.latitude + "," + destination.longitude + originPart;
}