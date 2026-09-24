import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import type { Ticket } from "@/types/api";

export type ReminderResult = "SCHEDULED" | "DENIED" | "TOO_LATE";

export async function scheduleTicketReminder(ticket: Ticket): Promise<ReminderResult> {
  const reminderAt = new Date(new Date(ticket.showtime.startsAt).getTime() - 30 * 60 * 1000);
  if (reminderAt.getTime() <= Date.now()) return "TOO_LATE";
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return "DENIED";
  const storageKey = `cinebook.reminder.${ticket.bookingId}`;
  const previous = await SecureStore.getItemAsync(storageKey);
  if (previous) await Notifications.cancelScheduledNotificationAsync(previous).catch(() => undefined);
  const identifier = await Notifications.scheduleNotificationAsync({
    content: { title: "Sắp đến giờ chiếu", body: `${ticket.movie.title} bắt đầu sau 30 phút · ${ticket.cinema.name} · Ghế ${ticket.seats.join(", ")}`, data: { url: `/tickets/${ticket.bookingId}` } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderAt },
  });
  await SecureStore.setItemAsync(storageKey, identifier);
  return "SCHEDULED";
}
