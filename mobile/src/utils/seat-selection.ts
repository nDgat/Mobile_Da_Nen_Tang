import type { ShowtimeSeat } from "../types/api";

export function seatSelectionError(seats: ShowtimeSeat[], selectedSeatIds: Iterable<number>): string | null {
  const selected = new Set(selectedSeatIds);
  const rows = new Map<string, ShowtimeSeat[]>();
  for (const seat of seats) rows.set(seat.rowLabel, [...(rows.get(seat.rowLabel) ?? []), seat]);

  for (const rowSeats of rows.values()) {
    const sorted = [...rowSeats].sort((left, right) => left.seatNumber - right.seatNumber);
    const segments: ShowtimeSeat[][] = [];
    for (const seat of sorted) {
      const current = segments[segments.length - 1];
      if (!current || seat.seatNumber !== current[current.length - 1]!.seatNumber + 1) segments.push([seat]);
      else current.push(seat);
    }

    for (const segment of segments) {
      const selectedIndexes = segment.flatMap((seat, index) => selected.has(seat.id) ? [index] : []);
      if (selectedIndexes.length === 0) continue;
      const firstSelected = Math.min(...selectedIndexes);
      const lastSelected = Math.max(...selectedIndexes);

      for (let index = firstSelected; index <= lastSelected; index++) {
        const seat = segment[index]!;
        if (seat.status === "AVAILABLE" && !selected.has(seat.id)) return "Vui lòng chọn các ghế liền nhau, không chừa ghế trống ở giữa.";
      }

      let index = 0;
      while (index < segment.length) {
        if (segment[index]!.status !== "AVAILABLE" || selected.has(segment[index]!.id)) { index++; continue; }
        const runStart = index;
        while (index < segment.length && segment[index]!.status === "AVAILABLE" && !selected.has(segment[index]!.id)) index++;
        const selectedOnLeft = runStart > 0 && selected.has(segment[runStart - 1]!.id);
        const selectedOnRight = index < segment.length && selected.has(segment[index]!.id);
        if (index - runStart === 1 && (selectedOnLeft || selectedOnRight)) return "Không được chừa lại một ghế trống ở bên trái hoặc bên phải.";
      }
    }
  }
  return null;
}