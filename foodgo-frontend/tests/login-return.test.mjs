import { test } from "node:test";
import assert from "node:assert/strict";
import { safeReturnTo, afterLoginTarget, cancelLoginTarget, loginHref, captureReturnTo, PUBLIC_HOME } from "../src/features/account/loginReturn.ts";
import { createSessionController } from "../src/providers/sessionController.ts";
import { createTokenStore } from "../src/shared/storage/tokenStore.ts";
import { DemoEngine } from "../src/shared/api/demo.ts";

const preview = `${PUBLIC_HOME}?selection=demo-meal`;
test("returnTo only accepts existing internal customer routes and canonicalizes tab aliases", () => {
  for (const tab of ["home", "account", "orders", "favorites", "inbox"]) {
    assert.equal(safeReturnTo(`/${tab}`), `/(customer)/(tabs)/${tab}`);
    assert.equal(safeReturnTo(`/(customer)/(tabs)/${tab}`), `/(customer)/(tabs)/${tab}`);
  }
  for (const path of ["/checkout/review", "/orders/123", "/conversations/order-1", "/calls/uuid_1", "/reviews/order-2"])
    assert.equal(safeReturnTo(path), path);
});
test("returnTo rejects external URLs, login loops, work roles and path/parameter tricks", () => {
  for (const raw of [undefined, null, ["/home"], {}, "constructor", "__proto__", "toString",
    "https://example.test", "//example.test/home", "javascript:alert(1)", "/login", "/login?returnTo=/home",
    "/restaurant", "/driver", "/restaurant/index", "/not-a-route", "/foods/123", "/home/../driver",
    "/home#login", "/home%3freturnTo=//example.test", "/%2fexample.test", "/orders/a%2fb", "/home\\evil",
    "/home\n", "/orders/..", "/home?next=https://example.test", "/home?role=CUSTOMER",
    "/home?selection=demo-meal&selection=demo-meal", "/home?selection=demo-meal?x=1",
    "/checkout/review?submit=true", "/home?quantity=2", "a".repeat(401)])
    assert.equal(safeReturnTo(raw), null, "Invalid destination must be rejected");
});
test("only existing valid preview choice survives, and API mode drops demo-only choice", () => {
  assert.equal(safeReturnTo("/home?selection=demo-meal"), preview);
  assert.equal(safeReturnTo("/home?selection=removed-meal"), PUBLIC_HOME);
  assert.equal(safeReturnTo("/checkout/review?selection=demo-meal"), null);
  assert.equal(afterLoginTarget("CUSTOMER", preview, "demo"), preview);
  assert.equal(afterLoginTarget("CUSTOMER", preview, "api"), PUBLIC_HOME);
  assert.equal(captureReturnTo("/home", { selection: "demo-meal", ignored: "untrusted" }), preview);
  assert.equal(captureReturnTo("/home", { selection: ["demo-meal"] }), PUBLIC_HOME);
  assert.equal(captureReturnTo("/orders/123", { id: "123" }), "/orders/123");
});
test("all login entry points sanitize destinations before handing them to the router", () => {
  assert.deepEqual(loginHref(preview), { pathname: "/login", params: { returnTo: preview } });
  for (const raw of ["https://example.test", "/login", "/driver", ["/home"]])
    assert.deepEqual(loginHref(raw), { pathname: "/login", params: {} });
});
test("restaurant/driver always use the existing index role switch, customer cannot target their work", () => {
  for (const role of ["RESTAURANT", "DRIVER"])
    for (const target of [preview, "/orders/123", "/restaurant", "/driver", undefined])
      assert.equal(afterLoginTarget(role, target, "demo"), "/");
  assert.equal(afterLoginTarget("CUSTOMER", "/driver", "demo"), "/");
  assert.equal(afterLoginTarget("CUSTOMER", "/favorites", "api"), "/(customer)/(tabs)/favorites");
});
test("cancel returns only to public content, never to protected routes or login", () => {
  assert.equal(cancelLoginTarget(preview), preview);
  assert.equal(cancelLoginTarget("/account"), "/(customer)/(tabs)/account");
  for (const raw of ["/orders/123", "/favorites", "/checkout/review", "/driver", "/login", "//example.test", undefined])
    assert.equal(cancelLoginTarget(raw), PUBLIC_HOME);
});
test("real demo login plus continuation does not add cart/favorite/order; confirmation remains separate", () => {
  const engine = new DemoEngine();
  const before = engine.snapshot();
  const session = engine.request(null, "/auth/login", "POST", { username: "customer-1", password: "demo" });
  assert.equal(afterLoginTarget(session.user.role, preview, "demo"), preview);
  assert.deepEqual(engine.snapshot(), before);
  assert.equal(cancelLoginTarget(preview), preview);
  assert.deepEqual(engine.snapshot(), before);
  // Only an explicit later confirmation changes cart data.
  engine.request(session.user.id, "/demo/cart", "POST", {});
  assert.notDeepEqual(engine.snapshot(), before);
});
function pendingLogin() {
  let resolve;
  const response = new Promise((done) => { resolve = done; });
  let saved = null;
  const store = createTokenStore({ get: async () => saved, set: async (value) => { saved = value; } });
  const paths = [];
  const controller = createSessionController(store, async (token, path) => { paths.push(path); return response; });
  return { controller, paths, saved: () => saved, resolve };
}
test("cancel submitted login rejects late success without activating or saving the session", async () => {
  const h = pendingLogin();
  const pending = h.controller.login("test-only-user", "test-only-placeholder");
  const rejected = assert.rejects(pending, { code: "SESSION_CHANGED" });
  h.controller.cancelLogin();
  h.resolve({ token: "test-only-token", user: { id: "c", displayName: "Test", role: "CUSTOMER" } });
  await rejected;
  assert.equal(h.controller.getSnapshot().session, null);
  assert.equal(h.saved(), null);
  assert.deepEqual(h.paths, ["/auth/login"]);
});
test("login cancellation during token save clears only that pending token and permits later login", async () => {
  let release; const blocked = new Promise((resolve) => { release = resolve; });
  let saved = null;
  const store = createTokenStore({ get: async () => saved,
    set: async (value) => { if (value === "test-A") await blocked; saved = value; } });
  const controller = createSessionController(store, async (token, path, method, body) =>
    ({ token: `test-${body.username}`, user: { id: body.username, displayName: body.username, role: "CUSTOMER" } }));
  const first = controller.login("A", "test-only-placeholder");
  const rejected = assert.rejects(first, { code: "SESSION_CHANGED" });
  await new Promise((resolve) => setImmediate(resolve));
  controller.cancelLogin();
  const next = controller.login("B", "test-only-placeholder");
  release(); await Promise.all([rejected, next]);
  assert.equal(controller.getSnapshot().session.user.id, "B");
  assert.equal(saved, "test-B");
});

test("cancelling while restore is pending exits restoring without accepting the old user", async () => {
  let resolve;
  const response = new Promise((done) => { resolve = done; });
  const store = createTokenStore({ get: async () => "test-only-stored", set: async () => {} });
  const controller = createSessionController(store, async () => response);
  const pending = controller.restore();
  await new Promise((done) => setImmediate(done));
  controller.cancelLogin();
  assert.equal(controller.getSnapshot().restoring, false);
  resolve({ id: "A", displayName: "A", role: "CUSTOMER" }); await pending;
  assert.equal(controller.getSnapshot().session, null);
});

test("cancelled token save cleanup failure is reported without activating the cancelled user", async () => {
  let release; const saving = new Promise((done) => { release = done; });
  let saved = null;
  const store = createTokenStore({ get: async () => saved,
    set: async (value) => { if (value) { await saving; saved = value; } else throw Error("delete failed"); } });
  const controller = createSessionController(store, async () =>
    ({ token: "test-only-pending", user: { id: "A", displayName: "A", role: "CUSTOMER" } }));
  const pending = controller.login("A", "test-only-placeholder");
  const rejected = assert.rejects(pending, { code: "SESSION_CHANGED" });
  await new Promise((done) => setImmediate(done));controller.cancelLogin();release();await rejected;
  assert.equal(controller.getSnapshot().session, null);
  assert.match(controller.getSnapshot().notice, /Chưa xóa/);
});
