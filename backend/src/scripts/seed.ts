import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import { realMovieSamples } from "./movie-samples.js";

// ID cố định dành cho bộ mẫu v1; kiểm tra xung đột trước khi commit.
const movies = [
  { id: 120001, title: "CineBook Demo – Chuyến tàu bình minh", durationMinutes: 110 },
  { id: 120002, title: "CineBook Demo – Bí mật đảo xanh", durationMinutes: 100 },
  ...realMovieSamples,
];
const cinemas = [{
  id: 120001, name: "CineBook Demo", city: "Hồ Chí Minh",
  address: "Địa chỉ hư cấu phục vụ học tập",
}, {
  id: 120002, name: "CineBook Demo Hà Nội", city: "Hà Nội",
  address: "Địa chỉ hư cấu phục vụ học tập",
}, {
  id: 120003, name: "CineBook Demo Đà Nẵng", city: "Đà Nẵng",
  address: "Địa chỉ hư cấu phục vụ học tập",
}];
const roomNames = ["Phòng 01 Standard", "Phòng 02 Premium", "Phòng 03 Couple", "Phòng 04 IMAX", "Phòng 05 ScreenX"];
const rooms = cinemas.flatMap((cinema, cinemaIndex) =>
  Array.from({ length: 5 }, (_, roomIndex) => ({
    id: 120001 + cinemaIndex * 5 + roomIndex,
    cinemaId: cinema.id,
    name: roomNames[roomIndex]!,
  })),
);
function bangkokDateAfter(days: number): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(Date.now() + days * 86_400_000));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

const sampleDate = bangkokDateAfter(1);
const showtimeIdBase = Number(sampleDate.replaceAll("-", "")) * 100;
const atSampleTime = (time: string) => new Date(`${sampleDate}T${time}:00+07:00`);
const showtimes = rooms.flatMap((room, index) => [
  { id: showtimeIdBase + index * 2 + 1, movieId: 120001, roomId: room.id, startsAt: atSampleTime("18:00"), endsAt: atSampleTime("19:50") },
  { id: showtimeIdBase + index * 2 + 2, movieId: 120002, roomId: room.id, startsAt: atSampleTime("20:30"), endsAt: atSampleTime("22:10") },
]);
const concessions = [
  { id: 120001, name: "Bắp rang bơ cỡ vừa", description: "Bắp rang bơ truyền thống", category: "POPCORN" as const, price: "45000", sortOrder: 1 },
  { id: 120002, name: "Bắp caramel cỡ lớn", description: "Bắp phủ caramel cỡ lớn", category: "POPCORN" as const, price: "65000", sortOrder: 2 },
  { id: 120003, name: "Pepsi cỡ vừa", description: "Nước ngọt có ga 500 ml", category: "DRINK" as const, price: "30000", sortOrder: 3 },
  { id: 120004, name: "Combo Solo", description: "1 bắp vừa và 1 nước vừa", category: "COMBO" as const, price: "79000", sortOrder: 4 },
  { id: 120005, name: "Combo Couple", description: "1 bắp lớn và 2 nước vừa", category: "COMBO" as const, price: "129000", sortOrder: 5 },
];
const vouchers = [
  { id: 120001, code: "CINE10", name: "Giảm 10%", description: "Giảm 10%, tối đa 50.000đ", discountType: "PERCENTAGE" as const, discountValue: "10", minOrderAmount: "100000", maxDiscountAmount: "50000", startsAt: new Date("2026-01-01T00:00:00+07:00"), endsAt: new Date("2027-12-31T23:59:59+07:00"), usageLimit: 1000 },
  { id: 120002, code: "GIAM20K", name: "Giảm 20.000đ", description: "Áp dụng cho đơn từ 150.000đ", discountType: "FIXED" as const, discountValue: "20000", minOrderAmount: "150000", maxDiscountAmount: null, startsAt: new Date("2026-01-01T00:00:00+07:00"), endsAt: new Date("2027-12-31T23:59:59+07:00"), usageLimit: 1000 },
  { id: 120003, code: "COMBO15", name: "Giảm 15%", description: "Đơn từ 250.000đ, giảm tối đa 60.000đ", discountType: "PERCENTAGE" as const, discountValue: "15", minOrderAmount: "250000", maxDiscountAmount: "60000", startsAt: new Date("2026-01-01T00:00:00+07:00"), endsAt: new Date("2027-12-31T23:59:59+07:00"), usageLimit: 500 },
];

const homeContents = [
  { id: 120001, section: "BANNER" as const, title: "Tu\u1ea7n l\u1ec5 \u0111i\u1ec7n \u1ea3nh CineBook", subtitle: "Kh\u00e1m ph\u00e1 nh\u1eefng b\u1ed9 phim n\u1ed5i b\u1eadt \u0111ang ch\u1edd b\u1ea1n t\u1ea1i r\u1ea1p.", imageUrl: null, linkUrl: "/movies", badge: "N\u1ed4I B\u1eacT", displayStyle: "HERO" as const, sortOrder: 1 },
  { id: 120002, section: "BANNER" as const, title: "\u0110\u1eb7t v\u00e9 s\u1edbm, ch\u1ecdn gh\u1ebf \u0111\u1eb9p", subtitle: "L\u1ecbch chi\u1ebfu m\u1edbi \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt m\u1ed7i ng\u00e0y.", imageUrl: null, linkUrl: "/movies", badge: null, displayStyle: "CARD" as const, sortOrder: 2 },
  { id: 120003, section: "HOT_NEWS" as const, title: "Phim m\u1edbi \u0111\u00e3 l\u00ean l\u1ecbch", subtitle: "Xem l\u1ecbch chi\u1ebfu v\u00e0 gi\u1eef ch\u1ed7 ngay tr\u00ean CineBook.", imageUrl: null, linkUrl: "/movies", badge: "TIN M\u1edaI", displayStyle: "CARD" as const, sortOrder: 1 },
  { id: 120004, section: "HOT_NEWS" as const, title: "Tr\u1ea3i nghi\u1ec7m h\u00e0ng gh\u1ebf gi\u1eefa", subtitle: "\u0110\u1eb7t s\u1edbm \u0111\u1ec3 c\u00f3 g\u00f3c nh\u00ecn \u0111\u1eb9p nh\u1ea5t.", imageUrl: null, linkUrl: "/movies", badge: null, displayStyle: "CARD" as const, sortOrder: 2 },
  { id: 120005, section: "VOUCHER" as const, title: "Gi\u1ea3m 10% \u0111\u01a1n v\u00e9", subtitle: "\u00c1p d\u1ee5ng m\u00e3 CINE10 cho \u0111\u01a1n \u0111\u1ee7 \u0111i\u1ec1u ki\u1ec7n.", imageUrl: null, linkUrl: "/movies", badge: "CINE10", displayStyle: "SQUARE" as const, sortOrder: 1 },
  { id: 120006, section: "VOUCHER" as const, title: "Gi\u1ea3m ngay 20.000\u0111", subtitle: "D\u00f9ng m\u00e3 GIAM20K cho \u0111\u01a1n t\u1eeb 150.000\u0111.", imageUrl: null, linkUrl: "/movies", badge: "GIAM20K", displayStyle: "SQUARE" as const, sortOrder: 2 },
  { id: 120007, section: "PARTNER_PROMOTION" as const, title: "\u01afu \u0111\u00e3i thanh to\u00e1n \u0111\u1ed1i t\u00e1c", subtitle: "Nh\u1eadn \u01b0u \u0111\u00e3i khi thanh to\u00e1n theo ch\u01b0\u01a1ng tr\u00ecnh li\u00ean k\u1ebft.", imageUrl: null, linkUrl: "/movies", badge: "\u0110\u1ed0I T\u00c1C", displayStyle: "HERO" as const, sortOrder: 1 },
  { id: 120008, section: "PARTNER_PROMOTION" as const, title: "Combo xem phim cu\u1ed1i tu\u1ea7n", subtitle: "Ch\u1ecdn phim, gh\u1ebf v\u00e0 b\u1eafp n\u01b0\u1edbc trong m\u1ed9t l\u1ea7n \u0111\u1eb7t.", imageUrl: null, linkUrl: "/movies", badge: "CU\u1ed0I TU\u1ea6N", displayStyle: "CARD" as const, sortOrder: 2 },
];
export async function seedSampleData(tx: Prisma.TransactionClient): Promise<void> {
  await tx.voucher.createMany({ data: vouchers, skipDuplicates: true });
  await tx.homeContentItem.createMany({ data: homeContents, skipDuplicates: true });
  for (const voucher of vouchers) {
    const stored = await tx.voucher.findUniqueOrThrow({ where: { id: voucher.id } });
    assert.equal(stored.code, voucher.code, "ID voucher mẫu đã được sử dụng.");
    assert.equal(stored.discountValue.toString(), voucher.discountValue, "Giá trị voucher mẫu không khớp.");
  }
  await tx.concessionProduct.createMany({ data: concessions, skipDuplicates: true });
  for (const concession of concessions) {
    const stored = await tx.concessionProduct.findUniqueOrThrow({ where: { id: concession.id } });
    assert.equal(stored.name, concession.name, "ID bắp nước mẫu đã được sử dụng.");
    assert.equal(stored.price.toString(), concession.price, "Giá bắp nước mẫu không khớp.");
  }
  await tx.movie.createMany({
    data: movies.map(movie => ({ releaseDate: new Date("2026-09-01T00:00:00Z"), synopsis: "Phim hư cấu dùng để học lập trình CineBook.", ...movie })),
    skipDuplicates: true,
  });
  for (const movie of movies) {
    const stored = await tx.movie.findUniqueOrThrow({ where: { id: movie.id } });
    assert.equal(stored.title, movie.title, "ID phim mẫu đã được dùng cho phim khác.");
    assert.equal(stored.durationMinutes, movie.durationMinutes, "Thời lượng phim mẫu đã thay đổi; cần kiểm tra lịch.");
  }
  await tx.cinema.createMany({ data: cinemas, skipDuplicates: true });
  for (const cinema of cinemas) {
  const storedCinema = await tx.cinema.findUniqueOrThrow({ where: { id: cinema.id } });
  assert.equal(storedCinema.name, cinema.name, "ID rạp mẫu đã được sử dụng.");
  assert.equal(storedCinema.address, cinema.address, "Địa chỉ rạp mẫu không khớp.");
  }
  await tx.room.createMany({ data: rooms, skipDuplicates: true });
  for (const room of rooms) {
    const stored = await tx.room.findUniqueOrThrow({ where: { id: room.id } });
    assert.equal(stored.cinemaId, room.cinemaId, "Phòng không thuộc rạp mẫu.");
    assert.equal(stored.name, room.name, "ID phòng mẫu đã được sử dụng.");
    const seats = ["A", "B", "C", "D", "E"].flatMap(rowLabel =>
      Array.from({ length: rowLabel === "E" ? 4 : 8 }, (_, index) => ({
        roomId: room.id, rowLabel, seatNumber: index + 1,
        type: rowLabel === "E" ? "SWEETBOX" as const : ["C", "D"].includes(rowLabel) ? "VIP" as const : "STANDARD" as const,
      })),
    );
    await tx.seat.createMany({ data: seats, skipDuplicates: true });
    await tx.seat.updateMany({ where: { roomId: room.id, rowLabel: { in: ["A", "B"] }, seatNumber: { lte: 8 } }, data: { type: "STANDARD", isActive: true } });
    await tx.seat.updateMany({ where: { roomId: room.id, rowLabel: { in: ["C", "D"] }, seatNumber: { lte: 8 } }, data: { type: "VIP", isActive: true } });
    await tx.seat.updateMany({ where: { roomId: room.id, rowLabel: "E", seatNumber: { lte: 4 } }, data: { type: "SWEETBOX", isActive: true } });
    await tx.seat.updateMany({ where: { roomId: room.id, rowLabel: "E", seatNumber: { gt: 4 } }, data: { isActive: false } });
  }
  await tx.showtime.updateMany({ where: { startsAt: { lt: new Date() }, status: "SCHEDULED" }, data: { status: "FINISHED" } });
  await tx.showtime.createMany({ data: showtimes, skipDuplicates: true });
  for (const showtime of showtimes) {
    const stored = await tx.showtime.findUniqueOrThrow({ where: { id: showtime.id } });
    assert.equal(stored.roomId, showtime.roomId, "Suất mẫu không khớp phòng.");
    assert.equal(stored.movieId, showtime.movieId, "Suất mẫu không khớp phim.");
    assert.equal(stored.startsAt.getTime(), showtime.startsAt.getTime(), "Giờ suất mẫu đã thay đổi.");
    assert.equal(stored.endsAt.getTime(), showtime.endsAt.getTime(), "Giờ kết thúc suất mẫu đã thay đổi.");
    const overlap = await tx.showtime.count({ where: {
      roomId: showtime.roomId, id: { not: showtime.id }, status: { not: "CANCELLED" },
      startsAt: { lt: showtime.endsAt }, endsAt: { gt: showtime.startsAt },
    } });
    assert.equal(overlap, 0, "Có suất khác trùng lịch phòng mẫu.");
    const seats = await tx.seat.findMany({ where: {
      roomId: showtime.roomId, isActive: true, rowLabel: { in: ["A", "B", "C", "D", "E"] },
      seatNumber: { gte: 1, lte: 8 },
    } });
    assert.equal(seats.length, 36, "Phòng mẫu phải có 36 vị trí ghế hoạt động.");
    // Chỉ thêm dòng còn thiếu: không reset trạng thái, giá hoặc chủ sở hữu ghế cũ.
    await tx.showtimeSeat.createMany({
      data: seats.map(seat => ({ showtimeId: showtime.id, seatId: seat.id, price: seat.type === "SWEETBOX" ? "180000" : seat.type === "VIP" ? "100000" : "80000" })),
      skipDuplicates: true,
    });
  }
}

async function main(): Promise<void> {
  if (env.nodeEnv !== "development" || env.database.name !== "cinebook" ||
      !["127.0.0.1", "localhost"].includes(env.database.host)) {
    throw new Error("Seed mẫu chỉ được chạy với database cinebook trên máy local trong development.");
  }
  await prisma.$transaction(seedSampleData, { timeout: 30000 });
  const counts = await Promise.all([
    prisma.movie.count({ where: { id: { in: movies.map(m => m.id) } } }),
    prisma.cinema.count({ where: { id: { in: cinemas.map(c => c.id) } } }),
    prisma.room.count({ where: { id: { in: rooms.map(r => r.id) } } }),
    prisma.seat.count({ where: { roomId: { in: rooms.map(r => r.id) }, isActive: true, rowLabel: { in: ["A", "B", "C", "D", "E"] }, seatNumber: { gte: 1, lte: 8 } } }),
    prisma.showtime.count({ where: { id: { in: showtimes.map(s => s.id) } } }),
    prisma.showtimeSeat.count({ where: { showtimeId: { in: showtimes.map(s => s.id) } } }),
    prisma.concessionProduct.count({ where: { id: { in: concessions.map(item => item.id) } } }),
    prisma.voucher.count({ where: { id: { in: vouchers.map(item => item.id) } } }),
  ]);
  console.log("Seed CineBook v1: phim / rạp / phòng / ghế / suất / ghế theo suất / bắp nước / voucher");
  console.log(counts.join(" / "));
  console.log(`Ngày mẫu: ${sampleDate}, giờ Việt Nam. Suất cũ được giữ làm lịch sử.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error("Seed thất bại:", error instanceof Error ? error.message : "Lỗi không xác định");
    process.exitCode = 1;
  }).finally(() => prisma.$disconnect());
}
