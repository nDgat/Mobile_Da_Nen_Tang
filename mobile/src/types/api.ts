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
  pricing: BookingPricing;
  seats: { id: number; label: string; price: string }[];
}

export interface BookingPricing {
  seatSubtotal: string;
  serviceFee: string;
  concessionSubtotal: string;
  discountAmount: string;
  totalAmount: string;
}

export interface ConcessionProduct {
  id: number;
  name: string;
  description: string | null;
  category: "POPCORN" | "DRINK" | "COMBO";
  price: string;
  imageUrl: string | null;
}

export interface BookingConcessionItem {
  id: number;
  productId: number;
  name: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface Voucher {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string | null;
  startsAt?: string;
  endsAt?: string;
}

export interface Payment {
  id: number;
  code: string;
  provider: string;
  amount: string;
  status: "SUCCEEDED" | "FAILED" | "CANCELLED";
  failureReason: string | null;
  completedAt: string;
}

export interface MockPaymentResponse {
  payment: Payment;
  bookingStatus: "AWAITING_PAYMENT" | "CONFIRMED";
  idempotent: boolean;
}

export interface Ticket {
  bookingId: number;
  bookingCode: string;
  qrValue: string;
  holder: { fullName: string; email: string };
  movie: { id: number; title: string };
  cinema: { id: number; name: string; address: string; city: string };
  room: { id: number; name: string };
  showtime: { id: number; startsAt: string; endsAt: string };
  seats: string[];
  concessions: { name: string; quantity: number }[];
  voucherCode: string | null;
  totalAmount: string;
  confirmedAt: string | null;
  paymentCode: string | null;
}

export interface BookingDetails {
  id: number;
  code: string;
  status: "PENDING" | "AWAITING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  showtimeId: number;
  expiresAt: string;
  confirmedAt: string | null;
  totalAmount: string;
  pricing: BookingPricing;
  createdAt: string;
  movie: { id: number; title: string; posterUrl: string | null; durationMinutes: number };
  cinema: { id: number; name: string; address: string; city: string };
  room: { id: number; name: string };
  showtime: { id: number; startsAt: string; endsAt: string };
  seats: { id: number; label: string; price: string }[];
  concessions: BookingConcessionItem[];
  voucher: Voucher | null;
  latestPayment: Payment | null;
}

export type BookingStatus = "PENDING" | "AWAITING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "EXPIRED";

export interface BookingHistoryItem {
  id: number;
  code: string;
  status: BookingStatus;
  totalAmount: string;
  createdAt: string;
  confirmedAt: string | null;
  movie: { id: number; title: string; posterUrl: string | null };
  cinemaName: string;
  roomName: string;
  startsAt: string;
  seats: string[];
}

export interface AppNotification {
  id: number;
  userId: number;
  bookingId: number | null;
  type: "BOOKING_CONFIRMED" | "SHOWTIME_REMINDER" | "SYSTEM";
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  data: AppNotification[];
  meta: { page: number; limit: number; total: number; totalPages: number; unread: number };
}

export interface MovieReview {
  id: number;
  rating: number;
  comment: string | null;
  reviewerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPage {
  data: MovieReview[];
  meta: { page: number; limit: number; total: number; totalPages: number; averageRating: number };
}

export interface FavoriteItem {
  id: number;
  createdAt: string;
  movie: Movie;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
