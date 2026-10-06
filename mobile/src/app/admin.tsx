import { ImageUpload } from "../components/ImageUpload";
import { SiteBanner } from "../components/SiteBanner";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError, authenticatedJson, getCurrentUser } from "../services/api";
import type { AuthSession, PaginatedResponse } from "../types/api";
import { display, formBody, labels, sections, valueAt, type Row, type Section } from "../components/admin/config";
import { createDefaultRoomLayout, RoomLayoutEditor, type RoomLayoutSeat } from "../components/admin/RoomLayoutEditor";
import { SeatRoomManager } from "../components/admin/SeatRoomManager";

type References = Record<"movies" | "cinemas" | "rooms", Row[]>;
type Dashboard = { users: number; activeMovies: number; activeCinemas: number; bookings: number; todayBookings: number; revenue: string; recentBookings: Row[] };
type Action = { title: string; path: string; body: Record<string, unknown> };
const message = (error: unknown) => error instanceof Error ? error.message : "Không thể thực hiện thao tác.";
const PAGE_SIZE = 12;

function Button({ title, onPress, disabled, primary = false }: { title: string; onPress: () => void; disabled?: boolean; primary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [s.button, primary && s.primary, (disabled || pressed) && { opacity: 0.5 }]}><Text style={s.buttonText}>{title}</Text></Pressable>;
}

export default function AdminScreen() {
  const wide = useWindowDimensions().width >= 960;
  const [user, setUser] = useState<AuthSession["user"] | null>(null);
  const [accessError, setAccessError] = useState("");
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterKey, setFilterKey] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [refs, setRefs] = useState<References>({ movies: [], cinemas: [], rooms: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<{ section: Section; row?: Row } | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [roomLayout, setRoomLayout] = useState<RoomLayoutSeat[]>(createDefaultRoomLayout);
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mutationLock = useRef(false);
  const section = sections.find(item => item.key === tab);

  useFocusEffect(useCallback(() => { setVersion(value => value + 1); }, []));
  useEffect(() => {
    if (version === 0) return;
    let active = true;
    setChecking(true); setUser(null); setAccessError("");
    void getCurrentUser().then(current => {
      if (!active) return;
      if (current.role !== "ADMIN") setAccessError("Tài khoản này không có quyền quản trị.");
      else setUser(current);
    }).catch(err => { if (active) setAccessError(message(err)); }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [version]);

  useEffect(() => {
    if (!user || tab === "banner") return;
    const controller = new AbortController();
    const init = { signal: controller.signal };
    setLoading(true); setError(""); setRows([]); setDashboard(null);
    async function all(path: string) {
      const result: Row[] = [];
      let next = 1;
      do {
        const response = await authenticatedJson<PaginatedResponse<Row>>(`/${path}?page=${next}&limit=100`, init);
        result.push(...response.data);
        if (next >= response.meta.totalPages) return result;
        next++;
      } while (!controller.signal.aborted);
      return result;
    }
    void (async () => {
      // Keep requests sequential: token refresh rotates the refresh token.
      const movies = await all("movies");
      const cinemas = await all("cinemas");
      const rooms = await all("rooms");
      if (controller.signal.aborted) return;
      setRefs({ movies, cinemas, rooms });
      if (!section) {
        const response = await authenticatedJson<{ data: Dashboard }>("/admin/dashboard", init);
        if (!controller.signal.aborted) setDashboard(response.data);
      } else {
        const response = await all(section.path.replace(/^\//, ""));
        if (!controller.signal.aborted) setRows(response);
      }
    })().catch(err => {
      if (controller.signal.aborted) return;
      if (err instanceof ApiError && [401, 403].includes(err.status)) { setUser(null); setAccessError(message(err)); }
      else setError(message(err));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user, section, tab, version]);

  useEffect(() => {
    setSearch(""); setSortKey("id"); setSortDirection("desc"); setFilterKey(""); setFilterValue(""); setPage(1);
  }, [tab]);

  const refLabel = useCallback((source: keyof References, row: Row) => {
    const name = String(row.title ?? row.name ?? row.id);
    if (source !== "rooms") return `${name} (#${row.id})`;
    const cinema = refs.cinemas.find(item => item.id === row.cinemaId);
    return `${cinema?.name ?? `Rạp #${row.cinemaId}`} / ${name} (#${row.id})`;
  }, [refs.cinemas]);
  const cell = useCallback((row: Row, key: string) => {
    const source = ({ movieId: "movies", cinemaId: "cinemas", roomId: "rooms" } as const)[key as "movieId" | "cinemaId" | "roomId"];
    if (source) { const reference = refs[source].find(item => item.id === row[key]); return reference ? refLabel(source, reference) : `#${row[key]}`; }
    return display(valueAt(row, key), key);
  }, [refLabel, refs]);
  const filterOptions = useMemo(() => {
    if (!filterKey) return [];
    const values = rows.flatMap(row => {
      const value = valueAt(row, filterKey);
      return Array.isArray(value) ? value : [value];
    }).filter(value => value !== undefined && value !== null);
    return [...new Map(values.map(value => [String(value), value])).values()].sort((a, b) => display(a, filterKey).localeCompare(display(b, filterKey), "vi", { numeric: true }));
  }, [filterKey, rows]);
  const filteredRows = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("vi");
    const filtered = rows.filter(row => {
      const matchesSearch = !term || [row.id, ...(section?.columns.map(([key]) => cell(row, key)) ?? [])].some(value => String(value).toLocaleLowerCase("vi").includes(term));
      const rawFilter = filterKey ? valueAt(row, filterKey) : undefined;
      const matchesFilter = !filterKey || !filterValue || (Array.isArray(rawFilter) ? rawFilter.some(value => String(value) === filterValue) : String(rawFilter) === filterValue);
      return matchesSearch && matchesFilter;
    });
    return filtered.sort((left, right) => {
      const leftValue = sortKey === "id" ? left.id : valueAt(left, sortKey);
      const rightValue = sortKey === "id" ? right.id : valueAt(right, sortKey);
      const dateSort = ["startsAt", "endsAt", "createdAt", "releaseDate"].includes(sortKey);
      const leftNumber = typeof leftValue === "number" || /^\d+(\.\d+)?$/.test(String(leftValue ?? "")) ? Number(leftValue) : NaN;
      const rightNumber = typeof rightValue === "number" || /^\d+(\.\d+)?$/.test(String(rightValue ?? "")) ? Number(rightValue) : NaN;
      const result = dateSort
        ? new Date(String(leftValue)).getTime() - new Date(String(rightValue)).getTime()
        : Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
        ? leftNumber - rightNumber
        : cell(left, sortKey).localeCompare(cell(right, sortKey), "vi", { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? result : -result;
    });
  }, [cell, filterKey, filterValue, rows, search, section, sortDirection, sortKey]);
  const pages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { setPage(current => Math.min(current, pages)); }, [pages]);

  function filterOptionLabel(value: unknown) {
    const source = ({ movieId: "movies", cinemaId: "cinemas", roomId: "rooms" } as const)[filterKey as "movieId" | "cinemaId" | "roomId"];
    if (!source) return display(value, filterKey);
    const reference = refs[source].find(item => String(item.id) === String(value));
    return reference ? refLabel(source, reference) : `#${value}`;
  }
  function selectedRoomLabel(roomId: string) {
    const room = refs.rooms.find(item => String(item.id) === roomId);
    return room ? refLabel("rooms", room) : `Phòng #${roomId}`;
  }
  function edit(config: Section, row?: Row, defaults: Record<string, string> = {}) {
    if (config.key === "rooms" && !row) setRoomLayout(createDefaultRoomLayout());
    setValues(Object.fromEntries((config.fields ?? []).map(field => {
      if (row) return [field.key, String(row[field.key] ?? "").slice(0, field.kind === "date" ? 10 : undefined)];
      const firstReference = field.source ? refs[field.source].find(item => item.isActive !== false) : undefined;
      return [field.key, defaults[field.key] ?? field.options?.[0] ?? (firstReference ? String(firstReference.id) : "")];
    })));
    setFormError(""); setEditor({ section: config, row });
  }
  async function mutate(path: string, body: Record<string, unknown>, method: string) {
    if (mutationLock.current) return;
    mutationLock.current = true; setBusy(true); setFormError("");
    try {
      await authenticatedJson(path, { method, body: JSON.stringify(body) });
      setEditor(null); setPending(null); setNotice("Đã lưu thay đổi thành công."); setVersion(value => value + 1);
    } catch (err) {
      setFormError(message(err));
      if (err instanceof ApiError && [401, 403].includes(err.status)) { setEditor(null); setPending(null); setUser(null); setAccessError(message(err)); }
    } finally { mutationLock.current = false; setBusy(false); }
  }
  function save() {
    if (!editor || uploading) return;
    try {
      const body = formBody(editor.section.fields ?? [], values);
      if (editor.section.key === "rooms" && !editor.row) body.seatLayout = roomLayout;
      if (editor.section.key === "seats" && editor.row) { delete body.roomId; delete body.rowLabel; }
      void mutate(`${editor.section.path}${editor.row ? `/${editor.row.id}` : ""}`, body, editor.row ? "PATCH" : "POST");
    }
    catch (err) { setFormError(message(err)); }
  }
  function confirm(action: Action) { setFormError(""); setPending(action); }
  function actions(row: Row) {
    if (!section) return null;
    if (section.key === "showtimes") return ["SCHEDULED", "CANCELLED", "FINISHED"].filter(status => status !== row.status).map(status => <Button key={status} title={labels[status]} onPress={() => confirm({ title: `Đổi suất #${row.id} sang “${labels[status]}”?`, path: `/showtimes/${row.id}/status`, body: { status } })} />);
    if (section.fields || section.key === "users") return <>
      {section.fields && <Button title="Chỉnh sửa" onPress={() => edit(section, row)} />}
      <Button disabled={row.id === user?.id && section.key === "users"} title={row.isActive ? "Ngừng hoạt động" : "Kích hoạt"} onPress={() => confirm({ title: `${row.isActive ? "Ngừng hoạt động" : "Kích hoạt"} ${row.title ?? row.name ?? row.fullName ?? `#${row.id}`}?`, path: `${section.path}/${row.id}${section.key === "users" ? "/status" : ""}`, body: { isActive: !row.isActive } })} />
    </>;
    if (section.key === "reviews") return <Button title={row.isVisible ? "Ẩn đánh giá" : "Hiện đánh giá"} onPress={() => confirm({ title: `${row.isVisible ? "Ẩn" : "Hiện"} đánh giá #${row.id}?`, path: `${section.path}/${row.id}/visibility`, body: { isVisible: !row.isVisible } })} />;
    return null;
  }

  if (checking || !user) return <SafeAreaView style={s.safe}><View style={s.gate}><Text style={s.title}>CineBook Admin</Text>{checking ? <ActivityIndicator color="#FF526F" /> : <><Text style={s.error}>{accessError}</Text><Link href="/login" style={s.link}>Đăng nhập tài khoản quản trị</Link><Button title="Kiểm tra lại" onPress={() => setVersion(v => v + 1)} /></>}<Link href="/" style={s.link}>← Về ứng dụng</Link></View></SafeAreaView>;
  return <SafeAreaView style={s.safe}>
    <View style={[s.shell, wide && s.horizontal]}>
      <View style={[s.navigation, wide && s.sidebar]}>
        <Text style={s.brand}>CineBook<Text style={s.accent}> / Admin</Text></Text>
        <Text style={s.muted}>{user.fullName}</Text>
        <ScrollView horizontal={!wide} style={wide ? { flex: 1 } : { flexGrow: 0 }} contentContainerStyle={wide ? s.navVertical : s.navHorizontal}>
          {[{ key: "dashboard", label: "Tổng quan" }, ...sections, { key: "banner", label: "Ảnh bìa" }].map(item => <Pressable accessibilityRole="button" accessibilityState={{ selected: item.key === tab }} key={item.key} onPress={() => { setTab(item.key); setPage(1); setNotice(""); }} style={[s.navItem, tab === item.key && s.selected]}><Text style={s.buttonText}>{item.label}</Text></Pressable>)}
        </ScrollView>
        <Link href="/" style={s.link}>← Về ứng dụng</Link>
      </View>
      <ScrollView style={s.main} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.eyebrow}>KHÔNG GIAN QUẢN TRỊ</Text>
        <View style={s.toolbar}><View><Text style={s.title}>{tab === "banner" ? "Ảnh bìa" : section?.label ?? "Tổng quan kinh doanh"}</Text><Text style={s.muted}>{section ? "Quản lý dữ liệu CineBook" : "Theo dõi hoạt động hệ thống và các đơn đặt vé mới."}</Text></View><View style={s.actions}><Button title="Làm mới" disabled={loading} onPress={() => setVersion(v => v + 1)} />{section?.fields && section.key !== "seats" && <Button primary title={section.key === "rooms" ? "+ Thêm phòng" : "+ Thêm mới"} disabled={loading || !!error} onPress={() => edit(section)} />}</View></View>
        {!!notice && <Text accessibilityRole="alert" style={s.success}>{notice}</Text>}
        {tab === "banner" ? <SiteBanner editable /> : loading ? <ActivityIndicator color="#FF526F" size="large" style={{ margin: 40 }} /> : error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : dashboard ? <>
          <View style={s.cards}>{([["Người dùng", dashboard.users], ["Phim hoạt động", dashboard.activeMovies], ["Rạp hoạt động", dashboard.activeCinemas], ["Tổng đặt vé", dashboard.bookings], ["Đặt vé hôm nay", dashboard.todayBookings], ["Doanh thu", display(dashboard.revenue, "revenue")]] as const).map(([label, value]) => <View key={label} style={s.stat}><Text style={s.muted}>{label}</Text><Text style={s.statValue}>{value}</Text></View>)}</View>
          <Text style={s.subtitle}>Đặt vé gần đây</Text>
          {!dashboard.recentBookings.length && <Text style={s.muted}>Chưa có đơn đặt vé.</Text>}
          {dashboard.recentBookings.map(row => <View key={row.id} style={s.card}><Text style={s.cardTitle}>{String(row.code)} · {display(valueAt(row, "movie.title"))}</Text><Text style={s.muted}>{display(valueAt(row, "user.fullName"))} · {display(row.totalAmount, "totalAmount")} · {display(row.status)}</Text></View>)}
        </> : section && <>
          <View style={s.dataTools}>
            <TextInput accessibilityLabel={`Tìm kiếm ${section.label.toLowerCase()}`} value={search} onChangeText={value => { setSearch(value); setPage(1); }} placeholder={`Tìm trong ${section.label.toLowerCase()}...`} placeholderTextColor="#8790A7" autoCapitalize="none" style={s.searchInput} />
            <View style={s.toolGroup}><Text style={s.toolLabel}>Sắp xếp theo</Text><View style={s.options}>{[["id", "ID"], ...section.columns].map(([key, label]) => <Pressable key={key} onPress={() => { if (sortKey === key) setSortDirection(value => value === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDirection("asc"); } setPage(1); }} style={[s.filterChip, sortKey === key && s.selected]}><Text style={s.buttonText}>{label}{sortKey === key ? sortDirection === "asc" ? " ↑" : " ↓" : ""}</Text></Pressable>)}</View></View>
            {!!section.filters?.length && <View style={s.toolGroup}><Text style={s.toolLabel}>Lọc theo</Text><View style={s.options}>{section.filters.map(([key, label]) => <Pressable key={key} onPress={() => { setFilterKey(key); setFilterValue(""); setPage(1); }} style={[s.filterChip, filterKey === key && s.selected]}><Text style={s.buttonText}>{label}</Text></Pressable>)}</View>{!!filterKey && <View style={s.options}><Pressable onPress={() => { setFilterValue(""); setPage(1); }} style={[s.filterChip, !filterValue && s.selected]}><Text style={s.buttonText}>Tất cả</Text></Pressable>{filterOptions.map(value => <Pressable key={String(value)} onPress={() => { setFilterValue(String(value)); setPage(1); }} style={[s.filterChip, filterValue === String(value) && s.selected]}><Text style={s.buttonText}>{filterOptionLabel(value)}</Text></Pressable>)}</View>}</View>}
            {(search || filterKey || sortKey !== "id" || sortDirection !== "desc") && <View style={s.actions}><Button title="Đặt lại tìm kiếm và bộ lọc" onPress={() => { setSearch(""); setFilterKey(""); setFilterValue(""); setSortKey("id"); setSortDirection("desc"); setPage(1); }} /></View>}
          </View>
          {section.key === "seats" ? <>
            <Text style={s.muted}>Hiển thị {filteredRows.length}/{rows.length} ghế · Chọn một phòng để xem sơ đồ</Text>
            <SeatRoomManager
              rooms={refs.rooms}
              seats={filteredRows}
              roomLabel={room => refLabel("rooms", room)}
              onAdd={(roomId, rowLabel, seatNumber, type) => edit(section, undefined, { roomId: String(roomId), rowLabel, seatNumber: String(seatNumber), type })}
              onEdit={seat => edit(section, seat)}
              onToggleAisle={seat => confirm({ title: (seat.isActive ? "Đổi ghế " : "Khôi phục ghế ") + seat.rowLabel + seat.seatNumber + (seat.isActive ? " thành lối đi?" : "?"), path: section.path + "/" + seat.id, body: { isActive: !seat.isActive } })}
            />
          </> : <>
            <Text style={s.muted}>Hiển thị {filteredRows.length}/{rows.length} bản ghi · Trang {page}/{pages}</Text>
            {!visibleRows.length && <View style={s.card}><Text style={s.cardTitle}>{rows.length ? "Không tìm thấy dữ liệu phù hợp" : "Chưa có dữ liệu"}</Text><Text style={s.muted}>{rows.length ? "Hãy đổi từ khóa hoặc bộ lọc để xem kết quả khác." : "Dữ liệu sẽ xuất hiện tại đây sau khi được tạo."}</Text></View>}
            {visibleRows.map(row => <View key={row.id} style={s.card}><View style={s.toolbar}><Text style={s.cardTitle}>#{row.id} {String(row.title ?? row.name ?? row.code ?? row.fullName ?? "")}</Text><View style={s.actions}>{actions(row)}</View></View><View style={s.details}>{section.columns.map(([key, label]) => <View key={key} style={[s.detail, wide && { minWidth: 190 }]}><Text style={s.muted}>{label}</Text><Text selectable style={s.value}>{cell(row, key)}</Text></View>)}</View></View>)}
            <View style={s.actions}><Button title="← Trang trước" disabled={page <= 1} onPress={() => setPage(p => p - 1)} /><Button title="Trang sau →" disabled={page >= pages} onPress={() => setPage(p => p + 1)} /></View>
          </>}
        </>}
      </ScrollView>
    </View>
    <Modal visible={!!editor || !!pending} transparent animationType="fade" onRequestClose={() => { if (!busy && !uploading) { setEditor(null); setPending(null); } }}>
      <View style={s.overlay}><View style={s.dialog}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.dialogContent}>
        <Text style={s.subtitle}>{editor ? `${editor.row ? "Chỉnh sửa" : "Thêm"} ${editor.section.label.toLowerCase()}` : "Xác nhận thay đổi"}</Text>
        {editor ? <>{editor.section.key === "seats" && <View style={s.field}><Text style={s.value}>Phòng cố định</Text><Text style={s.lockedValue}>{selectedRoomLabel(values.roomId)}</Text><Text style={s.value}>Hàng cố định</Text><Text style={s.lockedValue}>{values.rowLabel}</Text></View>}{editor.section.fields?.filter(field => !(editor.section.key === "seats" && (field.key === "roomId" || field.key === "rowLabel"))).map(field => <View key={field.key} style={s.field}><Text style={s.value}>{field.label}{!field.optional && " *"}</Text>{field.source || field.options ? <View style={s.options}>
          {(field.source ? refs[field.source].filter(row => row.isActive !== false || String(row.id) === values[field.key]).map(row => ({ value: String(row.id), label: refLabel(field.source!, row) })) : field.options!.map(value => ({ value, label: labels[value] ?? value }))).map(option => <Pressable key={option.value} accessibilityRole={field.multiple ? "checkbox" : "radio"} accessibilityState={{ checked: field.multiple ? (values[field.key] ?? "").split(",").includes(option.value) : values[field.key] === option.value, disabled: busy }} disabled={busy || uploading} onPress={() => setValues(old => { const selected = (old[field.key] ?? "").split(",").filter(Boolean); return { ...old, [field.key]: field.multiple ? (selected.includes(option.value) ? selected.filter(value => value !== option.value) : [...selected, option.value]).join(",") : option.value }; })} style={[s.button, (field.multiple ? (values[field.key] ?? "").split(",").includes(option.value) : values[field.key] === option.value) && s.selected]}><Text style={s.buttonText}>{option.label}</Text></Pressable>)}
          {field.source && !refs[field.source].some(row => row.isActive !== false) && <Text style={s.muted}>Chưa có dữ liệu hoạt động để chọn.</Text>}
        </View> : <TextInput accessibilityLabel={field.label} editable={!busy && !uploading} value={values[field.key] ?? ""} onChangeText={value => setValues(old => ({ ...old, [field.key]: value }))} keyboardType={field.kind === "number" ? "numeric" : "default"} autoCapitalize="none" multiline={field.key === "synopsis"} style={s.input} placeholderTextColor="#8790A7" />}{(field.key === "posterUrl" || field.key === "imageUrl") && <ImageUpload value={values[field.key] ?? ""} disabled={busy || uploading} onBusy={setUploading} onChange={url => setValues(old => ({ ...old, [field.key]: url }))} />}</View>)}{editor.section.key === "rooms" && !editor.row && <RoomLayoutEditor onChange={setRoomLayout} />}</> : <Text style={s.value}>{pending?.title}</Text>}
        {!!formError && <Text accessibilityRole="alert" style={s.error}>{formError}</Text>}
        <View style={s.actions}><Button title="Hủy" disabled={busy || uploading} onPress={() => { setEditor(null); setPending(null); }} /><Button primary title={busy ? "Đang lưu..." : "Lưu thay đổi"} disabled={busy || uploading} onPress={() => { if (editor) save(); else if (pending) void mutate(pending.path, pending.body, "PATCH"); }} /></View>
      </ScrollView></View></View>
    </Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0D0F17" }, shell: { flex: 1 }, horizontal: { flexDirection: "row" },
  navigation: { padding: 20, gap: 12, backgroundColor: "#151824", borderColor: "#292E40", borderBottomWidth: 1 }, sidebar: { width: 238, borderRightWidth: 1 }, brand: { color: "white", fontWeight: "800", fontSize: 21 }, accent: { color: "#FF7690", fontSize: 15 },
  navVertical: { gap: 6, paddingVertical: 16 }, navHorizontal: { gap: 8 }, navItem: { paddingHorizontal: 16, paddingVertical: 13, borderRadius: 10 }, selected: { backgroundColor: "#682E43", borderColor: "#FF7690", borderWidth: 1 },
  main: { flex: 1 }, content: { padding: 24, gap: 20, width: "100%", maxWidth: 1400, alignSelf: "center", paddingBottom: 50 }, eyebrow: { color: "#FF7690", fontSize: 11, letterSpacing: 2, fontWeight: "700" }, title: { color: "#FFF", fontSize: 28, fontWeight: "800", marginBottom: 6 }, subtitle: { color: "#FFF", fontSize: 21, fontWeight: "700" },
  toolbar: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, button: { minHeight: 44, justifyContent: "center", paddingHorizontal: 15, paddingVertical: 10, backgroundColor: "#272C40", borderRadius: 9 }, primary: { backgroundColor: "#AD2948" }, buttonText: { color: "#FFF", fontWeight: "600", fontSize: 14 }, link: { color: "#FF8EA3", paddingVertical: 10 },
  muted: { color: "#AAB3CA", fontSize: 13, lineHeight: 20 }, value: { color: "#F2F4FA", fontSize: 14, lineHeight: 22 }, cards: { flexDirection: "row", flexWrap: "wrap", gap: 14 }, stat: { flexGrow: 1, flexBasis: 210, backgroundColor: "#191D2B", padding: 22, borderRadius: 14, gap: 14 }, statValue: { color: "#FFF", fontWeight: "800", fontSize: 27 }, card: { backgroundColor: "#191D2B", padding: 20, borderRadius: 14, gap: 18, borderWidth: 1, borderColor: "#292E40" }, cardTitle: { color: "#FFF", fontSize: 16, fontWeight: "700", flexShrink: 1 }, details: { flexDirection: "row", flexWrap: "wrap", gap: 18 }, detail: { flexGrow: 1, flexBasis: 140, gap: 4 },
  dataTools: { backgroundColor: "#151824", borderWidth: 1, borderColor: "#292E40", borderRadius: 14, padding: 16, gap: 16 }, toolGroup: { gap: 9 }, toolLabel: { color: "#DDE2F1", fontSize: 13, fontWeight: "700" }, filterChip: { minHeight: 38, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#272C40", borderRadius: 9 }, searchInput: { backgroundColor: "#0D0F17", borderWidth: 1, borderColor: "#505A73", color: "#FFF", borderRadius: 10, minHeight: 48, paddingHorizontal: 14 },
  gate: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }, error: { color: "#FF9CB0", lineHeight: 22 }, success: { color: "#9CE6C3", backgroundColor: "#143B30", padding: 12, borderRadius: 8 }, overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center", padding: 16 }, dialog: { width: "100%", maxWidth: 640, maxHeight: "90%", backgroundColor: "#191D2B", borderRadius: 18 }, dialogContent: { padding: 24, gap: 22 }, field: { gap: 10 }, options: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, input: { backgroundColor: "#0D0F17", borderWidth: 1, borderColor: "#505A73", color: "#FFF", borderRadius: 8, minHeight: 48, padding: 12 }, lockedValue: { color: "#DDE2F1", backgroundColor: "#10131D", borderWidth: 1, borderColor: "#343B50", borderRadius: 8, minHeight: 48, padding: 13 },
});
