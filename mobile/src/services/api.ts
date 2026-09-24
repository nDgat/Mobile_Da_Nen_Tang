import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import type { AuthSession, BookingDetails, BookingHistoryItem, BookingStatus, Cinema, ConcessionProduct, FavoriteItem, MockPaymentResponse, Movie, MovieReview, NotificationPage, PaginatedResponse, ReviewPage, Room, SeatHold, SeatMap, Showtime, Ticket, Voucher } from "../types/api";

const SESSION_KEY = "cinebook.auth.session";

type StoredSession = AuthSession & { accessExpiresAt: number };

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string, public requestId?: string, public details?: { field?: string; message: string; code?: string }[]) { super(message); }
}

function getApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configuredUrl) return configuredUrl;
  const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (metroHost) return `http://${metroHost}:3000/api/v1`;
  return "http://127.0.0.1:3000/api/v1";
}

async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { signal });
  if (!response.ok) throw new Error(`API phản hồi mã ${response.status}.`);
  return response.json() as Promise<T>;
}

async function apiJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init.headers } });
  const payload = await response.json().catch(() => null) as { error?: { code?: string; message?: string; requestId?: string; details?: { field?: string; message: string; code?: string }[] } } | null;
  if (!response.ok) throw new ApiError(response.status, payload?.error?.message ?? `API phản hồi mã ${response.status}.`, payload?.error?.code, payload?.error?.requestId, payload?.error?.details);
  return payload as T;
}

async function saveSession(session: AuthSession) {
  const stored: StoredSession = { ...session, accessExpiresAt: Date.now() + session.expiresIn * 1000 };
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(stored));
}

async function readSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as StoredSession; } catch { await SecureStore.deleteItemAsync(SESSION_KEY); return null; }
}

export async function hasSession() { return (await readSession()) !== null; }

export async function login(email: string, password: string) {
  const response = await apiJson<{ data: AuthSession }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  await saveSession(response.data);
  return response.data;
}

export async function registerAndLogin(fullName: string, email: string, password: string) {
  await apiJson("/auth/register", { method: "POST", body: JSON.stringify({ fullName, email, password }) });
  return login(email, password);
}

async function accessToken(): Promise<string | null> {
  const current = await readSession();
  if (!current) return null;
  if (current.accessExpiresAt > Date.now() + 30_000) return current.accessToken;
  try {
    const response = await apiJson<{ data: AuthSession }>("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken: current.refreshToken }) });
    await saveSession(response.data);
    return response.data.accessToken;
  } catch { await SecureStore.deleteItemAsync(SESSION_KEY); return null; }
}

async function authenticatedJson<T>(path: string, init: RequestInit = {}) {
  const token = await accessToken();
  if (!token) throw new ApiError(401, "Bạn cần đăng nhập để tiếp tục.");
  return apiJson<T>(path, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } });
}

export async function holdSeats(showtimeId: number, showtimeSeatIds: number[]) {
  const response = await authenticatedJson<{ data: SeatHold }>(`/showtimes/${showtimeId}/hold-seats`, { method: "POST", body: JSON.stringify({ showtimeSeatIds }) });
  return response.data;
}

export async function getBooking(bookingId: number) {
  const response = await authenticatedJson<{ data: BookingDetails }>(`/bookings/${bookingId}`);
  return response.data;
}

export async function getBookingHistory(page = 1, status?: BookingStatus) {
  const query = new URLSearchParams({ page: String(page), limit: "10" });
  if (status) query.set("status", status);
  return authenticatedJson<PaginatedResponse<BookingHistoryItem>>(`/bookings?${query.toString()}`);
}

export async function getNotifications(page = 1, unreadOnly = false) {
  return authenticatedJson<NotificationPage>(`/notifications?page=${page}&limit=20&unread=${unreadOnly}`);
}

export async function markNotificationRead(notificationId: number) {
  await authenticatedJson(`/notifications/${notificationId}/read`, { method: "PATCH", body: "{}" });
}

export async function markAllNotificationsRead() {
  return authenticatedJson<{ data: { updated: number } }>("/notifications/read-all", { method: "PATCH", body: "{}" });
}

export async function submitBooking(bookingId: number) {
  const response = await authenticatedJson<{ data: BookingDetails }>(`/bookings/${bookingId}/submit`, { method: "POST", body: "{}" });
  return response.data;
}

export async function getConcessions(signal?: AbortSignal) {
  const response = await apiGet<{ data: ConcessionProduct[] }>("/concessions", signal);
  return response.data;
}

export async function updateBookingConcessions(bookingId: number, items: { productId: number; quantity: number }[]) {
  const response = await authenticatedJson<{ data: BookingDetails }>(`/bookings/${bookingId}/concessions`, { method: "PUT", body: JSON.stringify({ items }) });
  return response.data;
}

export async function getVouchers(signal?: AbortSignal) {
  const response = await apiGet<{ data: Voucher[] }>("/vouchers", signal);
  return response.data;
}

export async function applyBookingVoucher(bookingId: number, code: string) {
  const response = await authenticatedJson<{ data: BookingDetails }>(`/bookings/${bookingId}/voucher`, { method: "PUT", body: JSON.stringify({ code }) });
  return response.data;
}

export async function removeBookingVoucher(bookingId: number) {
  const response = await authenticatedJson<{ data: BookingDetails }>(`/bookings/${bookingId}/voucher`, { method: "DELETE" });
  return response.data;
}

export async function payBookingMock(bookingId: number, outcome: "SUCCESS" | "FAILURE" | "CANCEL") {
  const response = await authenticatedJson<{ data: MockPaymentResponse }>(`/bookings/${bookingId}/payments/mock`, { method: "POST", body: JSON.stringify({ outcome }) });
  return response.data;
}

export async function getTicket(bookingId: number) {
  const response = await authenticatedJson<{ data: Ticket }>(`/bookings/${bookingId}/ticket`);
  await SecureStore.setItemAsync(`cinebook.ticket.${bookingId}`, JSON.stringify(response.data));
  return response.data;
}

export async function getCachedTicket(bookingId: number) {
  const raw = await SecureStore.getItemAsync(`cinebook.ticket.${bookingId}`);
  if (!raw) return null;
  try { return JSON.parse(raw) as Ticket; } catch { await SecureStore.deleteItemAsync(`cinebook.ticket.${bookingId}`); return null; }
}

export async function releaseHold(bookingId: number) {
  const token = await accessToken();
  if (!token) throw new ApiError(401, "Phiên đăng nhập đã hết hạn.");
  const response = await fetch(`${getApiBaseUrl()}/bookings/${bookingId}/hold`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) { const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null; throw new ApiError(response.status, payload?.error?.message ?? `API phản hồi mã ${response.status}.`); }
}

export async function getHomeData(signal?: AbortSignal) {
  const [movies, showtimes, cinemas] = await Promise.all([
    apiGet<PaginatedResponse<Movie>>("/movies?page=1&limit=6&active=true", signal),
    apiGet<PaginatedResponse<Showtime>>("/showtimes?page=1&limit=100&status=SCHEDULED", signal),
    apiGet<PaginatedResponse<unknown>>("/cinemas?page=1&limit=1&active=true", signal),
  ]);
  return { movies: movies.data, movieTotal: movies.meta.total, showtimes: showtimes.data, showtimeTotal: showtimes.meta.total, cinemaTotal: cinemas.meta.total };
}

export async function getMoviesData(signal?: AbortSignal) {
  const [movies, showtimes] = await Promise.all([
    apiGet<PaginatedResponse<Movie>>("/movies?page=1&limit=100&active=true", signal),
    apiGet<PaginatedResponse<Showtime>>("/showtimes?page=1&limit=100&status=SCHEDULED", signal),
  ]);
  return { movies: movies.data, showtimes: showtimes.data };
}

export async function getMovieDetails(movieId: number, signal?: AbortSignal) {
  const [movie, showtimes, reviews] = await Promise.all([
    apiGet<{ data: Movie }>(`/movies/${movieId}`, signal),
    apiGet<PaginatedResponse<Showtime>>(`/showtimes?movieId=${movieId}&status=SCHEDULED&page=1&limit=100`, signal),
    apiGet<ReviewPage>(`/movies/${movieId}/reviews?page=1&limit=10`, signal),
  ]);
  return { movie: movie.data, showtimes: showtimes.data, reviews };
}

export async function getMyMovieReview(movieId: number) {
  const response = await authenticatedJson<{ data: MovieReview | null }>(`/movies/${movieId}/reviews/me`);
  return response.data;
}

export async function saveMovieReview(movieId: number, rating: number, comment: string) {
  const response = await authenticatedJson<{ data: MovieReview }>(`/movies/${movieId}/reviews/me`, { method: "PUT", body: JSON.stringify({ rating, comment }) });
  return response.data;
}

export async function deleteMovieReview(movieId: number) {
  await authenticatedJson(`/movies/${movieId}/reviews/me`, { method: "DELETE" });
}

export async function getFavoriteStatus(movieId: number) {
  const response = await authenticatedJson<{ data: { isFavorite: boolean } }>(`/favorites/${movieId}`);
  return response.data.isFavorite;
}

export async function addFavorite(movieId: number) {
  const response = await authenticatedJson<{ data: { movieId: number; isFavorite: true; createdAt: string } }>(`/favorites/${movieId}`, { method: "PUT", body: "{}" });
  return response.data;
}

export async function removeFavorite(movieId: number) {
  const response = await authenticatedJson<{ data: { movieId: number; isFavorite: false } }>(`/favorites/${movieId}`, { method: "DELETE" });
  return response.data;
}

export async function getFavorites(page = 1) {
  return authenticatedJson<PaginatedResponse<FavoriteItem>>(`/favorites?page=${page}&limit=20`);
}

export async function getCinemaOptions(movieId: number, signal?: AbortSignal) {
  const [showtimes, rooms, cinemas] = await Promise.all([
    apiGet<PaginatedResponse<Showtime>>(`/showtimes?movieId=${movieId}&status=SCHEDULED&page=1&limit=100`, signal),
    apiGet<PaginatedResponse<Room>>("/rooms?page=1&limit=100&active=true", signal),
    apiGet<PaginatedResponse<Cinema>>("/cinemas?page=1&limit=100&active=true", signal),
  ]);
  return { showtimes: showtimes.data, rooms: rooms.data, cinemas: cinemas.data };
}

export async function getShowtimeSelectionData(movieId: number, cinemaId: number, signal?: AbortSignal) {
  const [movie, cinema, showtimes, rooms] = await Promise.all([
    apiGet<{ data: Movie }>(`/movies/${movieId}`, signal),
    apiGet<{ data: Cinema }>(`/cinemas/${cinemaId}`, signal),
    apiGet<PaginatedResponse<Showtime>>(`/showtimes?movieId=${movieId}&status=SCHEDULED&page=1&limit=100`, signal),
    apiGet<PaginatedResponse<Room>>(`/rooms?cinemaId=${cinemaId}&active=true&page=1&limit=100`, signal),
  ]);
  const roomIds = new Set(rooms.data.map(room => room.id));
  return { movie: movie.data, cinema: cinema.data, rooms: rooms.data, showtimes: showtimes.data.filter(item => roomIds.has(item.roomId)) };
}

export async function getSeatMap(showtimeId: number, signal?: AbortSignal) {
  const response = await apiGet<{ data: SeatMap }>(`/showtimes/${showtimeId}/seats`, signal);
  return response.data;
}
