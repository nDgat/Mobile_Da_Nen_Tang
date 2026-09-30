import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { imageUri, uploadImage } from "../services/api";

export function ImageUpload({ value, onChange, disabled, onBusy }: { value: string; onChange: (url: string) => void; disabled?: boolean; onBusy?: (busy: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function choose() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); onBusy?.(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], base64: true, quality: 0.85, allowsEditing: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset?.base64) throw new Error("Không đọc được ảnh. Hãy chọn ảnh JPG hoặc PNG.");
      if (asset.base64.length > 7_000_000) throw new Error("Ảnh tối đa 5 MB. Hãy chọn ảnh nhỏ hơn.");
      onChange(await uploadImage(asset.base64));
    } catch (err) { setError(err instanceof Error ? err.message : "Không tải được ảnh."); }
    finally { lock.current = false; setBusy(false); onBusy?.(false); }
  }
  return <View style={{ gap: 10 }}>
    <Pressable accessibilityRole="button" disabled={disabled || busy} onPress={() => void choose()} style={{ alignSelf: "flex-start", backgroundColor: "#AC2949", padding: 14, borderRadius: 10, opacity: disabled || busy ? 0.5 : 1 }}><Text style={{ color: "white", fontWeight: "700" }}>{busy ? "Đang tải ảnh..." : "Chọn ảnh từ máy"}</Text></Pressable>
    {!!value && <Image source={{ uri: imageUri(value) }} style={{ width: 120, height: 150, borderRadius: 8 }} resizeMode="contain" accessibilityLabel="Ảnh đã chọn" />}
    <Text style={{ color: "#BBC3D8" }}>JPG, PNG, WebP · tối đa 5 MB</Text>
    {!!error && <Text accessibilityRole="alert" style={{ color: "#FF9CB0" }}>{error}</Text>}
  </View>;
}
