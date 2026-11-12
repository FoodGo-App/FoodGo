import { test } from "node:test";
import assert from "node:assert/strict";
import { httpRequest } from "../src/shared/api/http.ts";
test("HTTP attaches token/key and unwraps SDS envelope without changing IDs", async () => {
  let observed;
  const out = await httpRequest(
    "https://example.test/api/v1/",
    "secret",
    "/orders",
    "POST",
    { quoteId: "9007199254740993" },
    "same-key",
    async (url, options) => {
      observed = { url, options };
      return new Response(JSON.stringify({ data: { id: "9007199254740993" } }));
    },
  );
  assert.equal(out.id, "9007199254740993");
  assert.equal(observed.url, "https://example.test/api/v1/orders");
  assert.equal(observed.options.headers.Authorization, "Bearer secret");
  assert.equal(observed.options.headers["Idempotency-Key"], "same-key");
});
test("HTTP network errors never return demo success", async () => {
  await assert.rejects(
    () =>
      httpRequest(
        "https://example.test",
        null,
        "/orders",
        "GET",
        undefined,
        undefined,
        async () => {
          throw Error("offline");
        },
      ),
    { code: "NETWORK_ERROR" },
  );
});
test("HTTP preserves 409 and exposes structured error", async () => {
  await assert.rejects(
    () =>
      httpRequest(
        "https://example.test",
        null,
        "/orders",
        "GET",
        undefined,
        undefined,
        async () =>
          new Response(
            JSON.stringify({
              error: {
                code: "ORDER_STATE_CONFLICT",
                message: "Đơn đã được nhận",
              },
            }),
            { status: 409 },
          ),
      ),
    { code: "ORDER_STATE_CONFLICT", status: 409 },
  );
});

test("HTTP non-JSON 401 preserves HTTP status instead of becoming a network failure", async () => {
  await assert.rejects(() => httpRequest("https://example.test", null, "/auth/login",
    "POST", {}, undefined, async () => new Response("unauthorized", { status: 401 })),
    { status: 401, code: "HTTP_ERROR" });
});
