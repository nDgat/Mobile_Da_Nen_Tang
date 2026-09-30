import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createTicketToken, verifyTicketToken } from "./ticket.token.js";

describe("ticket token", () => {
  it("tạo và xác minh token QR", () => {
    const token = createTicketToken(123, "BOOKING-ABC");
    assert.deepEqual(verifyTicketToken(token), { v: 1, bookingId: 123, bookingCode: "BOOKING-ABC" });
    assert.deepEqual(verifyTicketToken(`CINEBOOK:${token}`), { v: 1, bookingId: 123, bookingCode: "BOOKING-ABC" });
  });

  it("từ chối token bị sửa chữ ký hoặc sai cấu trúc", () => {
    const token = createTicketToken(123, "BOOKING-ABC");
    const [payload, signature] = token.split(".");
    assert.throws(() => verifyTicketToken(`${payload}.${signature}x`), /Chữ ký/);
    assert.throws(() => verifyTicketToken("khong-hop-le"), /không hợp lệ/);
    assert.throws(() => verifyTicketToken(`${token}.du`), /không hợp lệ/);
  });
});
