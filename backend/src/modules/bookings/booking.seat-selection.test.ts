import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findSeatSelectionViolation, type SeatSelectionState } from "./booking.seat-selection.js";

const row = (statuses: SeatSelectionState["status"][] = Array(8).fill("AVAILABLE")) =>
  statuses.map((status, index) => ({ id: index + 1, rowLabel: "A", seatNumber: index + 1, status }));

describe("findSeatSelectionViolation", () => {
  it("cho phép một cụm ghế liền nhau mà không tạo ghế lẻ", () => {
    assert.equal(findSeatSelectionViolation(row(), [3, 4]), null);
  });

  it("từ chối để ghế trống nằm giữa các ghế đang chọn", () => {
    assert.equal(findSeatSelectionViolation(row(), [2, 5]), "NON_CONTIGUOUS_SELECTION");
  });

  it("từ chối chừa đúng một ghế ở đầu hoặc cuối dãy", () => {
    assert.equal(findSeatSelectionViolation(row(), [2, 3]), "ORPHAN_SEAT");
    assert.equal(findSeatSelectionViolation(row(), [6, 7]), "ORPHAN_SEAT");
  });

  it("từ chối tạo một ghế trống giữa ghế đã đặt và ghế đang chọn", () => {
    assert.equal(findSeatSelectionViolation(row(["BOOKED", "AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE"]), [3]), "ORPHAN_SEAT");
  });

  it("không chặn vì ghế lẻ có sẵn ở nơi lựa chọn mới không tác động", () => {
    assert.equal(findSeatSelectionViolation(row(["AVAILABLE", "BOOKED", "AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE"]), [5, 6]), null);
  });

  it("coi khoảng số ghế là lối đi và kiểm tra từng dãy riêng", () => {
    const seats = row().filter(seat => seat.seatNumber !== 4);
    assert.equal(findSeatSelectionViolation(seats, [3, 5]), null);
  });
});