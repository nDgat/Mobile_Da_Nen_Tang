export type Row = { id: number; [key: string]: unknown };
export type Field = { key: string; label: string; kind?: "number" | "date" | "datetime"; optional?: boolean; options?: string[]; source?: "movies" | "cinemas" | "rooms" };
export type Section = { key: string; label: string; path: string; fields?: Field[]; columns: [string, string][] };
export const sections: Section[] = [
  { key: "movies", label: "Phim", path: "/movies", fields: [
    { key: "category", label: "Nhóm phim", options: ["NOW_SHOWING", "SPECIAL", "COMING_SOON"] },
    { key: "title", label: "Tên phim" }, { key: "durationMinutes", label: "Thời lượng (phút)", kind: "number" },
    { key: "releaseDate", label: "Ngày phát hành (YYYY-MM-DD)", kind: "date" }, { key: "posterUrl", label: "URL poster", optional: true }, { key: "synopsis", label: "Nội dung", optional: true },
  ], columns: [["title", "Tên phim"], ["category", "Nhóm phim"], ["durationMinutes", "Phút"], ["releaseDate", "Phát hành"], ["isActive", "Hoạt động"]] },
  { key: "cinemas", label: "Rạp", path: "/cinemas", fields: [{ key: "name", label: "Tên rạp" }, { key: "address", label: "Địa chỉ" }, { key: "city", label: "Thành phố" }], columns: [["name", "Rạp"], ["address", "Địa chỉ"], ["city", "Thành phố"], ["isActive", "Hoạt động"]] },
  { key: "rooms", label: "Phòng chiếu", path: "/rooms", fields: [{ key: "cinemaId", label: "Rạp", kind: "number", source: "cinemas" }, { key: "name", label: "Tên phòng" }], columns: [["name", "Phòng"], ["cinemaId", "Rạp"], ["isActive", "Hoạt động"]] },
  { key: "seats", label: "Ghế", path: "/seats", fields: [{ key: "roomId", label: "Phòng", kind: "number", source: "rooms" }, { key: "rowLabel", label: "Hàng ghế (A, B...)" }, { key: "seatNumber", label: "Số ghế", kind: "number" }, { key: "type", label: "Loại ghế", options: ["STANDARD", "VIP"] }], columns: [["rowLabel", "Hàng"], ["seatNumber", "Số ghế"], ["roomId", "Phòng"], ["type", "Loại"], ["isActive", "Hoạt động"]] },
  { key: "showtimes", label: "Suất chiếu", path: "/showtimes", fields: [{ key: "movieId", label: "Phim", kind: "number", source: "movies" }, { key: "roomId", label: "Phòng", kind: "number", source: "rooms" }, { key: "startsAt", label: "Bắt đầu (YYYY-MM-DD HH:mm, giờ Việt Nam)", kind: "datetime" }, { key: "standardPrice", label: "Giá ghế thường (đ)", kind: "number" }, { key: "vipPrice", label: "Giá ghế VIP (đ)", kind: "number" }], columns: [["movieId", "Phim"], ["roomId", "Phòng"], ["startsAt", "Bắt đầu"], ["endsAt", "Kết thúc"], ["status", "Trạng thái"]] },
  { key: "users", label: "Người dùng", path: "/admin/users", columns: [["fullName", "Họ tên"], ["email", "Email"], ["role", "Vai trò"], ["isActive", "Hoạt động"]] },
  { key: "bookings", label: "Đặt vé", path: "/admin/bookings", columns: [["code", "Mã vé"], ["user.fullName", "Khách hàng"], ["movie.title", "Phim"], ["cinema.name", "Rạp"], ["roomName", "Phòng"], ["startsAt", "Suất chiếu"], ["seats", "Ghế"], ["totalAmount", "Tổng tiền"], ["status", "Trạng thái"]] },
  { key: "reviews", label: "Đánh giá", path: "/admin/reviews", columns: [["user.fullName", "Người đánh giá"], ["movie.title", "Phim"], ["rating", "Điểm / 5"], ["comment", "Nội dung"], ["isVisible", "Hiển thị"]] },
  { key: "audit-logs", label: "Nhật ký", path: "/admin/audit-logs", columns: [["actor.fullName", "Người thao tác"], ["action", "Thao tác"], ["entityType", "Đối tượng"], ["entityId", "ID đối tượng"], ["createdAt", "Thời gian"], ["beforeData", "Trước"], ["afterData", "Sau"]] },
];
export const labels: Record<string, string> = { NOW_SHOWING: "Đang chiếu", SPECIAL: "Đặc biệt", COMING_SOON: "Sắp chiếu", STANDARD: "Thường", VIP: "VIP", ADMIN: "Quản trị", CUSTOMER: "Khách hàng", SCHEDULED: "Sắp chiếu", CANCELLED: "Đã hủy", FINISHED: "Đã kết thúc", PENDING: "Đang giữ ghế", AWAITING_PAYMENT: "Chờ thanh toán", CONFIRMED: "Đã xác nhận", EXPIRED: "Hết hạn" };
export function valueAt(row: Row, key: string): unknown {
  return key.split(".").reduce<unknown>((value, part) => value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined, row);
}
export function display(value: unknown, key = ""): string {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (key === "totalAmount" || key === "revenue") return `${Number(value).toLocaleString("vi-VN")} đ`;
  if (["startsAt", "endsAt", "createdAt"].includes(key)) return new Date(String(value)).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  if (key === "releaseDate") return String(value).slice(0, 10);
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return labels[String(value)] ?? String(value);
}
export function formBody(fields: Field[], values: Record<string, string>) {
  const body: Record<string, unknown> = {};
  for (const field of fields) {
    const value = (values[field.key] ?? "").trim();
    if (!value && !field.optional) throw new Error(`Vui lòng nhập ${field.label.toLowerCase()}.`);
    if (field.kind === "number") {
      if (!Number.isSafeInteger(Number(value)) || Number(value) <= 0) throw new Error(`${field.label} phải là số nguyên dương.`);
      body[field.key] = Number(value);
    } else if (field.kind === "datetime") {
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value) || !Number.isFinite(Date.parse(value.replace(" ", "T") + ":00+07:00"))) throw new Error("Thời gian phải có dạng YYYY-MM-DD HH:mm.");
      const datePart = value.slice(0, 10);
      if (new Date(datePart).toISOString().slice(0, 10) !== datePart || Number(value.slice(11, 13)) > 23 || Number(value.slice(14, 16)) > 59) throw new Error("Ngày hoặc giờ chiếu không hợp lệ.");
      body[field.key] = new Date(value.replace(" ", "T") + ":00+07:00").toISOString();
    } else if (field.kind === "date") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error("Ngày phát hành không hợp lệ.");
      body[field.key] = value;
    } else body[field.key] = value || null;
  }
  return body;
}
