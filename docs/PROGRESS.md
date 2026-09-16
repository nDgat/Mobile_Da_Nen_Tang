# Tiến độ xây dựng CineBook

Cập nhật lần cuối: 2026-09-16

## Tổng quan

- Hoàn thành: **14/54 phần (25,9%)**
- Đang thực hiện: **PHẦN 15 – CRUD rạp**.
- Bước tiếp theo: chạy và xác nhận các API CRUD rạp.

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
- [-] PHẦN 15 – CRUD rạp
- [ ] PHẦN 16 – CRUD phòng chiếu
- [ ] PHẦN 17 – CRUD ghế
- [ ] PHẦN 18 – Quản lý suất chiếu
- [ ] PHẦN 19 – Đăng ký tài khoản
- [ ] PHẦN 20 – Đăng nhập JWT
- [ ] PHẦN 21 – Refresh Token
- [ ] PHẦN 22 – Phân quyền
- [ ] PHẦN 23 – App Home
- [ ] PHẦN 24 – Danh sách phim
- [ ] PHẦN 25 – Chi tiết phim
- [ ] PHẦN 26 – Chọn rạp
- [ ] PHẦN 27 – Chọn ngày và suất chiếu
- [ ] PHẦN 28 – Sơ đồ ghế
- [ ] PHẦN 29 – Giữ ghế
- [ ] PHẦN 30 – Đặt vé
- [ ] PHẦN 31 – Tính tiền
- [ ] PHẦN 32 – Bắp nước
- [ ] PHẦN 33 – Voucher
- [ ] PHẦN 34 – Payment Mock
- [ ] PHẦN 35 – QR Code
- [ ] PHẦN 36 – Vé điện tử
- [ ] PHẦN 37 – Lịch sử đặt vé
- [ ] PHẦN 38 – Notification
- [ ] PHẦN 39 – Review
- [ ] PHẦN 40 – Favorite
- [ ] PHẦN 41 – Admin API
- [ ] PHẦN 42 – Validation
- [ ] PHẦN 43 – Error Handling
- [ ] PHẦN 44 – Logging
- [ ] PHẦN 45 – Audit Log
- [ ] PHẦN 46 – Swagger
- [ ] PHẦN 47 – Unit Test
- [ ] PHẦN 48 – Integration Test
- [ ] PHẦN 49 – Dockerize Backend
- [ ] PHẦN 50 – Docker Compose hoàn chỉnh
- [ ] PHẦN 51 – Kết nối Expo Go với Docker
- [ ] PHẦN 52 – Kiểm thử Android
- [ ] PHẦN 53 – Kiểm thử iOS
- [ ] PHẦN 54 – Tối ưu và hoàn thiện

## Kết quả đã xác minh

### Seed dữ liệu

- Người học đã chạy `npm run db:seed` thành công.
- 8 phim, 3 rạp, mỗi rạp 5 phòng: tổng 15 phòng, 600 ghế, 30 suất và 1200 ghế theo suất.
- Lịch mẫu ngày 20/09/2026 thuộc 2 phim demo; 6 phim thật bổ sung chưa có suất.

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
- Đã chuẩn bị API học tập tại `/api/v1/examples` theo Route → Controller → Service
- Agent đã xác minh HTTP `200`, `201`, `400`, `404`; chờ người học tự chạy và xác nhận

## PHẦN 15 đang thực hiện

Đã chuẩn bị:

- CRUD rạp tại `/api/v1/cinemas`.
- Danh sách có phân trang, lọc `active` và tìm theo `city`.
- Luồng Route → Controller → Service → Repository → Prisma → MySQL.
- `DELETE` dùng xóa mềm để giữ nguyên phòng và dữ liệu lịch sử.

Trạng thái: **Đang thực hiện**. Chờ kiểm tra kỹ thuật và người học xác nhận.

Kết quả kỹ thuật:

- Typecheck và build thành công.
- Kiểm thử MySQL thật đạt: list `200`, create `201`, detail `200`, update `200`, delete `204`, validation `400`, không tồn tại `404`.
- Xóa mềm đổi đúng `isActive=false`.
- Rạp kiểm thử đã được xóa vật lý sau kiểm tra; seed vẫn giữ 3 rạp và 15 phòng.
- Chờ người học thực hành theo `docs/CINEMA_CRUD.md`.

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
- Các file cấu hình Docker trong repository được giữ lại như tài liệu của phần đã thực hành; chúng không chiếm đáng kể dung lượng và không tự chạy.

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
