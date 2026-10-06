import { type Href, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { getHomeContent, imageUri } from "../services/api";
import type { HomeContentDisplay, HomeContentItem, HomeContentSection } from "../types/api";

const sections: { key: HomeContentSection; title: string }[] = [
  { key: "BANNER", title: "Banner nổi bật" },
  { key: "HOT_NEWS", title: "Tin nóng" },
  { key: "VOUCHER", title: "Voucher" },
  { key: "PARTNER_PROMOTION", title: "Khuyến mãi đối tác" },
];

export function HomeContentSections() {
  const [items, setItems] = useState<HomeContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    void getHomeContent(controller.signal).then(setItems).catch(error => {
      if (!(error instanceof Error && error.name === "AbortError")) setFailed(true);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []));

  if (loading) return <ActivityIndicator color="#FF526F" style={s.loading} />;
  if (failed) return <Text style={s.error}>Không tải được nội dung nổi bật.</Text>;
  return <View style={s.wrapper}>{sections.map(section => {
    const sectionItems = items.filter(item => item.section === section.key);
    if (!sectionItems.length) return null;
    return <View key={section.key} style={s.section}>
      <View style={s.heading}><Text style={s.title}>{section.title}</Text><Text style={s.count}>{sectionItems.length} tin</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.track}>
        {sectionItems.map(item => <ContentCard key={item.id} item={item} />)}
      </ScrollView>
    </View>;
  })}</View>;
}

function ContentCard({ item }: { item: HomeContentItem }) {
  const width = useWindowDimensions().width;
  const [imageFailed, setImageFailed] = useState(false);
  const size = cardSize(item.displayStyle, width);
  const open = () => {
    if (!item.linkUrl) return;
    if (/^https?:\/\//i.test(item.linkUrl)) void Linking.openURL(item.linkUrl);
    else router.push(item.linkUrl as Href);
  };
  return <Pressable accessibilityRole={item.linkUrl ? "link" : undefined} accessibilityLabel={item.title} disabled={!item.linkUrl} onPress={open} style={({ pressed }) => [s.card, size, pressed && { opacity: 0.82 }]}>
    {item.imageUrl && !imageFailed ? <Image source={{ uri: imageUri(item.imageUrl) }} resizeMode="cover" onError={() => setImageFailed(true)} style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, placeholderStyle(item.section)]}><Text style={s.placeholderIcon}>{sectionIcon(item.section)}</Text></View>}
    <View style={s.shade} />
    <View style={s.copy}>{item.badge && <Text style={s.badge}>{item.badge}</Text>}<Text numberOfLines={2} style={s.cardTitle}>{item.title}</Text>{item.subtitle && <Text numberOfLines={2} style={s.subtitle}>{item.subtitle}</Text>}</View>
  </Pressable>;
}
function cardSize(display: HomeContentDisplay, viewport: number) {
  if (display === "HERO") return { width: Math.min(Math.max(viewport - 40, 280), 620), aspectRatio: 16 / 7 };
  if (display === "SQUARE") return { width: Math.min(viewport * 0.56, 230), aspectRatio: 1 };
  return { width: Math.min(viewport * 0.72, 300), aspectRatio: 16 / 10 };
}
function placeholderStyle(section: HomeContentSection) {
  const colors: Record<HomeContentSection, string> = { BANNER: "#71324B", HOT_NEWS: "#234B67", VOUCHER: "#8A4D24", PARTNER_PROMOTION: "#3F427C" };
  return { backgroundColor: colors[section] };
}
function sectionIcon(section: HomeContentSection) {
  return ({ BANNER: "★", HOT_NEWS: "⚡", VOUCHER: "%", PARTNER_PROMOTION: "♦" } as const)[section];
}

const s = StyleSheet.create({
  wrapper: { paddingTop: 10, paddingBottom: 12, gap: 28 }, section: { gap: 13 }, heading: { paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, title: { color: "#FFF", fontSize: 22, fontWeight: "900" }, count: { color: "#9DA5B8", fontSize: 12, fontWeight: "700" },
  track: { paddingHorizontal: 20, gap: 14 }, card: { overflow: "hidden", borderRadius: 18, backgroundColor: "#242838", borderWidth: 1, borderColor: "#383E51" }, shade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4,6,12,0.33)" }, copy: { flex: 1, justifyContent: "flex-end", padding: 16 }, badge: { alignSelf: "flex-start", color: "#FFF", backgroundColor: "#D12D4B", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, overflow: "hidden", fontSize: 9, fontWeight: "900", marginBottom: 7 }, cardTitle: { color: "#FFF", fontSize: 17, lineHeight: 21, fontWeight: "900", textShadowColor: "rgba(0,0,0,0.55)", textShadowRadius: 5 }, subtitle: { color: "#E0E4EC", fontSize: 12, lineHeight: 17, marginTop: 5 }, placeholderIcon: { color: "rgba(255,255,255,0.18)", fontSize: 78, fontWeight: "900", position: "absolute", right: 18, top: 10 }, loading: { margin: 32 }, error: { color: "#FF9CB0", paddingHorizontal: 20, paddingVertical: 24 },
});
