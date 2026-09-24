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
const rooms = cinemas.flatMap((cinema, cinemaIndex) =>
  Array.from({ length: 5 }, (_, roomIndex) => ({
    id: 120001 + cinemaIndex * 5 + roomIndex,
    cinemaId: cinema.id,
    name: `Phòng mẫu ${roomIndex + 1}`,
  })),
);
const showtimes = [
  { id: 120001, movieId: 120001, roomId: 120001, startsAt: new Date("2026-09-20T18:00:00+07:00"), endsAt: new Date("2026-09-20T19:50:00+07:00") },
  { id: 120002, movieId: 120002, roomId: 120001, startsAt: new Date("2026-09-20T20:30:00+07:00"), endsAt: new Date("2026-09-20T22:10:00+07:00") },
  { id: 120003, movieId: 120002, roomId: 120002, startsAt: new Date("2026-09-20T18:00:00+07:00"), endsAt: new Date("2026-09-20T19:40:00+07:00") },
  { id: 120004, movieId: 120001, roomId: 120002, startsAt: new Date("2026-09-20T20:30:00+07:00"), endsAt: new Date("2026-09-20T22:20:00+07:00") },
];
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

// Giữ nguyên bốn suất cũ; bổ sung hai suất cho mỗi phòng mới.
for (const [index, room] of rooms.slice(2).entries()) {
  showtimes.push(
    { id: 120005 + index * 2, movieId: 120001, roomId: room.id, startsAt: new Date("2026-09-20T18:00:00+07:00"), endsAt: new Date("2026-09-20T19:50:00+07:00") },
    { id: 120006 + index * 2, movieId: 120002, roomId: room.id, startsAt: new Date("2026-09-20T20:30:00+07:00"), endsAt: new Date("2026-09-20T22:10:00+07:00") },
  );
}

export async function seedSampleData(tx: Prisma.TransactionClient): Promise<void> {
  await tx.voucher.createMany({ data: vouchers, skipDuplicates: true });
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
      Array.from({ length: 8 }, (_, index) => ({
        roomId: room.id, rowLabel, seatNumber: index + 1,
        type: rowLabel === "E" ? "VIP" as const : "STANDARD" as const,
      })),
    );
    await tx.seat.createMany({ data: seats, skipDuplicates: true });
  }
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
      roomId: showtime.roomId, rowLabel: { in: ["A", "B", "C", "D", "E"] },
      seatNumber: { gte: 1, lte: 8 },
    } });
    assert.equal(seats.length, 40, "Phòng mẫu phải có 40 ghế.");
    // Chỉ thêm dòng còn thiếu: không reset trạng thái, giá hoặc chủ sở hữu ghế cũ.
    await tx.showtimeSeat.createMany({
      data: seats.map(seat => ({ showtimeId: showtime.id, seatId: seat.id, price: seat.type === "VIP" ? "100000" : "80000" })),
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
    prisma.seat.count({ where: { roomId: { in: rooms.map(r => r.id) }, rowLabel: { in: ["A", "B", "C", "D", "E"] }, seatNumber: { gte: 1, lte: 8 } } }),
    prisma.showtime.count({ where: { id: { in: showtimes.map(s => s.id) } } }),
    prisma.showtimeSeat.count({ where: { showtimeId: { in: showtimes.map(s => s.id) } } }),
    prisma.concessionProduct.count({ where: { id: { in: concessions.map(item => item.id) } } }),
    prisma.voucher.count({ where: { id: { in: vouchers.map(item => item.id) } } }),
  ]);
  console.log("Seed CineBook v1: phim / rạp / phòng / ghế / suất / ghế theo suất / bắp nước / voucher");
  console.log(counts.join(" / "));
  console.log("Ngày mẫu: 20/09/2026, giờ Việt Nam. Giữ nguyên bản ghi đã tồn tại.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error("Seed thất bại:", error instanceof Error ? error.message : "Lỗi không xác định");
    process.exitCode = 1;
  }).finally(() => prisma.$disconnect());
}
