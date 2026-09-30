import type { Ticket } from "@/types/api";

export type ReminderResult = "SCHEDULED" | "DENIED" | "TOO_LATE";

export async function scheduleTicketReminder(_ticket: Ticket): Promise<ReminderResult> {
  return "DENIED";
}
