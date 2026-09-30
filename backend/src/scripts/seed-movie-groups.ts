import { prisma } from "../database/prisma.js";
import type { MovieCategory } from "../generated/prisma/client.js";

// Fictional catalog additions. This seed does not create or change showtimes.
const samples: { id: number; title: string; category: MovieCategory; durationMinutes: number; releaseDate: Date; synopsis: string }[] = [
  [130001, "Thành phố sau cơn mưa", "NOW_SHOWING", 108, "2026-09-04", "Một nhiếp ảnh gia tìm lại ký ức qua những con phố sau mùa mưa."],
  [130002, "Mật mã đường chân trời", "NOW_SHOWING", 122, "2026-09-11", "Nhóm bạn giải mã tín hiệu lạ từ một trạm quan sát bỏ hoang."],
  [130003, "Nhà có ba thế hệ", "NOW_SHOWING", 102, "2026-09-18", "Ba thế hệ cùng chung mái nhà học cách lắng nghe và thấu hiểu nhau."],
  [130004, "Hành trình của Mây", "NOW_SHOWING", 95, "2026-09-20", "Cô bé Mây và chú mèo máy khám phá một hòn đảo biết bay."],
  [130005, "Bản giao hưởng ánh sáng", "SPECIAL", 115, "2026-08-15", "Một nghệ sĩ trẻ mang âm nhạc trở lại nhà hát cũ của quê hương."],
  [130006, "Chuyến chiếu lúc nửa đêm", "SPECIAL", 99, "2026-08-22", "Buổi chiếu đặc biệt kết nối những khán giả xa lạ bằng một bí mật."],
  [130007, "Dưới bầu trời sao", "SPECIAL", 118, "2026-09-01", "Hai người bạn thực hiện chuyến đi cuối cùng trước khi trưởng thành."],
  [130008, "Hành tinh thứ chín", "COMING_SOON", 128, "2026-10-16", "Đoàn thám hiểm nhận được tín hiệu cầu cứu ngoài rìa hệ Mặt Trời."],
  [130009, "Tết ở trạm không gian", "COMING_SOON", 106, "2026-11-20", "Các phi hành gia tổ chức một cái Tết bất ngờ giữa những vì sao."],
  [130010, "Người giữ mùa đông", "COMING_SOON", 112, "2026-12-11", "Người giữ ngọn hải đăng đi tìm mùa đông đã biến mất khỏi thị trấn."],
].map(row => ({ id: Number(row[0]), title: String(row[1]), category: row[2] as MovieCategory, durationMinutes: Number(row[3]), releaseDate: new Date(`${row[4]}T00:00:00Z`), synopsis: `Phim hư cấu dùng để học lập trình CineBook. ${row[5]}` }));

try {
  await prisma.$transaction(async tx => {
    for (const movie of samples) {
      const existing = await tx.movie.findUnique({ where: { id: movie.id } });
      if (existing && existing.title !== movie.title) throw new Error(`ID ${movie.id} đã thuộc phim khác; không ghi đè.`);
    }
    const created = await tx.movie.createMany({ data: samples, skipDuplicates: true });
    console.log(`Đã thêm ${created.count} phim mẫu (chạy lại không tạo trùng).`);
  });
  console.log(await prisma.movie.groupBy({ by: ["category"], where: { isActive: true }, _count: { _all: true } }));
} finally { await prisma.$disconnect(); }
