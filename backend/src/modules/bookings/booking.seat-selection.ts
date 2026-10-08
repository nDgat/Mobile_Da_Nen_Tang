export type SeatSelectionViolation = "NON_CONTIGUOUS_SELECTION" | "ORPHAN_SEAT";

export interface SeatSelectionState {
  id: number;
  rowLabel: string;
  seatNumber: number;
  status: "AVAILABLE" | "HELD" | "BOOKED";
}

function contiguousSegments(seats: SeatSelectionState[]) {
  const sorted = [...seats].sort((left, right) => left.seatNumber - right.seatNumber);
  const segments: SeatSelectionState[][] = [];
  for (const seat of sorted) {
    const current = segments[segments.length - 1];
    if (!current || seat.seatNumber !== current[current.length - 1]!.seatNumber + 1) segments.push([seat]);
    else current.push(seat);
  }
  return segments;
}

export function findSeatSelectionViolation(seats: SeatSelectionState[], selectedSeatIds: Iterable<number>): SeatSelectionViolation | null {
  const selected = new Set(selectedSeatIds);
  const rows = new Map<string, SeatSelectionState[]>();
  for (const seat of seats) rows.set(seat.rowLabel, [...(rows.get(seat.rowLabel) ?? []), seat]);

  for (const rowSeats of rows.values()) {
    for (const segment of contiguousSegments(rowSeats)) {
      const selectedIndexes = segment.flatMap((seat, index) => selected.has(seat.id) ? [index] : []);
      if (selectedIndexes.length === 0) continue;

      const firstSelected = Math.min(...selectedIndexes);
      const lastSelected = Math.max(...selectedIndexes);
      for (let index = firstSelected; index <= lastSelected; index++) {
        const seat = segment[index]!;
        if (seat.status === "AVAILABLE" && !selected.has(seat.id)) return "NON_CONTIGUOUS_SELECTION";
      }

      let index = 0;
      while (index < segment.length) {
        const seat = segment[index]!;
        const remainsEmpty = seat.status === "AVAILABLE" && !selected.has(seat.id);
        if (!remainsEmpty) { index++; continue; }
        const runStart = index;
        while (index < segment.length && segment[index]!.status === "AVAILABLE" && !selected.has(segment[index]!.id)) index++;
        const runLength = index - runStart;
        const selectedOnLeft = runStart > 0 && selected.has(segment[runStart - 1]!.id);
        const selectedOnRight = index < segment.length && selected.has(segment[index]!.id);
        if (runLength === 1 && (selectedOnLeft || selectedOnRight)) return "ORPHAN_SEAT";
      }
    }
  }
  return null;
}