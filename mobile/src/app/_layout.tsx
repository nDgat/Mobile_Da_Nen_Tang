import { Stack, type Href, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }) });

export default function RootLayout() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data.url;
      if (typeof url === "string" && (url.startsWith("/tickets/") || url.startsWith("/bookings/"))) router.push(url as Href);
    });
    return () => subscription.remove();
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
      <Stack.Screen name="bookings" options={{ headerShown: false }} />
      <Stack.Screen name="tickets" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="favorites" options={{ headerShown: false }} />
    </Stack>
  );
}
