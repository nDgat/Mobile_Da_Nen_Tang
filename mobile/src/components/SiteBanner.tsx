import { ImageUpload } from "./ImageUpload";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Rect, Stop, Path } from "react-native-svg";
import { getSiteBanner, saveSiteBanner, imageUri } from "../services/api";

export function SiteBanner({ editable = false }: { editable?: boolean }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("Một bộ phim hay, một buổi tối đáng nhớ.");
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const lock = useRef(false);
  const [status, setStatus] = useState("");
  const [retry, setRetry] = useState(0);
  useFocusEffect(useCallback(() => { setRetry(value => value + 1); }, []));
  useEffect(() => {
    if (retry === 0) return;
    const controller = new AbortController();
    setReady(false);
    void getSiteBanner(controller.signal).then(data => { setUrl(data.imageUrl); setTitle(data.title); setFailed(false); setReady(true); setStatus(""); }).catch(error => { if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : "Không tải được ảnh bìa."); });
    return () => controller.abort();
  }, [retry]);
  async function save() {
    if (lock.current) return;
    if (!title.trim() || title.trim().length > 150) { setStatus("Tiêu đề cần từ 1 đến 150 ký tự."); return; }
    try { if (url && !/^\/uploads\/[a-f0-9-]{36}\.jpg$/.test(url) && !["https:", "http:"].includes(new URL(url).protocol)) throw new Error(); }
    catch { setStatus("Vui lòng nhập URL ảnh http/https hợp lệ."); return; }
    lock.current = true; setBusy(true);
    try { await saveSiteBanner({ imageUrl: url.trim(), title: title.trim() }); setStatus("Đã lưu ảnh bìa cho toàn bộ ứng dụng."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Không lưu được ảnh."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <View style={s.wrapper}>
    {editable && <><Text style={s.heading}>Ảnh bìa dưới danh sách phim</Text><Text style={s.hint}>Chọn ảnh từ máy hoặc dán URL ảnh công khai. Nên dùng ảnh ngang 16:7; để trống để dùng bìa mặc định.</Text><ImageUpload value={url} disabled={!ready || busy} onBusy={setUploading} onChange={value => { setUrl(value); setFailed(false); }} /><Text style={s.label}>URL ảnh bìa</Text><TextInput accessibilityLabel="URL ảnh bìa" editable={ready && !busy && !uploading} value={url} onChangeText={value => { setUrl(value); setFailed(false); }} autoCapitalize="none" style={s.input} /><Text style={s.label}>Tiêu đề / mô tả ảnh</Text><TextInput accessibilityLabel="Tiêu đề ảnh bìa" editable={ready && !busy && !uploading} value={title} onChangeText={setTitle} maxLength={150} style={s.input} /></>}
    <View style={s.banner}>
      {url && !failed ? <Image source={{ uri: imageUri(url) }} accessibilityLabel={title} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} /> : <Svg width="100%" height="100%" viewBox="0 0 960 420" preserveAspectRatio="xMidYMid slice"><Defs><LinearGradient id="banner" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#772E52" /><Stop offset="1" stopColor="#172447" /></LinearGradient></Defs><Rect width="960" height="420" fill="url(#banner)" /><Circle cx="760" cy="120" r="240" fill="#DB7E92" opacity="0.15" /><Path d="M590 0 L360 420 H880 Z" fill="#FFF4D5" opacity="0.09" /><Rect x="590" y="85" width="240" height="170" rx="16" fill="#E4BCA6" transform="rotate(12 710 170)" /><Circle cx="710" cy="170" r="50" fill="#69324B" /><Circle cx="710" cy="170" r="13" fill="#E4BCA6" />{[0, 1, 2, 3, 4].map(n => <Rect key={n} x={600 + n * 44} y="290" width="30" height="70" rx="10" fill="#B94464" />)}</Svg>}
      {!url && <View style={s.copy}><Text style={s.kicker}>CINEBOOK / MOVIE NIGHT</Text><Text style={s.bannerTitle}>{title}</Text></View>}
    </View>
    {editable && <>{failed && <Text style={s.hint}>Không tải được ảnh từ URL này. Hãy kiểm tra liên kết.</Text>}<Text accessibilityLiveRegion="polite" style={s.hint}>{status}</Text>{!ready ? <Pressable style={s.button} onPress={() => setRetry(value => value + 1)}><Text style={s.label}>Tải lại cấu hình</Text></Pressable> : <Pressable accessibilityRole="button" disabled={busy || uploading || failed} style={[s.button, (busy || uploading || failed) && { opacity: 0.4 }]} onPress={() => void save()}><Text style={s.label}>{busy ? "Đang lưu..." : "Lưu ảnh bìa"}</Text></Pressable>}</>}
  </View>;
}
const s = StyleSheet.create({ wrapper: { padding: 20, gap: 12 }, banner: { width: "100%", aspectRatio: 16 / 7, maxHeight: 380, borderRadius: 20, overflow: "hidden", backgroundColor: "#312139" }, copy: { position: "absolute", left: "6%", top: "18%", width: "52%", gap: 12 }, kicker: { color: "#F6CFDC", fontSize: 10, letterSpacing: 2, fontWeight: "700" }, bannerTitle: { color: "white", fontSize: 23, fontWeight: "900" }, heading: { fontSize: 22, color: "white", fontWeight: "800" }, hint: { color: "#BBC3D8", lineHeight: 22 }, label: { color: "white", fontWeight: "600" }, input: { color: "white", backgroundColor: "#111522", borderWidth: 1, borderColor: "#586079", padding: 12, borderRadius: 10, minHeight: 48 }, button: { alignSelf: "flex-start", padding: 15, borderRadius: 12, backgroundColor: "#AC2949" } });
