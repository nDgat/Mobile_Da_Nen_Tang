# Tiến độ xây dựng CineBook

Cập nhật lần cuối: 2026-09-24

## Tổng quan

- Hoàn thành: **49/51 phần (96,1%)**
- Đang thực hiện: **PHẦN 49 – Android** và **PHẦN 50 – iOS**.
- Bước tiếp theo: xác nhận luồng giao diện trên thiết bị Android và iPhone.

Quy ước:

- `[x]`: đã học, thực hiện và kiểm tra thành công.
- `[-]`: đang thực hiện, chưa đủ điều kiện hoàn thành.
- `[ ]`: chưa bắt đầu.

## Tiến độ chi tiết

- [x] PHẦN 1 – Tổng quan hệ thống
- [x] PHẦN 2 – Cài đặt môi trường
- [x] PHẦN 3 – Tạo project React Native + Expo
- [x] PHẦN 4 – Tìm hiểu cấu trúc Expo Router
- [x] PHẦN 5 – Docker cơ bản
- [x] PHẦN 6 – Thiết lập MySQL không dùng Docker
- [x] PHẦN 7 – Tạo Backend Node.js + Express
- [x] PHẦN 8 – Kết nối Backend với MySQL
- [x] PHẦN 9 – Prisma từ cơ bản
- [x] PHẦN 10 – Thiết kế Database
- [x] PHẦN 11 – Migration Prisma
- [x] PHẦN 12 – Seed dữ liệu
- [x] PHẦN 13 – REST API cơ bản
- [x] PHẦN 14 – CRUD phim
- [x] PHẦN 15 – CRUD rạp
- [x] PHẦN 16 – CRUD phòng chiếu
- [x] PHẦN 17 – CRUD ghế
- [x] PHẦN 18 – Quản lý suất chiếu
- [x] PHẦN 19 – Đăng ký tài khoản
- [x] PHẦN 20 – Đăng nhập JWT
- [x] PHẦN 21 – Refresh Token
- [x] PHẦN 22 – Phân quyền
- [x] PHẦN 23 – App Home
- [x] PHẦN 24 – Danh sách phim
- [x] PHẦN 25 – Chi tiết phim
- [x] PHẦN 26 – Chọn rạp
- [x] PHẦN 27 – Chọn ngày và suất chiếu
- [x] PHẦN 28 – Sơ đồ ghế
- [x] PHẦN 29 – Giữ ghế
- [x] PHẦN 30 – Đặt vé
- [x] PHẦN 31 – Tính tiền
- [x] PHẦN 32 – Bắp nước
- [x] PHẦN 33 – Voucher
- [x] PHẦN 34 – Payment Mock
- [x] PHẦN 35 – QR Code
- [x] PHẦN 36 – Vé điện tử
- [x] PHẦN 37 – Lịch sử đặt vé
- [x] PHẦN 38 – Notification
- [x] PHẦN 39 – Review
- [x] PHẦN 40 – Favorite
- [x] PHẦN 41 – Admin API
- [x] PHẦN 42 – Validation
- [x] PHẦN 43 – Error Handling
- [x] PHẦN 44 – Logging
- [x] PHẦN 45 – Audit Log
- [x] PHẦN 46 – Swagger
- [x] PHẦN 47 – Unit Test
- [x] PHẦN 48 – Integration Test
- [-] PHẦN 49 – Kiểm thử Android
- [-] PHẦN 50 – Kiểm thử iOS
- [x] PHẦN 51 – Tối ưu và hoàn thiện

## Kết quả đã xác minh

### Seed dữ liệu

- Người học đã chạy `npm run db:seed` thành công.
- 8 phim, 3 rạp, mỗi rạp 5 phòng: tổng 15 phòng, 600 ghế, 30 suất mới, 1200 ghế theo suất, 5 sản phẩm bắp nước và 3 voucher.
- Seed tự tạo lịch cho ngày kế tiếp theo giờ Việt Nam; suất đã qua được chuyển `FINISHED` và giữ làm lịch sử.

### Môi trường

- Node.js `v20.20.0`
- npm và npx `10.8.2`
- Git `2.51.2.windows.1`
- WSL `2.7.14.0`, mặc định WSL 2
- Docker Desktop đã được gỡ do ổ C không đủ dung lượng; dữ liệu Docker đã được dọn sạch
- Expo Go chạy trên iPhone dùng iOS 16.3

### Mobile

- Expo SDK 54
- React Native 0.81.5
- Expo Router 6.0.24
- TypeScript kiểm tra thành công
- Expo Doctor hoàn thành 18/18 kiểm tra
- Project chạy thành công trên iPhone qua mạng LAN

### Backend

- Node.js + Express 5 + TypeScript
- Typecheck và build thành công
- `GET /` và `GET /health` phản hồi đúng trên cổng 3000
- Endpoint không tồn tại trả HTTP 404 dạng JSON
- Connection pool kết nối thành công với MySQL `8.0.46`
- `GET /health/database` xác nhận database `cinebook` hoạt động
- Prisma ORM 7.10 kết nối thành công với MySQL qua driver adapter
- `GET /health/prisma` trả status `ok`
- Backend hỗ trợ CORS cho Expo Web; preflight `OPTIONS` và request khác cổng đã kiểm thử thành công.
- Đã chuẩn bị API học tập tại `/api/v1/examples` theo Route → Controller → Service
- Agent đã xác minh HTTP `200`, `201`, `400`, `404`; chờ người học tự chạy và xác nhận

## PHẦN 51 đã hoàn thành

- Chuẩn hóa tên CineBook, scheme, Android package và iOS bundle identifier.
- Thêm ESLint, lệnh typecheck/lint/doctor/check và sửa toàn bộ lỗi cấu hình, route được phát hiện.
- Tách notification native/web, loại cảnh báo web và giảm bundle web từ 1,36 MB xuống 1,23 MB.
- Session/vé dùng SecureStore trên mobile và localStorage trên web, khắc phục crash ExpoSecureStore.
- Backend đạt 8 unit test, 5 integration test, typecheck/build, Prisma validate và không drift.
- Mobile đạt TypeScript, ESLint, Expo Doctor 18/18 và web export 14 route.
- Backend audit không có lỗ hổng; Expo SDK 54 còn cảnh báo dependency chỉ sửa bằng nâng SDK phá vỡ tương thích hiện tại.
- Phần 49/50 vẫn chờ xác nhận runtime trên thiết bị Android và iPhone.

## PHẦN 50 đang thực hiện

- TypeScript mobile kiểm tra thành công.
- Metro tạo thành công iOS Hermes bundle từ 1.434 module, dung lượng 3,76 MB.
- Metro LAN và backend đều phản hồi `200` qua địa chỉ `172.20.10.3`.
- Expo Go có thể mở project tại `exp://172.20.10.3:8081` trên cùng Wi-Fi.
- Windows không thể tạo native iOS build; còn cần xác nhận luồng mới nhất trực tiếp trên iPhone.

## PHẦN 49 đang thực hiện

- TypeScript mobile kiểm tra thành công và Expo Doctor đạt 18/18.
- Metro tạo thành công Android Hermes bundle từ 1.432 module, dung lượng 3,76 MB.
- Android SDK, platform-tools, emulator và system image API 37 đã tồn tại trên máy.
- Chưa có thiết bị trong `adb devices`, chưa có AVD và Android Studio/avdmanager.
- Còn cần kiểm thử giao diện, điều hướng, đăng nhập và đặt vé trên Android thực tế.

## PHẦN 48 đã hoàn thành

- Dùng Supertest chạy request trực tiếp qua Express và MySQL local.
- Kiểm thử health, OpenAPI, CORS, đăng ký/đăng nhập, refresh rotation và logout.
- Xác minh CUSTOMER bị chặn, ADMIN truy cập được và lỗi validation có request ID.
- Kiểm thử giữ ghế, quyền sở hữu booking, hủy giữ và hoàn trả ghế.
- Kết quả 5/5 test đạt; dữ liệu người dùng, booking và ghế thử được dọn sạch.
- Backend typecheck/build thành công; npm audit không có lỗ hổng.

## PHẦN 47 đã hoàn thành

- Dùng test runner tích hợp của Node.js và `tsx`, không thêm test framework nặng.
- Kiểm thử tính tiền ghế/phí/bắp nước/giảm giá, voucher và chữ ký QR vé.
- Bao phủ trường hợp hợp lệ, giới hạn, dữ liệu âm, voucher hết hạn/hết lượt và token bị sửa.
- Kết quả 8/8 test đạt; tổng line coverage 88,65%, function coverage 100%.
- Backend typecheck và build tiếp tục thành công.

## PHẦN 46 đã hoàn thành

- Swagger UI hoạt động tại `/api-docs`; tài liệu JSON tại `/api-docs.json`.
- OpenAPI 3.0.3 mô tả 61 thao tác trên 43 đường dẫn thuộc các nhóm API chính.
- Có request body, path/query parameter, response lỗi và phân nhóm endpoint.
- Hỗ trợ Bearer JWT để thử trực tiếp API yêu cầu đăng nhập hoặc quyền ADMIN.
- Backend typecheck/build, JSON OpenAPI và giao diện Swagger đều kiểm thử thành công.

## PHẦN 45 đã hoàn thành

- Thêm bảng AuditLog bất biến, liên kết quản trị viên thực hiện thao tác.
- Ghi action, loại và ID đối tượng, dữ liệu trước/sau, request ID, IP, user agent và thời điểm.
- Thay đổi trạng thái người dùng và hiển thị review được ghi audit trong cùng transaction MySQL.
- API `GET /api/v1/admin/audit-logs` chỉ dành cho ADMIN, hỗ trợ phân trang và lọc.
- Migration đã áp dụng; database không drift, typecheck/build và kiểm thử tích hợp thành công.

## PHẦN 44 đã hoàn thành

- Log backend theo JSON một dòng với timestamp, level, service và event.
- Mỗi HTTP request ghi requestId, method, path, status, thời gian xử lý và user nếu đã xác thực.
- Không ghi query, body, Authorization; các key password/token/secret/cookie được tự động che.
- Hỗ trợ `LOG_LEVEL`: debug, info, warn, error hoặc silent.
- Lifecycle server, kết nối database, shutdown, lỗi 500 và lỗi process đều có log.
- Backend typecheck/build, kiểm thử redaction và log trực tiếp trên server đang chạy thành công.

## PHẦN 43 đã hoàn thành

- Thêm `ApiError` và middleware xử lý lỗi tập trung cho Express.
- Mỗi request có `X-Request-Id`; lỗi trung tâm trả cùng mã để truy vết.
- Chuẩn hóa lỗi malformed JSON, validation, route không tồn tại và Prisma phổ biến.
- Lỗi không dự kiến trả thông báo `500` an toàn, không lộ stack hoặc nội dung nội bộ.
- Mobile `ApiError` giữ status, code, requestId và chi tiết từng trường.
- Backend/mobile typecheck, build và kiểm thử HTTP 400/404/500 thành công.

## PHẦN 42 đã hoàn thành

- Thêm Zod 4 và middleware validation dùng chung cho request Express.
- Kiểm tra đồng thời `body`, `params` và `query` trước khi vào controller.
- Lỗi `400 VALIDATION_ERROR` chứa danh sách trường, thông báo và mã lỗi cụ thể.
- Áp dụng schema cho auth, booking, payment, review, favorite, notification và admin.
- Các service vẫn giữ kiểm tra nghiệp vụ và quyền sở hữu sau validation đầu vào.
- Backend typecheck/build và kiểm thử HTTP nhiều nhóm route thành công.

## PHẦN 41 đã hoàn thành

- Tất cả endpoint `/api/v1/admin` yêu cầu JWT và vai trò `ADMIN`.
- Dashboard tổng hợp người dùng, phim, rạp, booking, doanh thu, trạng thái và đơn gần nhất.
- Admin có thể tìm/lọc người dùng, khóa/mở tài khoản và không thể tự khóa chính mình.
- Danh sách booking hỗ trợ phân trang, trạng thái và tìm theo mã đơn/email.
- Danh sách review hỗ trợ lọc và bật/tắt hiển thị để kiểm duyệt.
- Backend typecheck/build và kiểm thử HTTP + MySQL thành công.

## PHẦN 40 đã hoàn thành

- Mỗi người dùng có danh sách phim yêu thích riêng trong MySQL.
- API hỗ trợ lấy trạng thái, thêm lặp an toàn, xóa lặp an toàn và danh sách phân trang.
- Chỉ phim đang hoạt động mới được thêm vào yêu thích.
- Trang chi tiết phim có nút tim và phản hồi trạng thái rõ ràng.
- Mobile có màn hình phim yêu thích và thao tác bỏ nhanh khỏi danh sách.
- Migration không drift; build/typecheck và kiểm thử MySQL thành công.

## PHẦN 39 đã hoàn thành

- Mỗi người dùng có tối đa một đánh giá cho mỗi phim và có thể cập nhật hoặc xóa.
- Chỉ người đã có booking `CONFIRMED` của phim mới được gửi đánh giá.
- Backend kiểm tra điểm nguyên từ 1–5, bình luận tối đa 1.000 ký tự và quyền sở hữu.
- API công khai trả danh sách, tổng lượt và điểm trung bình của phim.
- Trang chi tiết phim có form sao, bình luận và danh sách đánh giá khán giả.
- Migration không drift; build/typecheck và kiểm thử MySQL thành công.

## PHẦN 38 đã hoàn thành

- Thêm bảng Notification và tự tạo thông báo khi thanh toán thành công.
- API danh sách có phân trang, số chưa đọc, đọc một thông báo và đọc tất cả.
- Mobile có trung tâm thông báo, badge chưa đọc và điều hướng tới vé liên quan.
- Vé điện tử cho phép đặt lời nhắc cục bộ trước giờ chiếu 30 phút trên iPhone.
- Nhấn thông báo giờ chiếu sẽ mở đúng vé điện tử.
- Migration không drift; build/typecheck, kiểm thử MySQL và Expo Doctor 18/18 thành công.

## PHẦN 37 đã hoàn thành

- Thêm API lịch sử chỉ trả các booking thuộc người dùng đang đăng nhập.
- Hỗ trợ phân trang, giới hạn tối đa 50 bản ghi và lọc theo trạng thái booking.
- Mobile có màn hình lịch sử, kéo để làm mới và tự tải trang tiếp theo.
- Có bộ lọc tất cả, đã thanh toán, chờ xử lý, đã hủy và hết hạn.
- Đơn đã thanh toán mở vé điện tử; các trạng thái khác mở chi tiết đơn.
- Backend typecheck/build, mobile TypeScript và kiểm thử MySQL thành công.

## PHẦN 36 đã hoàn thành

- Thêm màn hình vé điện tử riêng cho booking đã thanh toán thành công.
- Vé hiển thị QR, phim, suất chiếu, rạp, phòng, ghế, người đặt, bắp nước, voucher và giao dịch.
- Vé được lưu trong SecureStore sau lần tải thành công và có thể mở khi mạng gián đoạn.
- Người dùng có thể chia sẻ thông tin vé bằng chức năng Share của điện thoại.
- Màn hình booking có nút mở vé điện tử sau khi thanh toán.
- Backend typecheck/build và TypeScript mobile thành công.

## PHẦN 35 đã hoàn thành

- Backend chỉ cấp QR cho vé thuộc người dùng và booking đã thanh toán thành công.
- QR chứa payload có chữ ký HMAC; dữ liệu bị sửa sẽ bị từ chối.
- Thêm API lấy QR của booking và API dành cho ADMIN để xác minh QR tại cổng soát vé.
- Kết quả xác minh luôn đối chiếu booking `CONFIRMED` hiện tại trong MySQL.
- Mobile hiển thị QR cùng phim, giờ chiếu, phòng, ghế và mã vé sau thanh toán.
- Backend typecheck/build, mobile TypeScript, kiểm thử chữ ký và Expo Doctor 18/18 đều thành công.

## PHẦN 34 đã hoàn thành

- API mô phỏng ba kết quả thanh toán: thành công, thất bại và người dùng hủy.
- Số tiền lấy từ đơn trên MySQL; dữ liệu amount giả từ client bị bỏ qua.
- Giao dịch lỗi/hủy vẫn giữ đơn để thử lại; thành công chuyển đơn sang CONFIRMED và ghế sang BOOKED.
- Yêu cầu thành công gửi lại không tạo giao dịch trùng và voucher chỉ tăng một lượt sử dụng.
- Mobile có bảng thanh toán thử nghiệm và hiển thị mã giao dịch thành công.
- Migration không drift; build/typecheck và kiểm thử MySQL thành công.

## PHẦN 33 đã hoàn thành

- Seed 3 voucher giảm cố định/phần trăm với thời hạn, mức chi tối thiểu và mức giảm tối đa.
- API công khai trả voucher khả dụng; người dùng nhập, chọn gợi ý, áp dụng hoặc gỡ mã.
- Backend chuẩn hóa mã, kiểm tra điều kiện và tự tính lại giảm giá từ dữ liệu MySQL.
- Voucher được tính lại hoặc tự gỡ nếu thay đổi bắp nước làm đơn không còn đủ điều kiện.
- Chỉ chủ đơn PENDING được sửa voucher; dữ liệu giảm giá giả từ client bị bỏ qua.
- Migration không drift; build/typecheck và kiểm thử MySQL thành công.

## PHẦN 32 đã hoàn thành

- Danh mục MySQL có 5 sản phẩm thuộc nhóm bắp, nước và combo; seed chạy lặp an toàn.
- API công khai trả sản phẩm đang bán; người dùng chỉ sửa bắp nước của đơn do mình sở hữu.
- Mỗi sản phẩm chọn tối đa 10 phần; backend lấy giá thật, lưu snapshot và tính lại tổng trong transaction.
- Không thể sửa bắp nước sau khi đơn chuyển sang chờ thanh toán.
- Mobile có bộ tăng/giảm số lượng, lưu lựa chọn và tự lưu trước khi xác nhận đơn.
- Migration không drift; build/typecheck và kiểm thử MySQL thành công.

## PHẦN 31 đã hoàn thành

- Backend tự tính tiền từ giá ghế lưu trong MySQL, không nhận tổng tiền do client gửi lên.
- Phí dịch vụ cố định 5.000đ mỗi ghế; cấu trúc giá đã sẵn sàng cho bắp nước và voucher.
- Response đơn gồm tiền ghế, phí dịch vụ, bắp nước, giảm giá và tổng thanh toán.
- Mobile hiển thị từng thành phần giá và làm nổi bật tổng cuối.
- Migration đồng bộ, không drift; build/typecheck và kiểm thử MySQL thành công.

## PHẦN 30 đã hoàn thành

- API đọc và xác nhận đơn chỉ cho đúng người sở hữu đã đăng nhập.
- Đơn chuyển từ PENDING sang AWAITING_PAYMENT; yêu cầu gửi lại an toàn và không tạo đơn trùng.
- Ghế tiếp tục được giữ thêm 10 phút để thanh toán; đơn hủy hoặc hết hạn tự trả ghế về AVAILABLE.
- Mobile có màn hình kiểm tra phim, rạp, suất, từng ghế, tạm tính và trạng thái đơn.
- Migration đồng bộ, không drift; backend build/typecheck, TypeScript mobile và kiểm thử MySQL đều thành công.

## PHẦN 29 đã hoàn thành

- API xác thực giữ tối đa 8 ghế trong 5 phút và cho phép người giữ chủ động hủy.
- Transaction khóa hàng bằng `SELECT ... FOR UPDATE`, nên hai tài khoản không thể giữ cùng ghế.
- Lượt giữ hết hạn được chuyển sang EXPIRED và ghế tự trả về AVAILABLE khi đọc sơ đồ.
- Mobile lưu JWT bằng SecureStore, hỗ trợ đăng ký/đăng nhập, refresh token và đếm ngược thời gian giữ.
- Kiểm thử MySQL thật đạt cho giữ đồng thời, tranh chấp, hủy và tự hết hạn; backend build và TypeScript mobile thành công.

## PHẦN 28 đã hoàn thành

- API `GET /api/v1/showtimes/:id/seats` trả thông tin phim/rạp/phòng và ghế theo suất.
- Mobile hiển thị sơ đồ theo hàng, loại STANDARD/VIP và trạng thái AVAILABLE/HELD/BOOKED.
- Ghế AVAILABLE được chọn cục bộ, tối đa 8 ghế; tổng tiền cập nhật tức thời.
- API seed trả đúng 40 ghế; backend build và TypeScript mobile thành công.

## PHẦN 27 đã hoàn thành

- Route chọn ngày/suất nhận movieId và cinemaId từ bước chọn rạp.
- Suất được lọc theo các phòng của rạp, bỏ lịch đã qua và nhóm theo ngày.
- Hiển thị giờ bắt đầu/kết thúc, phòng, định dạng và trạng thái được chọn.
- Có loading, lỗi/thử lại, empty state và pull-to-refresh.
- TypeScript kiểm tra thành công.

## PHẦN 26 đã hoàn thành

- Route `/movies/[id]/cinemas` chỉ hiển thị rạp có suất sắp tới của phim.
- Kết hợp dữ liệu showtime → room → cinema từ REST API.
- Người dùng chọn một rạp, thấy địa chỉ, thành phố, suất gần nhất và tổng số suất.
- Có loading, lỗi/thử lại, empty state và pull-to-refresh.
- TypeScript kiểm tra thành công.

## PHẦN 25 đã hoàn thành

- Route động `/movies/[id]` tải phim và các suất sắp tới từ API.
- Hiển thị poster/placeholder, tiêu đề, thời lượng, ngày phát hành, nội dung và lịch chiếu.
- Home và danh sách phim đều mở được màn hình chi tiết.
- Có loading, lỗi/thử lại, pull-to-refresh và ID không hợp lệ.
- TypeScript kiểm tra thành công.

## PHẦN 24 đã hoàn thành

- Danh sách phim tải dữ liệu thật từ API, có tìm kiếm và lọc phim có lịch chiếu.
- Thẻ phim hiển thị poster/placeholder, mô tả, thời lượng và số suất sắp tới.
- Có loading, lỗi/thử lại, danh sách rỗng và kéo để tải lại.
- TypeScript kiểm tra thành công.

## PHẦN 23 đã hoàn thành

- Home mới có hero, thống kê, phim nổi bật, suất gần nhất, kéo để tải lại và trạng thái lỗi.
- Mobile tự lấy IP của Metro để gọi backend cổng 3000; có thể ghi đè bằng `EXPO_PUBLIC_API_URL`.
- Dữ liệu phim/rạp/suất được tải từ REST API thật.
- TypeScript đạt; Expo Doctor bị timeout khi gọi Expo API, không phải lỗi mã nguồn.

## PHẦN 22 đã hoàn thành

- Middleware RBAC phân biệt `CUSTOMER` và `ADMIN` từ access token.
- GET dữ liệu phim/rạp/phòng/ghế/suất vẫn công khai.
- Các thao tác tạo/sửa/xóa chỉ dành cho ADMIN.
- Kiểm thử đạt: đọc `200`, chưa đăng nhập `401`, CUSTOMER `403`, ADMIN `201/200/204`.
- Dữ liệu và tài khoản kiểm thử đã dọn sạch.

## PHẦN 21 đã hoàn thành

- Login trả access token và refresh token ngẫu nhiên có hạn 30 ngày.
- `POST /api/v1/auth/refresh` xoay vòng token; token cũ bị vô hiệu ngay.
- `POST /api/v1/auth/logout` thu hồi refresh token.
- Mobile hiển thị đăng nhập/đăng xuất theo phiên, xác nhận thao tác và xóa phiên SecureStore.
- Chỉ hash SHA-256 được lưu trong MySQL; migration và schema đã đồng bộ.
- Kiểm thử refresh/logout/reuse đạt `200`, `204`, `401`; dữ liệu thử đã dọn sạch.

## PHẦN 20 đã hoàn thành

- `POST /api/v1/auth/login` xác minh email/mật khẩu và trả access token JWT 15 phút.
- `GET /api/v1/auth/me` dùng middleware Bearer token để bảo vệ endpoint.
- JWT dùng HS256, issuer, audience, secret riêng trong `.env`; không lộ mật khẩu/hash.
- Kiểm thử đạt: login/me `200`, sai hoặc thiếu token `401`, tài khoản khóa `403`.

## PHẦN 19 đã hoàn thành

- `POST /api/v1/auth/register` tạo tài khoản CUSTOMER.
- Chuẩn hóa email, kiểm tra mật khẩu, chặn email trùng và băm bằng bcrypt cost 12.
- Response không chứa mật khẩu/hash; kiểm thử đạt `201`, `400`, `409`.

## PHẦN 18 đã hoàn thành

- API `/api/v1/showtimes`: danh sách, chi tiết, tạo và đổi trạng thái.
- Tự tính giờ kết thúc theo thời lượng phim và tạo ghế theo suất trong transaction.
- Chặn lịch phòng trùng; kiểm thử đạt `200`, `201`, `400`, `409` và tạo đúng 40 ghế.
- Dữ liệu kiểm thử đã dọn sạch; seed giữ 30 suất và 1200 ghế theo suất.

## PHẦN 17 đã hoàn thành

- CRUD ghế tại `/api/v1/seats`; hỗ trợ phân trang và lọc theo `roomId`, `type`, `active`.
- Kiểm tra phòng cha, loại `STANDARD`/`VIP`, vị trí trùng và xóa mềm.
- Typecheck/build và HTTP thực tế đạt `200`, `201`, `204`, `400`, `404`.
- Dữ liệu kiểm thử đã dọn sạch; seed vẫn giữ 600 ghế.

## PHẦN 16 đã hoàn thành

- CRUD phòng tại `/api/v1/rooms`; hỗ trợ phân trang và lọc theo `cinemaId`, `active`.
- Kiểm tra rạp cha, tên phòng trùng trong cùng rạp và xóa mềm.
- Typecheck/build và HTTP thực tế đạt `200`, `201`, `204`, `400`, `404`.
- Dữ liệu kiểm thử đã dọn sạch; seed vẫn giữ 15 phòng.

## PHẦN 15 đã hoàn thành

Đã chuẩn bị:

- CRUD rạp tại `/api/v1/cinemas`.
- Danh sách có phân trang, lọc `active` và tìm theo `city`.
- Luồng Route → Controller → Service → Repository → Prisma → MySQL.
- `DELETE` dùng xóa mềm để giữ nguyên phòng và dữ liệu lịch sử.

Trạng thái: **Hoàn thành**.

Kết quả kỹ thuật:

- Typecheck và build thành công.
- Kiểm thử MySQL thật đạt: list `200`, create `201`, detail `200`, update `200`, delete `204`, validation `400`, không tồn tại `404`.
- Xóa mềm đổi đúng `isActive=false`.
- Rạp kiểm thử đã được xóa vật lý sau kiểm tra; seed vẫn giữ 3 rạp và 15 phòng.
- Người học yêu cầu hoàn tất cùng Phần 16 và 17.

## PHẦN 14 đã hoàn thành

Đã chuẩn bị:

- `GET /api/v1/movies` có phân trang và lọc trạng thái.
- `GET /api/v1/movies/:id` đọc chi tiết phim.
- `POST /api/v1/movies` tạo phim.
- `PATCH /api/v1/movies/:id` cập nhật từng phần.
- `DELETE /api/v1/movies/:id` xóa mềm bằng `isActive=false`.
- Luồng Route → Controller → Service → Repository → Prisma → MySQL.

Kết quả kỹ thuật:

- Typecheck và build thành công.
- Kiểm thử trên MySQL thật đạt: list `200`, create `201`, detail `200`, update `200`, delete `204`, validation `400`, không tồn tại `404`.
- Xóa mềm đổi đúng `isActive=false`.
- Bản ghi kiểm thử đã được xóa vật lý sau kiểm tra; dữ liệu seed vẫn giữ 8 phim.
- Người học yêu cầu chuyển sang phần tiếp theo.

Trạng thái: **Hoàn thành**.

## PHẦN 13 đã hoàn thành

Đã chuẩn bị:

- API phiên bản tại `/api/v1`.
- `GET /api/v1/examples/:id` để học path parameter và query parameter.
- `POST /api/v1/examples` để học JSON body, validation, status `201` và header `Location`.
- Phản hồi lỗi JSON thống nhất cho dữ liệu sai và endpoint không tồn tại.
- Cấu trúc Route → Controller → Service; chưa truy cập database để không lấn sang CRUD phim ở Phần 14.
- Tài liệu thực hành `docs/REST_API_BASICS.md`.

Kết quả kỹ thuật:

- Typecheck và build thành công.
- Kiểm thử HTTP thật đạt các mã `200`, `201`, `400`, `404`.

Trạng thái: **Hoàn thành**. Người học yêu cầu chuyển sang phần tiếp theo.

## PHẦN 9 đã hoàn thành

Đã thực hiện:

- Cài Prisma CLI, Prisma Client và adapter MySQL/MariaDB.
- Tạo Prisma Config và Prisma schema tối thiểu.
- Tạo Prisma Client và lớp kết nối dùng cấu hình trong `.env`.
- Thêm endpoint kiểm tra Prisma.
- Xác minh Prisma schema, generated client, TypeScript, build và runtime.
- Cập nhật các dependency gián tiếp có cảnh báo; npm audit trở lại 0 lỗ hổng.

Giới hạn:

- Chưa tạo model và migration trong Phần 9.
- Thiết kế model sẽ thực hiện ở Phần 10.

Trạng thái: **Hoàn thành**.

## PHẦN 8 đã hoàn thành

Đã thực hiện:

- Cài `mysql2` và tạo connection pool tối đa 10 kết nối.
- Đọc cấu hình MySQL an toàn từ `.env` ở thư mục gốc.
- Kiểm tra kết nối database trước khi Express mở cổng.
- Thêm endpoint `GET /health/database`.
- Đóng connection pool khi backend dừng.
- Chạy typecheck, build và kiểm thử kết nối MySQL thật thành công.

Kết quả:

- API status: `ok`.
- Database status: `ok`.
- Database: `cinebook`.
- MySQL: `8.0.46`.

Trạng thái: **Hoàn thành**.

## PHẦN 7 đã hoàn thành

Đã thực hiện:

- Tạo package backend độc lập trong thư mục `backend`.
- Tách Express app, server và cấu hình biến môi trường.
- Thêm endpoint gốc, health check và phản hồi 404.
- Thêm các lệnh `dev`, `typecheck`, `build` và `start`.
- Cài dependency với kết quả npm audit 0 lỗ hổng.
- Chạy typecheck, build và kiểm thử HTTP thực tế thành công.

Trạng thái: **Hoàn thành**.

## PHẦN 4 đã hoàn thành

Đã học:

- File trong `src/app` trở thành route.
- `index.tsx` là route mặc định của thư mục.
- `_layout.tsx` định nghĩa cấu trúc điều hướng.
- File ngoài `src/app` không tự tạo route.

Đã thực hiện:

- Đã tạo `src/app/movies.tsx` cho route `/movies`.
- Đã thêm `Link` từ Trang chủ đến `/movies` và liên kết quay về `/`.
- Đã kiểm tra thao tác đi tới và quay lại trên iPhone.
- TypeScript kiểm tra thành công.

Trạng thái: **Hoàn thành**.

## PHẦN 6 đã hoàn thành

Đã thực hiện:

- Tạo và kiểm tra cấu hình Docker Compose cho MySQL 8.4.
- Cấu hình named volume, healthcheck và biến môi trường development.
- Xác nhận `.env` không xuất hiện trong Git.
- Xác định lỗi tải image xuất phát khi ổ C gần hết dung lượng.
- Gỡ Docker Desktop, distro `docker-desktop` và các thư mục dữ liệu Docker còn sót.
- Giải phóng dung lượng ổ C từ gần 0 GB lên khoảng 8,86 GB.

Kết quả:

- Sử dụng MySQL Community Server `8.0.46` đã có trên Windows.
- Dịch vụ `MySQL80` đang chạy tự động.
- Database `cinebook` dùng `utf8mb4` và `utf8mb4_unicode_ci`.
- Tài khoản `cinebook_user@localhost` kết nối thành công qua `127.0.0.1:3306`.
- Tài khoản ứng dụng đã được kiểm tra quyền tạo và xóa bảng trong `cinebook`.
- Cấu hình Docker đã được xóa khỏi repository theo lựa chọn tiếp tục với MySQL cài trực tiếp.

Trạng thái: **Hoàn thành**.

## PHẦN 5 đã hoàn thành

Đã thực hiện:

- Tải và chạy image `hello-world`.
- Quan sát container ở trạng thái `Exited (0)`.
- Phân biệt `docker run` và `docker start`.
- Đọc lịch sử output bằng `docker logs`.
- Xóa container và image thử nghiệm sau khi kiểm tra.
- Hiểu vai trò cơ bản của image, container, volume, network, port, Dockerfile, Docker Compose và biến môi trường.

Trạng thái: **Hoàn thành**.

## Bổ sung – Tối ưu giao diện

- Trang chủ có banner responsive, lối tắt lịch chiếu/vé/yêu thích và khung nội dung tối đa 1.180px.
- Danh sách phim chuyển sang hai cột từ 900px; cải thiện tìm kiếm, bộ lọc và độ tương phản.
- Poster có fallback khi tải lỗi; đăng nhập có nhãn, hiện/ẩn mật khẩu, tránh bàn phím che form.
- TypeScript, ESLint và export web 14 route đạt. Chưa xác minh trực quan do công cụ trình duyệt lỗi khởi tạo.

## Bổ sung – Giao diện quản trị (2026-09-24)

- [x] Route `/admin`, kiểm tra tài khoản ADMIN qua API; lối vào từ trang chủ cho quản trị viên.
- [x] Dashboard: người dùng, phim/rạp hoạt động, đặt vé, doanh thu và đơn gần đây.
- [x] Thêm/sửa/kích hoạt/ngừng hoạt động phim, rạp, phòng và ghế.
- [x] Tạo suất chiếu, chọn phim/phòng, giá thường/VIP, giờ Việt Nam; đổi trạng thái có xác nhận.
- [x] Xem/khóa/mở người dùng, xem đặt vé, ẩn/hiện đánh giá và xem audit log; danh sách phân trang.
- [x] Bố cục sidebar desktop/menu ngang mobile, form có nhãn, trạng thái tải/lỗi/rỗng, chặn lưu trùng.
- Kiểm tra: TypeScript, ESLint đạt; export web 15 route thành công; 11 API đọc dữ liệu với ADMIN trả thành công; kiểm tra form ngày/giờ/số nguyên đạt.
- Chưa kiểm thử trực quan trên browser/thiết bị (công cụ browser lỗi khởi tạo), chưa kiểm thử thao tác ghi qua UI. Chưa commit/push.

## Bổ sung – Carousel phim và ảnh bìa (2026-09-24)
- [x] Trang chủ và danh sách phim dùng carousel cuộn ngang, snap giữa; poster giữa lớn/rõ, hai bên nhỏ/mờ và nghiêng nhẹ.
- [x] Chỉ một khối thông tin của phim đang chọn, thời lượng/ngày khởi chiếu và nút Đặt vé; nút chuyển phim hỗ trợ web, giữ tìm kiếm/bộ lọc.
- [x] Ảnh bìa dưới carousel, có bìa vector mặc định và Admin → Ảnh bìa để đổi URL/tiêu đề, xem trước và lưu chung trong MySQL.
- [x] Migration SiteBanner đã áp dụng; API GET công khai, PUT chỉ ADMIN, kiểm tra URL http/https; bổ sung Swagger và test.
- Kiểm tra: TypeScript backend/mobile, ESLint, export web 15 route đạt; test API ảnh bìa với mock repository đạt; API thật GET /banner trả 200.
- Chưa kiểm thử cử chỉ và hình ảnh trên thiết bị/browser: công cụ browser lỗi khởi tạo. Chưa commit/push.

## Tinh chỉnh góc poster carousel (2026-09-24)
- Hai poster bên cạnh xoay vào tâm ±32°, khoảng cách tâm còn 88% chiều rộng poster để lộ góc ảnh.
- Poster phụ giữ scale 84%, opacity 72%, blur nhẹ 0,35; poster giữa nằm trên lớp trước, rõ nét.
- Giữ snap và thông tin phim đồng bộ theo bước cuộn mới. Chưa kiểm thử trực quan trên thiết bị.

## Carousel cuộn vòng (2026-09-24)
- [x] Phim cuối nối với phim đầu theo cả hai chiều, hỗ trợ vuốt và nút chuyển phim.
- Dùng các bản sao và đưa vị trí về vùng giữa sau khi dừng; giữ snap, hiệu ứng và thông tin đúng phim gốc. Danh sách một phim không lặp.
- TypeScript và ESLint đạt; chưa kiểm thử cử chỉ thực tế trên thiết bị. Chưa commit/push.

## Ba nhóm phim và thêm 10 phim mẫu (2026-09-24)
- [x] Thêm 10 phim hư cấu mẫu, không ghi đè phim cũ và không tạo suất chiếu tự động. Tổng 18 phim: 12 Đang chiếu, 3 Đặc biệt, 3 Sắp chiếu.
- [x] Trang chủ và danh sách phim hiển thị ba tab ngang như mẫu; mỗi nhóm dùng carousel cuộn vòng, tìm kiếm giữ nguyên.
- [x] MySQL lưu category; Admin thêm/sửa được Nhóm phim. API trả category và hỗ trợ lọc theo category; cập nhật Swagger.
- TypeScript backend/mobile, ESLint đạt; API thực tế lọc đúng ba nhóm. Chưa kiểm thử trực quan trên thiết bị; chưa commit/push.

## Bố cục thông tin phim và nhấn poster (2026-09-24)
- Bỏ liên kết chữ Chi tiết phim; nhấn bất kỳ poster nào mở chi tiết đúng phim đó.
- Theo mô tả bằng chữ của người dùng: nút Đặt vé bên trái, tên phim 16px/thông tin 12px căn phải; giữ xuống dòng cho tên dài.
- TypeScript và ESLint đạt; chưa kiểm thử trực quan trên thiết bị. Chưa commit/push.

## Thu gọn hàng thông tin phim (2026-09-24)
- Tên phim/thông tin nằm một dòng bên trái, nút Đặt vé nhỏ bên phải; tên 12px, thông tin 11px, chữ nút 12px. Nội dung dài rút gọn bằng dấu …, nhãn trợ năng giữ đủ thông tin.
- TypeScript/ESLint đạt; chưa kiểm thử trực quan; chưa commit/push.

## Chỉnh thông tin phim theo ảnh tham chiếu (2026-09-24)
- Tên phim in hoa/đậm bên trái, thời lượng và ngày chiếu nghiêng ở dòng dưới; nút Đặt Vé đỏ viền trắng bo tròn bên phải.
- Bỏ hàng mũi tên/số thứ tự dưới poster; giữ vuốt vòng và nhấn poster mở chi tiết.
- TypeScript/ESLint đạt sau khi chỉnh JSX. Chưa đối chiếu trực quan trên thiết bị, chưa commit/push.

## Chọn ảnh cục bộ cho poster và ảnh bìa (2026-09-24)
- [x] Admin có nút Chọn ảnh từ máy, xem trước và tải lên backend cho poster/ảnh bìa; vẫn hỗ trợ URL. Bấm Lưu để áp dụng.
- [x] Upload chỉ ADMIN; kiểm tra nội dung JPG/PNG/WebP tối đa 5 MB và 40 MP, xoay/thu gọn tối đa 1920px, chuyển JPEG và đặt tên UUID.
- [x] Lưu tại backend/uploads (không đưa vào Git); lưu đường dẫn tương đối và mở ảnh theo backend hiện tại để dùng chung web/điện thoại.
- TypeScript backend/mobile, ESLint đạt; kiểm thử tải lên/đọc ảnh thật và phân quyền đạt, ảnh test được xóa; export web 15 route đạt.
- Chưa kiểm thử hộp chọn ảnh thực tế trên iPhone/browser; chưa commit/push. Ảnh đã upload nhưng chưa lưu form vẫn nằm trên backend.

## Nhiều nhóm phim, background và autoplay (2026-09-30)
- [x] Một phim chọn được 1–3 nhóm trong Admin; cùng xuất hiện ở các tab đã chọn. Migration bảo toàn nhóm cũ; giữ category cho client/seed cũ.
- [x] Admin → Ảnh bìa có mục Ảnh nền phía sau poster: chọn ảnh máy hoặc nhập URL, lưu độc lập với bìa bên dưới.
- [x] Carousel tự chuyển sau 5 giây không tương tác; dừng khi kéo, app/tab không hoạt động hoặc rời màn hình; không autoplay khi chỉ có một phim hoặc bật giảm chuyển động.
- Kiểm tra TypeScript backend/mobile và ESLint đạt; kiểm tra MySQL create/update/filter nhiều nhóm bằng bản ghi tạm đạt và đã xóa; test API ảnh nền đạt. Chưa kiểm thử trực quan/cử chỉ do browser không khởi tạo được; chưa commit/push.
