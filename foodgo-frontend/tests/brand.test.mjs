import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeCart, normalizeOrder } from "../src/shared/api/adapters.ts";
test("food image metadata survives cart enrichment and immutable order snapshots", () => {
  const cart = normalizeCart(
    { items: [{ foodId: "f1", quantity: 1 }] },
    { f1: { name: "Cơm gà", imageCode: "CHICKEN_RICE" } },
  );
  assert.equal(cart.items[0].imageCode, "CHICKEN_RICE");
  const order = normalizeOrder({
    lines: [
      {
        foodId: "f1",
        foodName: "Món đã đặt",
        imageCode: "MUSHROOM_RICE",
        quantity: 1,
        unitPrice: 40000,
      },
    ],
  });
  assert.equal(order.items[0].imageCode, "MUSHROOM_RICE");
  assert.equal(
    normalizeOrder({ lines: [{ foodId: "unknown" }] }).items[0].imageCode,
    undefined,
  );
});
