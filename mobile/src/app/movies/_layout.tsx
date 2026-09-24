import { Stack } from "expo-router";

export default function MoviesLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#0D0F17" }, headerTintColor: "#FFFFFF", headerShadowVisible: false, contentStyle: { backgroundColor: "#0D0F17" } }}>
      <Stack.Screen name="index" options={{ title: "Danh sách phim" }} />
      <Stack.Screen name="[id]" options={{ title: "Chi tiết phim" }} />
      <Stack.Screen name="[id]/cinemas" options={{ title: "Chọn rạp" }} />
      <Stack.Screen name="[id]/cinemas/[cinemaId]" options={{ title: "Chọn ngày và suất" }} />
      <Stack.Screen name="[id]/cinemas/[cinemaId]/showtimes/[showtimeId]/seats" options={{ title: "Chọn ghế" }} />
    </Stack>
  );
}
