import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";

const DAYS = 10;
const TIMES = ["09:00", "12:30", "16:00", "19:30"] as const;

function bangkokDateAfter(days: number): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(Date.now() + days * 86_400_000));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function hasNowShowingLabel(movie: { category: string; categories: unknown }): boolean {
  if (Array.isArray(movie.categories)) return movie.categories.includes("NOW_SHOWING");
  return movie.category === "NOW_SHOWING";
}

function priceFor(type: "STANDARD" | "VIP" | "SWEETBOX", startsAt: Date): string {
  const weekday = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
  }).format(startsAt);
  const weekend = weekday === "Sat" || weekday === "Sun";
  if (type === "SWEETBOX") return weekend ? "210000" : "190000";
  if (type === "VIP") return weekend ? "125000" : "110000";
  return weekend ? "95000" : "85000";
}

async function main(): Promise<void> {
  if (env.nodeEnv !== "development" || env.database.name !== "cinebook" ||
      !["127.0.0.1", "localhost"].includes(env.database.host)) {
    throw new Error("Script l\u1ecbch chi\u1ebfu ch\u1ec9 \u0111\u01b0\u1ee3c ch\u1ea1y v\u1edbi database cinebook local trong development.");
  }

  const [allMovies, rooms] = await Promise.all([
    prisma.movie.findMany({
      where: { isActive: true },
      select: { id: true, title: true, durationMinutes: true, category: true, categories: true },
      orderBy: { id: "asc" },
    }),
    prisma.room.findMany({
      where: { isActive: true, seats: { some: { isActive: true } } },
      select: {
        id: true,
        cinemaId: true,
        name: true,
        seats: {
          where: { isActive: true },
          select: { id: true, type: true },
          orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
        },
      },
      orderBy: [{ cinemaId: "asc" }, { id: "asc" }],
    }),
  ]);
  const movies = allMovies.filter(hasNowShowingLabel);
  if (movies.length === 0) throw new Error("Kh\u00f4ng c\u00f3 phim ho\u1ea1t \u0111\u1ed9ng mang nh\u00e3n NOW_SHOWING.");
  if (rooms.length === 0) throw new Error("Kh\u00f4ng c\u00f3 ph\u00f2ng ho\u1ea1t \u0111\u1ed9ng c\u00f3 gh\u1ebf.");

  const rangeStart = new Date(`${bangkokDateAfter(1)}T00:00:00+07:00`);
  const rangeEnd = new Date(`${bangkokDateAfter(DAYS + 1)}T00:00:00+07:00`);
  const existing = await prisma.showtime.findMany({
    where: { roomId: { in: rooms.map(room => room.id) }, status: { not: "CANCELLED" }, startsAt: { lt: rangeEnd }, endsAt: { gt: rangeStart } },
    select: { roomId: true, startsAt: true, endsAt: true },
  });
  const schedule = [];
  for (let dayIndex = 0; dayIndex < DAYS; dayIndex++) {
    const date = bangkokDateAfter(dayIndex + 1);
    for (let roomIndex = 0; roomIndex < rooms.length; roomIndex++) {
      const room = rooms[roomIndex]!;
      for (let slotIndex = 0; slotIndex < TIMES.length; slotIndex++) {
        const movie = movies[(dayIndex * TIMES.length + roomIndex + slotIndex) % movies.length]!;
        const startsAt = new Date(`${date}T${TIMES[slotIndex]}:00+07:00`);
        const endsAt = new Date(startsAt.getTime() + movie.durationMinutes * 60_000);
        const overlaps = existing.some(item => item.roomId === room.id && item.startsAt < endsAt && item.endsAt > startsAt);
        if (!overlaps) schedule.push({ movieId: movie.id, roomId: room.id, startsAt, endsAt, status: "SCHEDULED" as const });
      }
    }
  }

  const created = await prisma.showtime.createMany({ data: schedule, skipDuplicates: true });
  const showtimes = await prisma.showtime.findMany({
    where: { roomId: { in: rooms.map(room => room.id) }, startsAt: { gte: rangeStart, lt: rangeEnd } },
    select: { id: true, roomId: true, startsAt: true },
  });
  const roomSeats = new Map(rooms.map(room => [room.id, room.seats]));
  const showtimeSeats = showtimes.flatMap(showtime =>
    (roomSeats.get(showtime.roomId) ?? []).map(seat => ({
      showtimeId: showtime.id,
      seatId: seat.id,
      price: priceFor(seat.type, showtime.startsAt),
    })),
  );

  let createdSeats = 0;
  for (let index = 0; index < showtimeSeats.length; index += 5000) {
    const result = await prisma.showtimeSeat.createMany({
      data: showtimeSeats.slice(index, index + 5000),
      skipDuplicates: true,
    });
    createdSeats += result.count;
  }

  const byMovie = await prisma.showtime.groupBy({
    by: ["movieId"],
    where: { startsAt: { gte: rangeStart, lt: rangeEnd }, roomId: { in: rooms.map(room => room.id) } },
    _count: { _all: true },
    orderBy: { movieId: "asc" },
  });
  const movieNames = new Map(movies.map(movie => [movie.id, movie.title]));

  console.log(`L\u1ecbch ${DAYS} ng\u00e0y: ${created.count} su\u1ea5t m\u1edbi, ${showtimes.length} su\u1ea5t trong kho\u1ea3ng, ${createdSeats} gh\u1ebf theo su\u1ea5t m\u1edbi.`);
  for (const item of byMovie) console.log(`- ${movieNames.get(item.movieId) ?? item.movieId}: ${item._count._all} su\u1ea5t`);
}

main()
  .catch(error => {
    console.error("T\u1ea1o l\u1ecbch chi\u1ebfu th\u1ea5t b\u1ea1i:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => { await prisma.$disconnect(); });
