import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CinemaValidationError, readCoordinate } from "./cinema.service.js";

describe("cinema coordinates", () => {
  it("chấp nhận tọa độ hợp lệ tại Việt Nam", () => {
    assert.equal(readCoordinate(10.7769, "latitude"), 10.7769);
    assert.equal(readCoordinate("106.7009", "longitude"), 106.7009);
  });

  it("từ chối tọa độ ngoài phạm vi Việt Nam", () => {
    assert.throws(() => readCoordinate(1, "latitude"), CinemaValidationError);
    assert.throws(() => readCoordinate(150, "longitude"), CinemaValidationError);
  });

  it("từ chối tọa độ rỗng hoặc không phải số", () => {
    assert.throws(() => readCoordinate("", "latitude"), CinemaValidationError);
    assert.throws(() => readCoordinate("abc", "longitude"), CinemaValidationError);
  });
});