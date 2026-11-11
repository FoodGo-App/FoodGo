import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCart,
  normalizeQuote,
  normalizeOrder,
  normalizeOfferPage,
  normalizeMessage,
  normalizeDriverOffer,
  shouldKeepCheckoutReference,
} from "../src/shared/api/adapters.ts";
test("SDS QuoteDto cartVersion and lines become a valid confirmation input", () => {
  const q = normalizeQuote({
    id: "q1",
    cartVersion: 7,
    lines: [
      { foodId: "f1", foodName: "Cơm gà", quantity: 2, unitPrice: 50000 },
    ],
    address: { id: "a1" },
    paymentMethod: "COD",
    subtotal: 100000,
    deliveryFee: 15000,
    foodDiscount: 0,
    deliveryDiscount: 0,
    total: 115000,
    expiresAt: "2026-11-10T12:00:00Z",
  });
  assert.equal(q.expectedCartVersion, 7);
  assert.equal(q.items[0].foodName, "Cơm gà");
});
test("SDS summary without lines remains displayable; nested detail is adapted", () => {
  const summary = normalizeOrder({
    id: "o1",
    status: "CONFIRMED",
    total: 155000,
    restaurantName: "Bếp Nhà",
    createdAt: "2026-11-10T10:00:00Z",
    deliveryStatus: "FINDING_DRIVER",
  });
  assert.deepEqual(summary.items, []);
  const detail = normalizeOrder({
    ...summary,
    recipient: {
      name: "Minh",
      phone: "0900000000",
      addressText: "Địa chỉ mẫu",
    },
    lines: [{ foodName: "Món", quantity: 1, unitPrice: 100 }],
    amounts: { subtotal: 100, total: 15100, deliveryFee: 15000 },
    driver: { id: "d1", displayName: "An" },
  });
  assert.equal(detail.recipientName, "Minh");
  assert.equal(detail.driverName, "An");
  assert.equal(detail.items.length, 1);
});
test("SDS offers page and estimated cart fields are adapted", () => {
  assert.equal(
    normalizeOfferPage({ content: [{ id: "v1", minSubtotal: 0 }] }).length,
    1,
  );
  const cart = normalizeCart(
    {
      id: "c1",
      version: 3,
      restaurantId: "r1",
      items: [
        {
          id: "i1",
          foodId: "f1",
          quantity: 2,
          estimatedUnitPrice: 30000,
          optionValueIds: ["x"],
        },
      ],
    },
    {
      f1: {
        name: "Cơm",
        optionGroups: [{ values: [{ id: "x", name: "Lớn" }] }],
      },
    },
  );
  assert.equal(cart.items[0].unitPrice, 30000);
  assert.equal(cart.items[0].foodName, "Cơm");
  assert.equal(cart.items[0].options, "Lớn");
});
test("SDS sentAt and deliveryArea map to UI fields", () => {
  assert.equal(
    normalizeMessage({
      id: "1",
      senderId: "d1",
      kind: "TEXT",
      sentAt: "2026-11-10T10:00:00Z",
    }).createdAt,
    "2026-11-10T10:00:00Z",
  );
  assert.equal(
    normalizeDriverOffer({ id: "a", deliveryArea: "AREA_A" }).areaCode,
    "AREA_A",
  );
});
test("authoritative rejection releases pending key, network ambiguity preserves it", () => {
  for (const code of [
    "QUOTE_EXPIRED",
    "QUOTE_CHANGED",
    "CART_VERSION_CONFLICT",
    "INVALID_OFFER",
  ])
    assert.equal(shouldKeepCheckoutReference({ code, status: 409 }), false);
  assert.equal(
    shouldKeepCheckoutReference({ code: "NETWORK_ERROR", status: 0 }),
    true,
  );
  assert.equal(
    shouldKeepCheckoutReference({ code: "HTTP_ERROR", status: 500 }),
    true,
  );
});
test("SDS uppercase allowedActions are adapted for frontend controls", () => {
  assert.deepEqual(
    normalizeOrder({
      allowedActions: ["VIEW", "CHAT", "CALL", "RETRY_DISPATCH"],
    }).allowedActions,
    ["view", "chat", "call", "retryDispatch"],
  );
});
