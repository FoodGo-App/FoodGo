import { test } from "node:test";
import assert from "node:assert/strict";
import { explain } from "../src/shared/theme/theme.ts";

test("service codes take precedence over internal server messages", () => {
  const error = Object.assign(new Error("HTTP 409 version conflict"), { code: "CART_VERSION_CONFLICT" });
  assert.equal(explain(error), explain("CART_VERSION_CONFLICT"));
  assert.match(explain(error), /Giỏ đã thay đổi/);
});

test("unknown failures never expose internal codes or debug details", () => {
  for (const error of [new Error("UNKNOWN_REASON"), new Error("TypeError: fetch failed"), { code: "UNKNOWN" }, null, "API version 3", "Lỗi API từ máy chủ"]) {
    assert.equal(explain(error), "Chưa thực hiện được yêu cầu. Hãy tải lại rồi thử lại.");
  }
});

test("known wallet failures and useful Vietnamese guidance remain actionable", () => {
  assert.match(explain("WALLET_FAILED"), /Giỏ của bạn vẫn được giữ/);
  const message = "Bạn cần chọn địa chỉ trước khi tiếp tục.";
  assert.equal(explain(new Error(message)), message);
});
