import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function MoviesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Danh sách phim</Text>

      <Text style={styles.description}>
        Dữ liệu phim sẽ được thêm ở các phần sau.
      </Text>

      <Link href="/" style={styles.link}>
        Về trang chủ
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
    fontSize: 28,
    fontWeight: "bold",
  },
  description: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 16,
    textAlign: "center",
  },
  link: {
    color: "#1565C0",
    fontSize: 18,
    fontWeight: "600",
  },
});