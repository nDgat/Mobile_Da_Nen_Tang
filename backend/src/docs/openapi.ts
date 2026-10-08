type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
type OperationOptions = { auth?: boolean; admin?: boolean; body?: Record<string, unknown>; params?: unknown[]; status?: number };

const json = (schema: Record<string, unknown>, required?: string[]) => ({
  type: "object", properties: schema, ...(required ? { required } : {}), additionalProperties: false,
});
const idParameter = (name = "id") => ({ name, in: "path", required: true, schema: { type: "integer", minimum: 1 } });
const pageParameters = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
];
const errorResponse = (description: string) => ({ description, content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } });
const paths: Record<string, Partial<Record<HttpMethod, Record<string, unknown>>>> = {};
add("post", "/uploads", "Admin", "Tải ảnh JPG/PNG/WebP (tối đa 5 MB)", { admin: true, body: json({ base64: { type: "string", description: "Nội dung ảnh base64, không kèm tiền tố data URI" } }, ["base64"]) });
add("get", "/banner", "Banner", "Lấy ảnh bìa chung của ứng dụng");
add("put", "/banner", "Banner", "Cập nhật ảnh bìa", { admin: true, body: json({ backgroundUrl: { type: "string", maxLength: 2048, description: "Ảnh nền phía sau poster; URL http/https hoặc đường dẫn uploads; để trống để bỏ nền" }, imageUrl: { type: "string", maxLength: 2048, description: "URL http/https hoặc chuỗi rỗng để dùng ảnh mặc định" }, title: { type: "string", minLength: 1, maxLength: 150 } }, ["imageUrl", "title"]) });

const homeContentProperties = {
  section: { type: "string", enum: ["BANNER", "HOT_NEWS", "VOUCHER", "PARTNER_PROMOTION"] },
  title: { type: "string", minLength: 1, maxLength: 180 },
  subtitle: { type: ["string", "null"], maxLength: 500 },
  imageUrl: { type: ["string", "null"], maxLength: 2048 },
  linkUrl: { type: ["string", "null"], maxLength: 2048 },
  badge: { type: ["string", "null"], maxLength: 60 },
  displayStyle: { type: "string", enum: ["HERO", "CARD", "SQUARE"] },
  sortOrder: { type: "integer", minimum: 1 },
  isActive: { type: "boolean" },
};
add("get", "/home-content", "Home content", "List home page content", { params: [...pageParameters, { name: "section", in: "query", schema: homeContentProperties.section }, { name: "active", in: "query", schema: { type: "boolean" } }] });
add("post", "/home-content", "Home content", "Create home page content", { admin: true, body: json(homeContentProperties, ["section", "title", "displayStyle", "sortOrder"]) });
add("patch", "/home-content/{id}", "Home content", "Update home page content", { admin: true, params: [idParameter()], body: json(homeContentProperties) });

function add(method: HttpMethod, path: string, tag: string, summary: string, options: OperationOptions = {}) {
  const status = options.status ?? (method === "post" ? 201 : method === "delete" ? 204 : 200);
  paths[path] ??= {};
  paths[path]![method] = {
    tags: [tag], summary,
    ...(options.admin ? { description: "Yêu cầu tài khoản ADMIN." } : {}),
    ...((options.auth || options.admin) ? { security: [{ bearerAuth: [] }] } : {}),
    ...(options.params ? { parameters: options.params } : {}),
    ...(options.body ? { requestBody: { required: true, content: { "application/json": { schema: options.body } } } } : {}),
    responses: {
      [status]: { description: "Thành công." },
      400: errorResponse("Dữ liệu không hợp lệ."),
      ...((options.auth || options.admin) ? { 401: errorResponse("Chưa đăng nhập hoặc token hết hạn.") } : {}),
      ...(options.admin ? { 403: errorResponse("Không có quyền ADMIN.") } : {}),
      404: errorResponse("Không tìm thấy tài nguyên."),
      409: errorResponse("Xung đột trạng thái dữ liệu."),
    },
  };
}

const credentials = json({ email: { type: "string", format: "email", example: "user@example.com" }, password: { type: "string", format: "password", example: "StrongPassword123" } }, ["email", "password"]);
const refreshBody = json({ refreshToken: { type: "string" } }, ["refreshToken"]);
add("post", "/auth/register", "Auth", "Đăng ký khách hàng", { body: json({ fullName: { type: "string", example: "Nguyễn Văn A" }, email: { type: "string", format: "email" }, password: { type: "string", format: "password" } }, ["fullName", "email", "password"]) });
add("post", "/auth/login", "Auth", "Đăng nhập", { body: credentials, status: 200 });
add("get", "/auth/me", "Auth", "Thông tin tài khoản hiện tại", { auth: true });
add("post", "/auth/refresh", "Auth", "Làm mới access token", { body: refreshBody, status: 200 });
add("post", "/auth/logout", "Auth", "Đăng xuất và thu hồi refresh token", { body: refreshBody, status: 204 });

const movieBody = json({ categories: { type: "array", minItems: 1, maxItems: 3, uniqueItems: true, items: { type: "string", enum: ["NOW_SHOWING", "SPECIAL", "COMING_SOON"] } }, category: { type: "string", enum: ["NOW_SHOWING", "SPECIAL", "COMING_SOON"] }, title: { type: "string" }, synopsis: { type: "string", nullable: true }, durationMinutes: { type: "integer", minimum: 1 }, releaseDate: { type: "string", format: "date" }, posterUrl: { type: "string", format: "uri", nullable: true }, isActive: { type: "boolean" } }, ["title", "durationMinutes", "releaseDate"]);
add("get", "/movies", "Movies", "Danh sách phim", { params: [...pageParameters, { name: "category", in: "query", schema: { type: "string", enum: ["NOW_SHOWING", "SPECIAL", "COMING_SOON"] } }] });
add("get", "/movies/{id}", "Movies", "Chi tiết phim", { params: [idParameter()] });
add("post", "/movies", "Movies", "Tạo phim", { admin: true, body: movieBody });
add("patch", "/movies/{id}", "Movies", "Cập nhật phim", { admin: true, params: [idParameter()], body: movieBody });
add("delete", "/movies/{id}", "Movies", "Ngừng hoạt động phim", { admin: true, params: [idParameter()] });
add("get", "/movies/{id}/reviews", "Reviews", "Danh sách đánh giá phim", { params: [idParameter(), ...pageParameters] });
add("get", "/movies/{id}/reviews/me", "Reviews", "Đánh giá của tôi", { auth: true, params: [idParameter()] });
add("put", "/movies/{id}/reviews/me", "Reviews", "Tạo hoặc cập nhật đánh giá", { auth: true, params: [idParameter()], body: json({ rating: { type: "integer", minimum: 1, maximum: 5 }, comment: { type: "string", maxLength: 1000, nullable: true } }, ["rating"]) });
add("delete", "/movies/{id}/reviews/me", "Reviews", "Xóa đánh giá của tôi", { auth: true, params: [idParameter()] });

const resources = [
  ["cinemas", "Cinemas", "rạp", json({ name: { type: "string" }, address: { type: "string" }, city: { type: "string" }, latitude: { type: "number", minimum: 8, maximum: 24 }, longitude: { type: "number", minimum: 102, maximum: 115 }, isActive: { type: "boolean" } }, ["name", "address", "city", "latitude", "longitude"])],
  ["rooms", "Rooms", "phòng chiếu", json({ cinemaId: { type: "integer" }, name: { type: "string" }, seatLayout: { type: "array", minItems: 4, items: { type: "object", properties: { rowLabel: { type: "string" }, seatNumber: { type: "integer" }, type: { type: "string", enum: ["STANDARD", "VIP", "SWEETBOX"] } }, required: ["rowLabel", "seatNumber", "type"] } }, isActive: { type: "boolean" } }, ["cinemaId", "name"])],
  ["seats", "Seats", "ghế", json({ roomId: { type: "integer" }, rowLabel: { type: "string" }, seatNumber: { type: "integer" }, type: { type: "string", enum: ["STANDARD", "VIP", "SWEETBOX"] }, isActive: { type: "boolean" } }, ["roomId", "rowLabel", "seatNumber"])],
] as const;
for (const [resource, tag, label, body] of resources) {
  add("get", `/${resource}`, tag, `Danh sách ${label}`, { params: pageParameters });
  add("get", `/${resource}/{id}`, tag, `Chi tiết ${label}`, { params: [idParameter()] });
  add("post", `/${resource}`, tag, `Tạo ${label}`, { admin: true, body });
  add("patch", `/${resource}/{id}`, tag, `Cập nhật ${label}`, { admin: true, params: [idParameter()], body });
  add("delete", `/${resource}/{id}`, tag, `Ngừng hoạt động ${label}`, { admin: true, params: [idParameter()] });
}

add("get", "/showtimes", "Showtimes", "Danh sách suất chiếu", { params: pageParameters });
add("get", "/showtimes/{id}", "Showtimes", "Chi tiết suất chiếu", { params: [idParameter()] });
add("get", "/showtimes/{id}/seats", "Showtimes", "Sơ đồ ghế", { params: [idParameter()] });
add("post", "/showtimes/{id}/hold-seats", "Bookings", "Giữ ghế trong 5 phút", { auth: true, params: [idParameter()], body: json({ showtimeSeatIds: { type: "array", minItems: 1, maxItems: 8, items: { type: "integer" } } }, ["showtimeSeatIds"]) });
add("post", "/showtimes", "Showtimes", "Tạo suất chiếu", { admin: true, body: json({ movieId: { type: "integer" }, roomId: { type: "integer" }, startsAt: { type: "string", format: "date-time" }, standardPrice: { type: "integer" }, vipPrice: { type: "integer" }, sweetboxPrice: { type: "integer" } }, ["movieId", "roomId", "startsAt", "standardPrice", "vipPrice", "sweetboxPrice"]) });
add("patch", "/showtimes/{id}/status", "Showtimes", "Đổi trạng thái suất chiếu", { admin: true, params: [idParameter()], body: json({ status: { type: "string", enum: ["SCHEDULED", "CANCELLED", "FINISHED"] } }, ["status"]) });

add("get", "/bookings", "Bookings", "Lịch sử đặt vé", { auth: true, params: pageParameters });
add("get", "/bookings/{id}", "Bookings", "Chi tiết booking", { auth: true, params: [idParameter()] });
add("post", "/bookings/{id}/submit", "Bookings", "Chuyển booking sang thanh toán", { auth: true, params: [idParameter()], status: 200 });
add("delete", "/bookings/{id}/hold", "Bookings", "Hủy giữ ghế", { auth: true, params: [idParameter()] });
add("put", "/bookings/{id}/concessions", "Bookings", "Chọn bắp nước", { auth: true, params: [idParameter()], body: json({ items: { type: "array", items: json({ productId: { type: "integer" }, quantity: { type: "integer", minimum: 1, maximum: 10 } }, ["productId", "quantity"]) } }, ["items"]) });
add("put", "/bookings/{id}/voucher", "Bookings", "Áp dụng voucher", { auth: true, params: [idParameter()], body: json({ code: { type: "string" } }, ["code"]) });
add("delete", "/bookings/{id}/voucher", "Bookings", "Gỡ voucher", { auth: true, params: [idParameter()] });
add("post", "/bookings/{id}/payments/mock", "Payments", "Thanh toán mô phỏng", { auth: true, params: [idParameter()], body: json({ outcome: { type: "string", enum: ["SUCCESS", "FAILURE", "CANCEL"] } }, ["outcome"]), status: 200 });
add("get", "/bookings/{id}/ticket", "Tickets", "Lấy vé điện tử", { auth: true, params: [idParameter()] });
add("post", "/tickets/verify", "Tickets", "Xác minh QR vé", { admin: true, body: json({ token: { type: "string" } }, ["token"]), status: 200 });

add("get", "/concessions", "Catalog", "Danh sách bắp nước");
add("get", "/vouchers", "Catalog", "Danh sách voucher");
add("get", "/notifications", "Notifications", "Danh sách thông báo", { auth: true, params: pageParameters });
add("patch", "/notifications/read-all", "Notifications", "Đánh dấu đọc tất cả", { auth: true });
add("patch", "/notifications/{id}/read", "Notifications", "Đánh dấu đọc một thông báo", { auth: true, params: [idParameter()] });
add("get", "/favorites", "Favorites", "Danh sách phim yêu thích", { auth: true, params: pageParameters });
add("get", "/favorites/{movieId}", "Favorites", "Trạng thái yêu thích", { auth: true, params: [idParameter("movieId")] });
add("put", "/favorites/{movieId}", "Favorites", "Thêm phim yêu thích", { auth: true, params: [idParameter("movieId")] });
add("delete", "/favorites/{movieId}", "Favorites", "Xóa phim yêu thích", { auth: true, params: [idParameter("movieId")] });

add("get", "/admin/dashboard", "Admin", "Dashboard quản trị", { admin: true });
add("get", "/admin/users", "Admin", "Quản lý người dùng", { admin: true, params: pageParameters });
add("patch", "/admin/users/{id}/status", "Admin", "Khóa hoặc mở tài khoản", { admin: true, params: [idParameter()], body: json({ isActive: { type: "boolean" } }, ["isActive"]) });
add("get", "/admin/bookings", "Admin", "Quản lý booking", { admin: true, params: pageParameters });
add("get", "/admin/reviews", "Admin", "Kiểm duyệt đánh giá", { admin: true, params: pageParameters });
add("patch", "/admin/reviews/{id}/visibility", "Admin", "Ẩn hoặc hiện đánh giá", { admin: true, params: [idParameter()], body: json({ isVisible: { type: "boolean" } }, ["isVisible"]) });
add("get", "/admin/audit-logs", "Admin", "Nhật ký kiểm toán", { admin: true, params: [
  ...pageParameters,
  { name: "actorId", in: "query", schema: { type: "integer", minimum: 1 } },
  ...["action", "entityType", "entityId", "search"].map(name => ({ name, in: "query", schema: { type: "string", maxLength: 100 } })),
  ...["from", "to"].map(name => ({ name, in: "query", description: "Ngày Việt Nam, bao gồm cả ngày này (UTC+7)", schema: { type: "string", format: "date" } })),
] });

export const openApiDocument = {
  openapi: "3.0.3",
  info: { title: "CineBook API", version: "1.0.0", description: "REST API cho ứng dụng đặt vé rạp chiếu phim CineBook." },
  servers: [{ url: "/api/v1", description: "Server hiện tại" }],
  tags: ["Auth", "Movies", "Reviews", "Cinemas", "Rooms", "Seats", "Showtimes", "Bookings", "Payments", "Tickets", "Catalog", "Notifications", "Favorites", "Admin"].map(name => ({ name })),
  paths,
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Nhập access token nhận từ POST /auth/login." } },
    schemas: {
      ErrorResponse: json({ error: json({ code: { type: "string", example: "VALIDATION_ERROR" }, message: { type: "string" }, requestId: { type: "string" }, details: { type: "array", items: { type: "object" } } }, ["code", "message"]) }, ["error"]),
    },
  },
};
