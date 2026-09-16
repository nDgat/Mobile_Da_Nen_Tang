import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CineBook</Text>

      <Text style={styles.description}>
        Ứng dụng đặt vé xem phim
      </Text>

      <Link href="/movies" style={styles.link}>
        Xem danh sách phim
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  description: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 16,
  },
  link: {
    color: "#1565C0",
    fontSize: 18,
    fontWeight: "600",
  },
});