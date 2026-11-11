import { test } from "node:test";
import assert from "node:assert/strict";
import { DemoEngine } from "../src/shared/api/demo.ts";

const actor = {
  customer: "customer-1",
  other: "customer-2",
  restaurant: "restaurant-1",
  driver: "driver-1",
  driver2: "driver-2",
};
function request(engine, who, path, body, key) {
  return engine.request(
    actor[who],
    path,
    body === undefined ? "GET" : "POST",
    body,
    key,
  );
}
function place(engine, method = "COD", key = "checkout-1") {
  const quote = request(engine, "customer", "/checkout/quotes", {
    addressId: "address-1",
    paymentMethod: method,
    offerId: "offer-10",
    expectedCartVersion: 1,
  });
  return request(
    engine,
    "customer",
    "/checkout/attempts",
    { quoteId: quote.id, expectedCartVersion: 1 },
    key,
  );
}
function assigned(engine) {
  const attempt = place(engine);
  const id = attempt.orderId;
  request(engine, "restaurant", `/restaurant/orders/${id}/accept`, {});
  const offer = request(engine, "driver", "/driver/offers").content[0];
  request(engine, "driver", `/driver/offers/${offer.id}/accept`, {});
  return id;
}
test("quote follows the SRS reference money: 140000 - 14000 + 15000", () => {
  const e = new DemoEngine();
  const q = request(e, "customer", "/checkout/quotes", {
    addressId: "address-1",
    paymentMethod: "COD",
    offerId: "offer-10",
    expectedCartVersion: 1,
  });
  assert.equal(q.subtotal, 140000);
  assert.equal(q.total, 141000);
});
test("repeated checkout key gives one order; changed body rejected", () => {
  const e = new DemoEngine();
  const a = place(e);
  const b = request(e, "customer", "/checkout/attempts/by-key/checkout-1");
  assert.equal(a.orderId, b.orderId);
  assert.equal(request(e, "customer", "/orders").content.length, 1);
  assert.throws(
    () =>
      request(
        e,
        "customer",
        "/checkout/attempts",
        { quoteId: "changed", expectedCartVersion: 1 },
        "checkout-1",
      ),
    /IDEMPOTENCY_CONFLICT/,
  );
});
test("wallet pending is not an order, resolve preserves retry result", () => {
  const e = new DemoEngine();
  const a = place(e, "MOCK_WALLET");
  assert.equal(a.result, "PENDING");
  assert.equal(a.orderId, null);
  assert.equal(request(e, "customer", "/orders").content.length, 0);
  const b = request(e, "customer", `/checkout/attempts/${a.id}/resolve`, {});
  assert.equal(b.result, "SUCCEEDED");
  assert.equal(
    request(e, "customer", `/checkout/attempts/${a.id}/resolve`, {}).orderId,
    b.orderId,
  );
});
test("quote expiration requires a new confirmation", () => {
  let now = 1000;
  const e = new DemoEngine(undefined, () => now);
  const q = request(e, "customer", "/checkout/quotes", {
    addressId: "address-1",
    paymentMethod: "COD",
    expectedCartVersion: 1,
  });
  now += 121000;
  assert.throws(
    () =>
      request(
        e,
        "customer",
        "/checkout/attempts",
        { quoteId: q.id, expectedCartVersion: 1 },
        "expired",
      ),
    /QUOTE_EXPIRED/,
  );
});
test("customer cannot read another customer order; guest and wrong role cannot mutate", () => {
  const e = new DemoEngine();
  const a = place(e);
  assert.throws(() => request(e, "other", `/orders/${a.orderId}`), /NOT_FOUND/);
  assert.throws(
    () => request(e, "customer", `/restaurant/orders/${a.orderId}/accept`, {}),
    /FORBIDDEN/,
  );
  assert.throws(() => e.request(null, "/orders", "GET"), /AUTH_REQUIRED/);
});
test("accept beats cancel, two drivers cannot claim same order", () => {
  const e = new DemoEngine();
  const a = place(e);
  request(e, "restaurant", `/restaurant/orders/${a.orderId}/accept`, {});
  assert.throws(
    () =>
      request(e, "customer", `/orders/${a.orderId}/cancel`, {
        reason: "Đổi ý",
      }),
    /ORDER_STATE_CONFLICT/,
  );
  const offer = request(e, "driver", "/driver/offers").content[0];
  assert.equal(offer.recipientPhone, undefined);
  assert.equal(offer.addressText, undefined);
  request(e, "driver", `/driver/offers/${offer.id}/accept`, {});
  assert.throws(
    () => request(e, "driver2", `/driver/offers/${offer.id}/accept`, {}),
    /OFFER_EXPIRED|NOT_FOUND/,
  );
});
test("pickup requires ready; issue does not complete; COD requires collection", () => {
  const e = new DemoEngine();
  const id = assigned(e);
  assert.throws(
    () => request(e, "driver", `/driver/orders/${id}/pickup`, {}),
    /ORDER_STATE_CONFLICT/,
  );
  request(e, "restaurant", `/restaurant/orders/${id}/prepare`, {});
  request(e, "restaurant", `/restaurant/orders/${id}/ready`, {});
  request(e, "driver", `/driver/orders/${id}/pickup`, {});
  request(
    e,
    "driver",
    `/driver/orders/${id}/issues`,
    { reason: "Chưa gặp khách" },
    "issue-1",
  );
  assert.equal(
    request(e, "driver", `/orders/${id}`).status,
    "OUT_FOR_DELIVERY",
  );
  assert.throws(
    () =>
      request(e, "driver", `/driver/orders/${id}/deliver`, {
        codCollected: false,
      }),
    /COD_CONFIRMATION_REQUIRED/,
  );
  assert.equal(
    request(e, "driver", `/driver/orders/${id}/deliver`, { codCollected: true })
      .paymentStatus,
    "PAID",
  );
});
test("terminal chat is read-only, message retries dedupe, review only once", () => {
  const e = new DemoEngine();
  const id = assigned(e);
  const msg = { clientMessageId: "msg-1", kind: "TEXT", text: "Chào bạn" };
  assert.equal(
    request(e, "customer", `/orders/${id}/messages`, msg).id,
    request(e, "customer", `/orders/${id}/messages`, msg).id,
  );
  assert.throws(
    () =>
      request(e, "customer", `/orders/${id}/messages`, {
        ...msg,
        text: "Khác",
      }),
    /MESSAGE_KEY_CONFLICT/,
  );
  assert.throws(
    () =>
      request(e, "customer", `/orders/${id}/driver-review`, {
        stars: 5,
        tags: [],
        note: "",
      }),
    /ORDER_NOT_DELIVERED/,
  );
  request(e, "restaurant", `/restaurant/orders/${id}/prepare`, {});
  request(e, "restaurant", `/restaurant/orders/${id}/ready`, {});
  request(e, "driver", `/driver/orders/${id}/pickup`, {});
  request(e, "driver", `/driver/orders/${id}/deliver`, { codCollected: true });
  assert.equal(
    request(e, "customer", `/orders/${id}/conversation`).readOnly,
    true,
  );
  assert.throws(
    () =>
      request(e, "customer", `/orders/${id}/messages`, {
        ...msg,
        clientMessageId: "new",
      }),
    /MESSAGE_READ_ONLY/,
  );
  assert.throws(
    () => request(e, "customer", `/orders/${id}/call-access`, {}),
    /CALL_NOT_ALLOWED/,
  );
  request(e, "customer", `/orders/${id}/driver-review`, {
    stars: 5,
    tags: ["FRIENDLY"],
    note: "Tốt",
  });
  assert.throws(
    () =>
      request(e, "customer", `/orders/${id}/driver-review`, {
        stars: 4,
        tags: [],
        note: "",
      }),
    /REVIEW_ALREADY_EXISTS/,
  );
});
test("cancel wallet pending keeps cart; serialized demo state restores orders", () => {
  const e = new DemoEngine();
  const a = place(e, "MOCK_WALLET");
  request(e, "customer", `/checkout/attempts/${a.id}/cancel`, {});
  assert.equal(request(e, "customer", "/cart").items.length, 2);
  const id = place(e, "COD", "second").orderId;
  const restored = new DemoEngine(e.snapshot());
  assert.equal(request(restored, "customer", `/orders/${id}`).id, id);
});
test("expired demo offer and offer from old dispatch round cannot be accepted", () => {
  let now = 1000;
  const e = new DemoEngine(undefined, () => now);
  const id = place(e).orderId;
  request(e, "restaurant", `/restaurant/orders/${id}/accept`, {});
  const first = request(e, "driver", "/driver/offers").content[0];
  request(e, "driver2", "/driver/offers");
  now += 31000;
  assert.throws(
    () => request(e, "driver", `/driver/offers/${first.id}/accept`, {}),
    /OFFER_EXPIRED/,
  );
  request(e, "driver", "/driver/offers");
  request(e, "driver2", "/driver/offers");
  request(e, "customer", `/orders/${id}/dispatch-retries`, {});
  const fresh = request(e, "driver", "/driver/offers").content[0];
  assert.notEqual(first.id, fresh.id);
  assert.throws(
    () => request(e, "driver", `/driver/offers/${first.id}/accept`, {}),
    /OFFER_EXPIRED/,
  );
});
