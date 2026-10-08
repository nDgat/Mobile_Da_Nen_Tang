import * as Location from "expo-location";
import type { Coordinates } from "../utils/cinema-location";

export async function requestUserLocation(): Promise<Coordinates> {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) throw new Error("Hãy bật dịch vụ vị trí trên thiết bị.");

  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== Location.PermissionStatus.GRANTED) {
    throw new Error("CineBook cần quyền vị trí để tính khoảng cách đến rạp.");
  }

  const result = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: result.coords.latitude, longitude: result.coords.longitude };
}