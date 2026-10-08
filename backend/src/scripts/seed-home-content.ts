import { prisma } from "../database/prisma.js";

const items = [
  { id: 120001, section: "BANNER" as const, title: "Tu\u1ea7n l\u1ec5 \u0111i\u1ec7n \u1ea3nh CineBook", subtitle: "Kh\u00e1m ph\u00e1 nh\u1eefng b\u1ed9 phim n\u1ed5i b\u1eadt \u0111ang ch\u1edd b\u1ea1n t\u1ea1i r\u1ea1p.", imageUrl: "/assets/home-content/banner-cinema-week.jpg", linkUrl: "/movies", badge: "N\u1ed4I B\u1eacT", displayStyle: "HERO" as const, sortOrder: 1 },
  { id: 120002, section: "BANNER" as const, title: "\u0110\u1eb7t v\u00e9 s\u1edbm, ch\u1ecdn gh\u1ebf \u0111\u1eb9p", subtitle: "L\u1ecbch chi\u1ebfu m\u1edbi \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt m\u1ed7i ng\u00e0y.", imageUrl: "/assets/home-content/banner-best-seats.jpg", linkUrl: "/movies", badge: null, displayStyle: "CARD" as const, sortOrder: 2 },
  { id: 120003, section: "HOT_NEWS" as const, title: "Phim m\u1edbi \u0111\u00e3 l\u00ean l\u1ecbch", subtitle: "Xem l\u1ecbch chi\u1ebfu v\u00e0 gi\u1eef ch\u1ed7 ngay tr\u00ean CineBook.", imageUrl: "/assets/home-content/hot-new-showtimes.jpg", linkUrl: "/movies", badge: "TIN M\u1edaI", displayStyle: "CARD" as const, sortOrder: 1 },
  { id: 120004, section: "HOT_NEWS" as const, title: "Tr\u1ea3i nghi\u1ec7m h\u00e0ng gh\u1ebf gi\u1eefa", subtitle: "\u0110\u1eb7t s\u1edbm \u0111\u1ec3 c\u00f3 g\u00f3c nh\u00ecn \u0111\u1eb9p nh\u1ea5t.", imageUrl: "/assets/home-content/hot-center-seats.jpg", linkUrl: "/movies", badge: null, displayStyle: "CARD" as const, sortOrder: 2 },
  { id: 120005, section: "VOUCHER" as const, title: "Gi\u1ea3m 10% \u0111\u01a1n v\u00e9", subtitle: "\u00c1p d\u1ee5ng m\u00e3 CINE10 cho \u0111\u01a1n \u0111\u1ee7 \u0111i\u1ec1u ki\u1ec7n.", imageUrl: "/assets/home-content/voucher-cine10.jpg", linkUrl: "/movies", badge: "CINE10", displayStyle: "SQUARE" as const, sortOrder: 1 },
  { id: 120006, section: "VOUCHER" as const, title: "Gi\u1ea3m ngay 20.000\u0111", subtitle: "D\u00f9ng m\u00e3 GIAM20K cho \u0111\u01a1n t\u1eeb 150.000\u0111.", imageUrl: "/assets/home-content/voucher-giam20k.jpg", linkUrl: "/movies", badge: "GIAM20K", displayStyle: "SQUARE" as const, sortOrder: 2 },
  { id: 120007, section: "PARTNER_PROMOTION" as const, title: "\u01afu \u0111\u00e3i thanh to\u00e1n \u0111\u1ed1i t\u00e1c", subtitle: "Nh\u1eadn \u01b0u \u0111\u00e3i khi thanh to\u00e1n theo ch\u01b0\u01a1ng tr\u00ecnh li\u00ean k\u1ebft.", imageUrl: "/assets/home-content/partner-payment.jpg", linkUrl: "/movies", badge: "\u0110\u1ed0I T\u00c1C", displayStyle: "HERO" as const, sortOrder: 1 },
  { id: 120008, section: "PARTNER_PROMOTION" as const, title: "Combo xem phim cu\u1ed1i tu\u1ea7n", subtitle: "Ch\u1ecdn phim, gh\u1ebf v\u00e0 b\u1eafp n\u01b0\u1edbc trong m\u1ed9t l\u1ea7n \u0111\u1eb7t.", imageUrl: "/assets/home-content/partner-weekend-combo.jpg", linkUrl: "/movies", badge: "CU\u1ed0I TU\u1ea6N", displayStyle: "CARD" as const, sortOrder: 2 },
];

Promise.all(items.map(item => prisma.homeContentItem.upsert({ where: { id: item.id }, create: item, update: item })))
  .then(result => console.log(`Home content ready: ${result.length} item(s) synchronized.`))
  .finally(() => prisma.$disconnect());
