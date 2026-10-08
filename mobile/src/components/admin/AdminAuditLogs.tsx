import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { ApiError, authenticatedJson, getCurrentUser } from "../../services/api";
import type { PaginatedResponse } from "../../types/api";

type AuditLog = {
  id: number; action: string; entityType: string; entityId: string; createdAt: string;
  actor: { id: number; fullName: string; email: string; role: string };
  beforeData: Record<string, unknown> | null; afterData: Record<string, unknown> | null;
  requestId: string | null; ipAddress: string | null; userAgent: string | null;
};
type Filters = { search: string; actorId: string; action: string; entityType: string; entityId: string; from: string; to: string };
const empty: Filters = { search: "", actorId: "", action: "", entityType: "", entityId: "", from: "", to: "" };
const actionNames: Record<string, string> = { USER_STATUS_CHANGED: "Khóa / mở tài khoản", REVIEW_VISIBILITY_CHANGED: "Ẩn / hiện đánh giá" };
const entityNames: Record<string, string> = { User: "Người dùng", MovieReview: "Đánh giá phim" };
const fieldNames: Record<string, string> = { isActive: "Hoạt động", isVisible: "Hiển thị", role: "Vai trò" };
const dateText = (date: string) => new Date(date).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
const valueText = (value: unknown) => value === undefined ? "Không có" : value === null ? "Trống" : typeof value === "boolean" ? value ? "Có" : "Không" : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
function Button({ label, onPress, disabled = false, active = false }: { label: string; onPress: () => void; disabled?: boolean; active?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected: active }} disabled={disabled} onPress={onPress} style={[s.button, active && s.active, disabled && { opacity: 0.45 }]}><Text style={s.buttonText}>{label}</Text></Pressable>;
}
export function AdminAuditLogs() {
  const wide = useWindowDimensions().width > 760;
  const [draft, setDraft] = useState<Filters>(empty);
  const [filters, setFilters] = useState<Filters>(empty);
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterError, setFilterError] = useState("");
  const [result, setResult] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(""); setResult(null); setSelected(null);
    void (async () => {
      // Sequential calls avoid competing refresh-token rotations.
      const user = await getCurrentUser();
      if (controller.signal.aborted) return;
      if (user.role !== "ADMIN") { setAuthorized(false); setError("Chỉ quản trị viên được xem nhật ký."); return; }
      setAuthorized(true);
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      Object.entries(filters).forEach(([key, value]) => { if (value.trim()) query.set(key, value.trim()); });
      const response = await authenticatedJson<PaginatedResponse<AuditLog>>("/admin/audit-logs?" + query, { signal: controller.signal });
      if (!controller.signal.aborted) setResult(response);
    })().catch(reason => {
      if (controller.signal.aborted) return;
      if (reason instanceof ApiError && [401, 403].includes(reason.status)) setAuthorized(false);
      setError(reason instanceof Error ? reason.message : "Không tải được nhật ký.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, page, revision]);

  function apply() {
    for (const value of [draft.from, draft.to]) {
      if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) {
        setFilterError("Ngày phải hợp lệ và có dạng YYYY-MM-DD."); return;
      }
    }
    if (draft.from && draft.to && draft.from > draft.to) { setFilterError("Ngày kết thúc phải từ ngày bắt đầu trở đi."); return; }
    if (draft.actorId && (!/^\d+$/.test(draft.actorId) || Number(draft.actorId) < 1)) { setFilterError("ID quản trị viên phải là số nguyên dương."); return; }
    setFilterError(""); setPage(1); setFilters({ ...draft }); setRevision(value => value + 1);
  }
  const fields = [
    ["search", "Tìm kiếm", "Tên, email, thao tác, mã đối tượng hoặc request ID"],
    ["actorId", "ID quản trị viên", "Ví dụ: 1"],
    ["entityId", "Mã đối tượng", "Ví dụ: 12"],
    ["from", "Từ ngày", "YYYY-MM-DD"],
    ["to", "Đến ngày", "YYYY-MM-DD"],
  ] as const;

  if (!authorized) return <View style={s.safe}><View style={s.gate}>
    <Text style={s.title}>Nhật ký quản trị</Text>
    {loading ? <ActivityIndicator color="#FF7690" /> : <><Text accessibilityRole="alert" style={s.error}>{error}</Text><Link href="/login" style={s.link}>Đăng nhập tài khoản quản trị</Link><Button label="Thử lại" onPress={() => setRevision(value => value + 1)} /></>}

  </View></View>;

  return <View style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

    <View style={s.row}><View style={{ flex: 1 }}><Text style={s.eyebrow}>CINEBOOK / ADMIN</Text><Text style={s.title}>Nhật ký quản trị</Text><Text style={s.muted}>Theo dõi ai đã thay đổi dữ liệu, vào lúc nào và nội dung trước / sau.</Text></View><Button label="Làm mới" disabled={loading} onPress={() => setRevision(value => value + 1)} /></View>
    <View style={s.info}><Text style={s.muted}>Hiện ghi nhận khóa / mở tài khoản và ẩn / hiện đánh giá. Nhật ký chỉ được xem, không sửa hoặc xóa. Thời gian hiển thị và bộ lọc ngày theo giờ Việt Nam (UTC+7).</Text></View>
    <View style={s.card}>
      <Text style={s.heading}>Tìm kiếm và bộ lọc</Text>
      <View style={s.fields}>{fields.map(([key, label, placeholder]) => <View key={key} style={[s.field, { flexBasis: key === "search" ? "100%" : wide ? "30%" : "100%" }]}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={draft[key]} onChangeText={value => setDraft(old => ({ ...old, [key]: value }))} placeholder={placeholder} placeholderTextColor="#8E9AB3" style={s.input} autoCapitalize="none" maxLength={key === "search" ? 100 : key === "from" || key === "to" ? 10 : 100} onSubmitEditing={apply} /></View>)}</View>
      <Text style={s.label}>Thao tác</Text>
      <View style={s.row}>{[["", "Tất cả thao tác"], ...Object.entries(actionNames)].map(([value, label]) => <Button key={value} label={label} active={draft.action === value} onPress={() => setDraft(old => ({ ...old, action: value }))} />)}</View>
      <Text style={s.label}>Đối tượng</Text>
      <View style={s.row}>{[["", "Tất cả đối tượng"], ...Object.entries(entityNames)].map(([value, label]) => <Button key={value} label={label} active={draft.entityType === value} onPress={() => setDraft(old => ({ ...old, entityType: value }))} />)}</View>
      {!!filterError && <Text accessibilityRole="alert" style={s.error}>{filterError}</Text>}
      <View style={s.row}><Button label="Áp dụng bộ lọc" active onPress={apply} disabled={loading} /><Button label="Xóa bộ lọc" disabled={loading} onPress={() => { setDraft(empty); setFilters(empty); setPage(1); setFilterError(""); setRevision(value => value + 1); }} /></View>
    </View>
    {loading ? <ActivityIndicator color="#FF7690" size="large" /> : error ? <View style={s.card}><Text accessibilityRole="alert" style={s.error}>{error}</Text><Button label="Thử tải lại" onPress={() => setRevision(value => value + 1)} /></View> : result && <>
      <View style={s.row}><Text style={s.heading}>{result.meta.total} bản ghi</Text><Text style={s.muted}>Mới nhất trước · Trang {page}/{Math.max(1, result.meta.totalPages)}</Text></View>
      {!result.data.length && <View style={s.card}><Text style={s.heading}>Không có nhật ký phù hợp</Text><Text style={s.muted}>Thử thay đổi bộ lọc hoặc quay lại sau khi có thao tác quản trị được ghi nhận.</Text></View>}
      {result.data.map(log => <View key={log.id} style={s.card}>
        <View style={s.row}><Text style={[s.heading, { flex: 1 }]}>{actionNames[log.action] ?? log.action}</Text><Text style={s.muted}>#{log.id} · {dateText(log.createdAt)}</Text></View>
        <Text style={s.label}>{log.actor.fullName} · #{log.actor.id}</Text><Text selectable style={s.muted}>{log.actor.email}</Text>
        <Text style={s.muted}>{entityNames[log.entityType] ?? log.entityType} · Mã đối tượng: {log.entityId}</Text>
        <View style={s.row}><Button label={"Xem chi tiết #" + log.id} onPress={() => setSelected(log)} /><Button label={"Lọc theo quản trị viên #" + log.actor.id} onPress={() => { const next = { ...filters, actorId: String(log.actor.id) }; setDraft(next); setFilters(next); setPage(1); setFilterError(""); }} /></View>
      </View>)}
      <View style={s.row}><Button label="← Trang trước" disabled={page <= 1} onPress={() => setPage(value => value - 1)} /><Button label="Trang sau →" disabled={page >= result.meta.totalPages} onPress={() => setPage(value => value + 1)} /></View>
    </>}
  </ScrollView>
  <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
    <View style={s.overlay}><View style={s.dialog}><ScrollView contentContainerStyle={s.dialogContent}>
      {selected && <>
        <Text style={s.heading}>Chi tiết nhật ký #{selected.id}</Text>
        <Text style={s.label}>{actionNames[selected.action] ?? selected.action}</Text>
        <Text selectable style={s.muted}>{selected.actor.fullName} · {selected.actor.email} · #{selected.actor.id}</Text>
        <Text style={s.muted}>{dateText(selected.createdAt)} · {entityNames[selected.entityType] ?? selected.entityType} #{selected.entityId}</Text>
        <Text style={s.heading}>Dữ liệu trước / sau</Text>
        {Array.from(new Set([...Object.keys(selected.beforeData ?? {}), ...Object.keys(selected.afterData ?? {})])).map(key => {
          const before = selected.beforeData?.[key], after = selected.afterData?.[key];
          const changed = JSON.stringify(before) !== JSON.stringify(after);
          return <View key={key} style={[s.change, changed && { borderColor: "#AD5A72" }]}>
            <Text style={s.label}>{fieldNames[key] ?? key}{changed ? " · Đã thay đổi" : " · Không đổi"}</Text>
            <View style={[s.fields, !wide && { flexDirection: "column" }]}><View style={s.diffValue}><Text style={s.muted}>Trước</Text><Text selectable style={s.before}>{valueText(before)}</Text></View><View style={s.diffValue}><Text style={s.muted}>Sau</Text><Text selectable style={s.after}>{valueText(after)}</Text></View></View>
          </View>;
        })}
        {!selected.beforeData && !selected.afterData && <Text style={s.muted}>Bản ghi không có dữ liệu trước / sau.</Text>}
        <Text style={s.heading}>Thông tin truy vết</Text>
        <Text selectable style={s.muted}>Request ID: {selected.requestId ?? "Không ghi nhận"}</Text>
        <Text selectable style={s.muted}>IP: {selected.ipAddress ?? "Không ghi nhận"}</Text>
        <Text selectable style={s.muted}>Trình duyệt / thiết bị: {selected.userAgent ?? "Không ghi nhận"}</Text>
      </>}
      <Button label="Đóng chi tiết" onPress={() => setSelected(null)} />
    </ScrollView></View></View>
  </Modal></View>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0D0F17" }, content: { padding: 24, gap: 20, width: "100%", maxWidth: 1200, alignSelf: "center", paddingBottom: 48 },
  gate: { flex: 1, justifyContent: "center", alignItems: "center", gap: 20, padding: 24 },
  title: { color: "#FFF", fontSize: 28, fontWeight: "800", marginVertical: 8 }, eyebrow: { color: "#FF7690", fontSize: 12, fontWeight: "700", letterSpacing: 2 },
  heading: { color: "#F2F4FA", fontSize: 18, fontWeight: "700" }, label: { color: "#E3E8F4", fontSize: 14, fontWeight: "600" }, muted: { color: "#AAB3CA", fontSize: 14, lineHeight: 22 },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 }, fields: { flexDirection: "row", flexWrap: "wrap", gap: 14 }, field: { flexGrow: 1, gap: 8 },
  button: { minHeight: 44, justifyContent: "center", backgroundColor: "#272C40", borderRadius: 9, paddingVertical: 10, paddingHorizontal: 15 }, active: { backgroundColor: "#AD2948" }, buttonText: { color: "#FFF", fontWeight: "600" },
  input: { backgroundColor: "#0D0F17", borderWidth: 1, borderColor: "#505A73", borderRadius: 8, color: "#FFF", padding: 12, minHeight: 46 },
  card: { backgroundColor: "#191D2B", borderColor: "#30374B", borderWidth: 1, padding: 20, borderRadius: 14, gap: 14 }, info: { padding: 16, borderRadius: 12, backgroundColor: "#172438" },
  error: { color: "#FF9CB0", lineHeight: 22 }, link: { color: "#FF8EA3", paddingVertical: 8 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", alignItems: "center", justifyContent: "center", padding: 16 }, dialog: { width: "100%", maxWidth: 820, maxHeight: "90%", backgroundColor: "#191D2B", borderRadius: 16 }, dialogContent: { padding: 24, gap: 18 },
  change: { padding: 14, gap: 12, borderWidth: 1, borderColor: "#30374B", borderRadius: 10 }, diffValue: { flex: 1, minWidth: 120, gap: 6 }, before: { color: "#FFB4BE", lineHeight: 22 }, after: { color: "#9CE6C3", lineHeight: 22 },
});
