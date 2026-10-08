import { Stack, type Href, router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { subscribeToNotificationResponses } from "../services/notification-response";

export default function RootLayout() {
  useEffect(() => {
    return subscribeToNotificationResponses(url => {
      if (url.startsWith("/tickets/") || url.startsWith("/bookings/")) router.push(url as Href);
    });
  }, []);
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#0D0F17" }, headerTintColor: "#FFFFFF", contentStyle: { backgroundColor: "#0D0F17" } }}>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="movies"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="login" options={{ title: "Tài khoản", presentation: "modal" }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="cinemas-map" options={{ headerShown: false }} />
      {Platform.OS === "web" && <Stack.Screen name="admin" options={{ headerShown: false }} />}
      <Stack.Screen name="admin-logs" options={{ headerShown: false }} />
      <Stack.Screen name="bookings/index" options={{ headerShown: false }} />
      <Stack.Screen name="bookings/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="tickets/[bookingId]" options={{ headerShown: false }} />
      <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
      <Stack.Screen name="favorites/index" options={{ headerShown: false }} />
    </Stack>
  );
}
