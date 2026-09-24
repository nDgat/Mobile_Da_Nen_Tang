export interface Movie {
  id: number;
  title: string;
  synopsis: string | null;
  durationMinutes: number;
  releaseDate: string;
  posterUrl: string | null;
  isActive: boolean;
}

export interface Showtime {
  id: number;
  movieId: number;
  roomId: number;
  startsAt: string;
  endsAt: string;
  status: "SCHEDULED" | "CANCELLED" | "FINISHED";
}

export interface Room { id: number; cinemaId: number; name: string; isActive: boolean; }
export interface Cinema { id: number; name: string; address: string; city: string; isActive: boolean; }

export interface ShowtimeSeat {
  id: number;
  seatId: number;
  rowLabel: string;
  seatNumber: number;
  type: "STANDARD" | "VIP";
  price: string;
  status: "AVAILABLE" | "HELD" | "BOOKED";
}

export interface SeatMap {
  showtime: Showtime;
  movie: { id: number; title: string };
  room: { id: number; name: string };
  cinema: { id: number; name: string };
  seats: ShowtimeSeat[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshExpiresIn: number;
  user: { id: number; email: string; fullName: string; role: "CUSTOMER" | "ADMIN" };
}

export interface SeatHold {
  id: number;
  code: string;
  status: "PENDING";
  showtimeId: number;
  expiresAt: string;
  totalAmount: string;
  seats: { id: number; label: string; price: string }[];
}

export interface BookingDetails {
  id: number;
  code: string;
  status: "PENDING" | "AWAITING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  showtimeId: number;
  expiresAt: string;
  confirmedAt: string | null;
  totalAmount: string;
  createdAt: string;
  movie: { id: number; title: string; posterUrl: string | null; durationMinutes: number };
  cinema: { id: number; name: string; address: string; city: string };
  room: { id: number; name: string };
  showtime: { id: number; startsAt: string; endsAt: string };
  seats: { id: number; label: string; price: string }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
