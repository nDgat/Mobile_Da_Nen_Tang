import { imageUri } from "../services/api";
import { Link, type Href, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, AppState, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Movie } from "../types/api";

export function MovieCarousel({ movies, backgroundUrl = "" }: { movies: Movie[]; backgroundUrl?: string }) {
  const [width, setWidth] = useState(0);
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={s.container}>
    {!!backgroundUrl && <View pointerEvents="none" style={StyleSheet.absoluteFill}><Image source={{ uri: imageUri(backgroundUrl) }} resizeMode="cover" style={StyleSheet.absoluteFill} /><View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)" }]} /></View>}
    {movies.length === 0 ? <Text style={s.empty}>Không tìm thấy phim phù hợp.</Text> : width > 0 && <Track key={`${Math.round(width)}:${movies.map(movie => movie.id).join(",")}`} width={width} movies={movies} />}
  </View>;
}

function Track({ movies, width }: { movies: Movie[]; width: number }) {
  const cardWidth = Math.min(320, width * 0.69);
  // Overlap layout slots so the neighboring poster corners stay inside the viewport.
  const step = cardWidth * 0.88;
  const inset = (width - step) / 2;
  const looping = movies.length > 1;
  const origin = looping ? movies.length * 2 : 0;
  const items = looping ? Array.from({ length: 5 }, () => movies).flat() : movies;
  const scroll = useRef<ScrollView>(null);
  const initialOffset = useRef({ x: origin * step, y: 0 }).current;
  const initialized = useRef(false);
  const dragging = useRef(false);
  const x = useRef(new Animated.Value(origin * step)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(origin);
  const [reduced, setReduced] = useState(false);
  const selected = movies[active % movies.length];
  const lastMotion = useRef(Date.now());
  const activeIndex = useRef(active);
  activeIndex.current = active;
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => { lastMotion.current = Date.now(); setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => {
    if (!focused || !looping || reduced) return;
    const interval = setInterval(() => {
      if (AppState.currentState !== "active" || (Platform.OS === "web" && typeof document !== "undefined" && document.hidden)) { lastMotion.current = Date.now(); return; }
      if (!initialized.current || dragging.current || Date.now() - lastMotion.current < 5000) return;
      lastMotion.current = Date.now();
      scroll.current?.scrollTo({ x: (activeIndex.current + 1) * step, animated: true });
    }, 250);
    return () => clearInterval(interval);
  }, [focused, looping, reduced, step]);
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value); });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => { mounted = false; subscription.remove(); if (timer.current) clearTimeout(timer.current); };
  }, []);
  const indexFor = (offset: number) => Math.max(0, Math.min(items.length - 1, Math.round(offset / step)));
  function settle(offset: number) {
    if (dragging.current) return;
    if (timer.current) clearTimeout(timer.current);
    const index = indexFor(offset);
    if (Math.abs(offset - index * step) > 1) {
      scroll.current?.scrollTo({ x: index * step, animated: !reduced });
      return;
    }
    const centered = origin + index % movies.length;
    if (looping && index !== centered) {
      // Equivalent copies have identical neighbors: reposition without an animation.
      x.setValue(centered * step);
      scroll.current?.scrollTo({ x: centered * step, animated: false });
      setActive(centered);
    }
  }
  function scheduleSettle(offset: number) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => settle(offset), 180);
  }
  return <>
    <Animated.ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} bounces={false} decelerationRate="fast" snapToInterval={step} snapToAlignment="start" disableIntervalMomentum
      contentContainerStyle={{ paddingHorizontal: inset, paddingVertical: 22 }} scrollEventThrottle={16} contentOffset={initialOffset}
      onContentSizeChange={() => { if (!initialized.current) { initialized.current = true; scroll.current?.scrollTo({ x: origin * step, animated: false }); } }}
      onScrollBeginDrag={() => { dragging.current = true; lastMotion.current = Date.now(); if (timer.current) clearTimeout(timer.current); }}
      onScrollEndDrag={event => { dragging.current = false; lastMotion.current = Date.now(); scheduleSettle(event.nativeEvent.contentOffset.x); }}
      onMomentumScrollEnd={event => settle(event.nativeEvent.contentOffset.x)}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: Platform.OS !== "web", listener: (event: { nativeEvent: { contentOffset: { x: number } } }) => {
        lastMotion.current = Date.now();
        const offset = event.nativeEvent.contentOffset.x;
        const index = indexFor(offset);
        setActive(previous => previous === index ? previous : index);
        scheduleSettle(offset);
      } })}>
      {items.map((movie, index) => {
        const inputRange = [(index - 1) * step, index * step, (index + 1) * step];
        return <View key={`${movie.id}:${index}`} style={{ width: step, zIndex: items.length - Math.abs(index - active), overflow: "visible", alignItems: "center", justifyContent: "center" }}>
          <Animated.View style={{ width: cardWidth, opacity: x.interpolate({ inputRange, outputRange: [0.72, 1, 0.72], extrapolate: "clamp" }), transform: [{ perspective: 700 }, { scale: reduced ? (index === active ? 1 : 0.84) : x.interpolate({ inputRange, outputRange: [0.84, 1, 0.84], extrapolate: "clamp" }) }, { rotateY: reduced ? "0deg" : x.interpolate({ inputRange, outputRange: ["-32deg", "0deg", "32deg"], extrapolate: "clamp" }) }] }}>
            <Link href={`/movies/${movie.id}` as Href} asChild><Pressable accessibilityRole="link" accessibilityLabel={`Xem chi tiết phim ${movie.title}`}><Poster key={movie.posterUrl} movie={movie} selected={index === active} /></Pressable></Link>
          </Animated.View>
        </View>;
      })}
    </Animated.ScrollView>
    {selected && <View style={s.info}>
      <View style={s.movieSummary}>
        <View style={s.movieText}>
          <Text style={s.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{selected.title}</Text>
          <Text style={s.meta} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{Math.floor(selected.durationMinutes / 60)}giờ {selected.durationMinutes % 60}phút  {new Date(selected.releaseDate).getUTCDate()} Thg {new Date(selected.releaseDate).getUTCMonth() + 1}, {new Date(selected.releaseDate).getUTCFullYear()}</Text>
        </View>
        <Link href={`/movies/${selected.id}/cinemas` as Href} asChild><Pressable accessibilityRole="button" accessibilityLabel={`Đặt vé ${selected.title}`} style={s.book}><Text style={s.bookText}>Đặt Vé</Text></Pressable></Link>
      </View>
    </View>}
  </>;
}

function Poster({ movie, selected }: { movie: Movie; selected: boolean }) {
  const [failed, setFailed] = useState(false);
  return movie.posterUrl && !failed ? <Image source={{ uri: imageUri(movie.posterUrl) }} onError={() => setFailed(true)} blurRadius={selected ? 0 : 0.35} style={s.poster} resizeMode="cover" /> : <View style={[s.poster, s.placeholder]}><Text style={s.placeholderText}>CINEBOOK</Text><Text style={s.placeholderIcon}>🎬</Text></View>;
}
const s = StyleSheet.create({
  container: { width: "100%", overflow: "hidden", backgroundColor: "#141722", borderRadius: 24 }, poster: { width: "100%", aspectRatio: 2 / 3, borderRadius: 18, backgroundColor: "#382335" }, placeholder: { alignItems: "center", justifyContent: "center", gap: 20 }, placeholderText: { color: "#FFB2C1", letterSpacing: 4, fontWeight: "800" }, placeholderIcon: { fontSize: 60 },
  info: { paddingHorizontal: 12, paddingTop: 2, paddingBottom: 14 },
  movieSummary: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  movieText: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: "white", fontSize: 15, lineHeight: 20, fontWeight: "800", textTransform: "uppercase", textAlign: "left" },
  meta: { color: "#F1F1F1", fontSize: 13, lineHeight: 18, fontStyle: "italic", fontWeight: "400" },
  book: { backgroundColor: "#E50920", borderWidth: 1, borderColor: "#FFFFFF", paddingHorizontal: 18, paddingVertical: 8, minHeight: 36, flexShrink: 0, borderRadius: 24, justifyContent: "center" },
  bookText: { color: "white", fontWeight: "800", fontSize: 14 },
  empty: { color: "#BCC2D3", padding: 40, textAlign: "center" },
});