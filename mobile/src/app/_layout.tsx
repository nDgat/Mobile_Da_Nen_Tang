import { Stack } from "expo-router";

export default function RootLayout() {
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
    </Stack>
  );
}
