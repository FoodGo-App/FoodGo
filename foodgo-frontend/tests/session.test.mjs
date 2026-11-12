import { test } from "node:test";
import assert from "node:assert/strict";
import { createSessionController } from "../src/providers/sessionController.ts";
import { createTokenStore } from "../src/shared/storage/tokenStore.ts";
import { ApiError, httpRequest } from "../src/shared/api/http.ts";

const user = (name) => ({ id: name, displayName: name, role: "CUSTOMER" });
const session = (name) => ({ token: `test-only-${name}`, user: user(name) });
const ok = (data) => new Response(JSON.stringify({ data }));
const denied = () => new Response(JSON.stringify({ error: { code: "SESSION_EXPIRED", message: "expired" } }), { status: 401 });
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const turn = () => new Promise((resolve) => setImmediate(resolve));
function harness({ initial = null, fetcher, storage = {} } = {}) {
  let saved = initial;
  const calls = [];
  const store = createTokenStore({
    get: async () => storage.get ? storage.get(saved) : saved,
    set: async (value) => { if (storage.set) await storage.set(value); saved = value; },
  });
  const controller = createSessionController(store, (token, path, method, body, key) =>
    httpRequest("https://foodgo.invalid", token, path, method, body, key,
      async (url, options) => {
        calls.push({ path, token, options });
        if (fetcher) return fetcher(path, options, token);
        if (path === "/auth/login") return ok(session(JSON.parse(options.body).username));
        if (path === "/auth/logout") return ok({ revoked: true });
        return ok(user("A"));
      }));
  return { controller, store, calls, saved: () => saved };
}
const login = (h, name = "A") => h.controller.login(name, "test-only-placeholder");

test("restore success exposes user only after /me verifies the stored bearer", async () => {
  const me = deferred();
  const h = harness({ initial: session("A").token, fetcher: () => me.promise });
  const pending = h.controller.restore();
  await turn();
  assert.equal(h.controller.getSnapshot().session, null);
  assert.equal(h.controller.getSnapshot().restoring, true);
  me.resolve(ok(user("A"))); await pending;
  assert.deepEqual(h.controller.getSnapshot().session, session("A"));
  assert.equal(h.calls[0].options.headers.Authorization, `Bearer ${session("A").token}`);
});

test("restore 401 removes the rejected stored session and becomes Guest", async () => {
  const h = harness({ initial: session("A").token, fetcher: denied });
  await h.controller.restore();
  assert.equal(h.saved(), null);
  assert.equal(h.controller.getSnapshot().session, null);
  assert.equal(h.controller.getSnapshot().restoring, false);
  assert.match(h.controller.getSnapshot().notice, /từ chối/);
});

test("restore network/timeout failure keeps token but never exposes private user", async () => {
  for (const failure of [new TypeError("offline"), new DOMException("timeout", "AbortError")]) {
    const h = harness({ initial: session("A").token, fetcher: async () => { throw failure; } });
    await h.controller.restore();
    assert.equal(h.saved(), session("A").token);
    assert.equal(h.controller.getSnapshot().session, null);
    assert.equal(h.controller.getSnapshot().restoring, false);
    assert.match(h.controller.getSnapshot().notice, /Chưa xác minh/);
  }
});

test("restore read failure and 401 delete failure remain Guest with honest notice", async () => {
  const read = harness({ storage: { get: async () => { throw Error("read failed"); } } });
  await read.controller.restore();
  assert.equal(read.calls.length, 0);
  assert.equal(read.controller.getSnapshot().session, null);
  assert.match(read.controller.getSnapshot().notice, /Không đọc/);
  const remove = harness({ initial: session("A").token, fetcher: denied,
    storage: { set: async () => { throw Error("remove failed"); } } });
  await remove.controller.restore();
  assert.equal(remove.saved(), session("A").token);
  assert.equal(remove.controller.getSnapshot().session, null);
  assert.match(remove.controller.getSnapshot().notice, /Chưa xóa/);
});

test("late restore success and 401 cannot overwrite login B", async () => {
  for (const response of [() => ok(user("A")), denied]) {
    const me = deferred();
    const h = harness({ initial: session("A").token,
      fetcher: (path, options) => path === "/auth/me" ? me.promise : ok(session(JSON.parse(options.body).username)) });
    const restoring = h.controller.restore(); await turn();
    await login(h, "B");
    const snapshot = h.controller.getSnapshot();
    me.resolve(response()); await restoring;
    assert.strictEqual(h.controller.getSnapshot(), snapshot);
    assert.equal(h.saved(), session("B").token);
  }
});

test("late restore after logout or effect cleanup is ignored", async () => {
  for (const cleanup of [false, true]) {
    const me = deferred(); let alive = true;
    const h = harness({ initial: session("A").token, fetcher: () => me.promise });
    const restoring = h.controller.restore(() => alive); await turn();
    if (cleanup) alive = false;
    else await h.controller.logout();
    const snapshot = h.controller.getSnapshot();
    me.resolve(ok(user("A"))); await restoring;
    assert.strictEqual(h.controller.getSnapshot(), snapshot);
    assert.equal(h.controller.getSnapshot().session, null);
  }
});

test("request A returning 401 after login B cannot clear B or its stored bearer", async () => {
  const old = deferred();
  const h = harness({ fetcher: (path, options) => path === "/private" ? old.promise : ok(session(JSON.parse(options.body).username)) });
  await login(h); const pending = h.controller.request("/private");
  const failure = assert.rejects(pending, { status: 401, code: "SESSION_EXPIRED" });
  await login(h, "B"); const snapshot = h.controller.getSnapshot();
  old.resolve(denied()); await failure;
  assert.strictEqual(h.controller.getSnapshot(), snapshot);
  assert.equal(h.saved(), session("B").token);
});

test("current request 401 clears UI before failing storage finishes and preserves API error", async () => {
  const deletion = deferred();
  const h = harness({ fetcher: (path) => path === "/private" ? denied() : ok(session("A")),
    storage: { set: (value) => value === null ? deletion.promise : Promise.resolve() } });
  await login(h);
  const pending = h.controller.request("/private");
  const failed = assert.rejects(pending, { status: 401, code: "SESSION_EXPIRED" });
  await turn();
  assert.equal(h.controller.getSnapshot().session, null);
  deletion.reject(Error("delete failed")); await failed;
  assert.match(h.controller.getSnapshot().notice, /Chưa xóa/);
});

test("late successful private response is rejected after session change", async () => {
  const old = deferred();
  const h = harness({ fetcher: (path, options) => path === "/private" ? old.promise : ok(session(JSON.parse(options.body).username)) });
  await login(h); const pending = h.controller.request("/private");
  const failed = assert.rejects(pending, { code: "SESSION_CHANGED" });
  await login(h, "B"); old.resolve(ok({ private: "old" })); await failed;
});

test("login 401 stays INVALID_CREDENTIALS for the form, preserving active session", async () => {
  const h = harness({ fetcher: (path, options) => {
    if (JSON.parse(options.body).username === "bad") return new Response(JSON.stringify({ error: { code: "INVALID_CREDENTIALS", message: "invalid" } }), { status: 401 });
    return ok(session("A"));
  } });
  await login(h);
  await assert.rejects(login(h, "bad"), { status: 401, code: "INVALID_CREDENTIALS" });
  assert.deepEqual(h.controller.getSnapshot().session, session("A"));
  assert.equal(h.saved(), session("A").token);
  await assert.rejects(h.controller.request("/auth/login", "POST", { username: "bad" }), { status: 401 });
  assert.equal(h.saved(), session("A").token);
});

test("logout online clears UI synchronously and waits only to report confirmation", async () => {
  const remote = deferred();
  const h = harness({ fetcher: (path) => path === "/auth/logout" ? remote.promise : ok(session("A")) });
  await login(h); const pending = h.controller.logout();
  assert.equal(h.controller.getSnapshot().session, null);
  await turn(); assert.equal(h.saved(), null);
  assert.match(h.controller.getSnapshot().notice, /Chưa xác nhận/);
  remote.resolve(ok({ revoked: true })); await pending;
  assert.match(h.controller.getSnapshot().notice, /Đã đăng xuất và thu hồi/);
  assert.equal(h.calls.at(-1).token, session("A").token);
});

test("logout offline and unconfirmed response never claim server revocation", async () => {
  for (const failure of ["offline", "unconfirmed"]) {
    const h = harness({ fetcher: async (path) => {
      if (path === "/auth/login") return ok(session("A"));
      if (failure === "offline") throw Error("offline");
      return ok({ revoked: false });
    } });
    await login(h); await h.controller.logout();
    assert.equal(h.controller.getSnapshot().session, null);
    assert.equal(h.saved(), null);
    assert.match(h.controller.getSnapshot().notice, /Chưa xác nhận thu hồi/);
  }
});

test("logout storage delete failure cannot retain UI and does not hide server failure", async () => {
  const h = harness({ fetcher: async (path) => {
    if (path === "/auth/login") return ok(session("A"));
    throw Error("offline");
  }, storage: { set: async (value) => { if (value === null) throw Error("delete failed"); } } });
  await login(h); const pending = h.controller.logout();
  assert.equal(h.controller.getSnapshot().session, null);
  await pending;
  assert.equal(h.saved(), session("A").token);
  assert.match(h.controller.getSnapshot().notice, /Chưa xóa/);
  assert.match(h.controller.getSnapshot().notice, /Chưa xác nhận thu hồi/);
});

test("late logout A completion cannot delete B, change its state or replace its notice", async () => {
  for (const outcome of ["success", "failure"]) {
    const remote = deferred();
    const h = harness({ fetcher: (path, options) => path === "/auth/logout" ? remote.promise : ok(session(JSON.parse(options.body).username)) });
    await login(h); const pending = h.controller.logout(); await turn();
    await login(h, "B"); const snapshot = h.controller.getSnapshot();
    assert.equal(h.calls.find((x) => x.path === "/auth/logout").token, session("A").token);
    if (outcome === "success") remote.resolve(ok({ revoked: true }));
    else remote.reject(Error("offline"));
    await pending;
    assert.strictEqual(h.controller.getSnapshot(), snapshot);
    assert.equal(h.saved(), session("B").token);
  }
});

test("delayed logout storage deletion is serialized before login B save", async () => {
  const deletion = deferred();
  const h = harness({ storage: { set: (value) => value === null ? deletion.promise : Promise.resolve() } });
  await login(h); const logout = h.controller.logout(); await turn();
  const next = login(h, "B"); await turn();
  assert.equal(h.controller.getSnapshot().session, null);
  deletion.resolve(); await Promise.all([logout, next]);
  assert.equal(h.saved(), session("B").token);
  assert.deepEqual(h.controller.getSnapshot().session, session("B"));
});

test("failed login persistence is visible; failed token deletion does not poison next login", async () => {
  let fail = true;
  const h = harness({ storage: { set: async () => { if (fail) throw Error("storage failed"); } } });
  await login(h); assert.match(h.controller.getSnapshot().notice, /chưa lưu/);
  await h.controller.logout(); assert.equal(h.controller.getSnapshot().session, null);
  fail = false; await login(h, "B");
  assert.equal(h.saved(), session("B").token);
  assert.equal(h.controller.getSnapshot().notice, null);
});

test("tokenStore compare-and-delete never removes a different saved token", async () => {
  const h = harness({ initial: session("A").token });
  await h.store.set(session("B").token);
  await h.store.clearIf(session("A").token);
  assert.equal(await h.store.get(), session("B").token);
  await h.store.clearIf(session("B").token);
  assert.equal(await h.store.get(), null);
});

test("login response arriving after logout cannot resurrect a session", async () => {
  const response = deferred();
  const h = harness({ fetcher: () => response.promise });
  const pending = login(h); const failure = assert.rejects(pending, { code: "SESSION_CHANGED" });
  await h.controller.logout(); response.resolve(ok(session("A"))); await failure;
  assert.equal(h.controller.getSnapshot().session, null);
  assert.equal(h.saved(), null);
});

test("HTTP timeout abort during restore keeps saved session unverified", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const h = harness({ initial: session("A").token,
    fetcher: (path, options) => new Promise((resolve, reject) => {
      options.signal.addEventListener("abort", () => reject(new DOMException("timeout", "AbortError")), { once: true });
    }) });
  const pending = h.controller.restore(); await turn();
  t.mock.timers.tick(10000); await pending;
  assert.equal(h.saved(), session("A").token);
  assert.equal(h.controller.getSnapshot().session, null);
  assert.match(h.controller.getSnapshot().notice, /Chưa xác minh/);
});

test("restore token read arriving after login started cannot verify or restore old user", async () => {
  const read = deferred();
  const h = harness({ initial: session("A").token, storage: { get: () => read.promise } });
  const restoring = h.controller.restore(); await turn();
  const next = login(h, "B"); await turn();
  read.resolve(session("A").token); await Promise.all([restoring, next]);
  assert.equal(h.calls.some((x) => x.path === "/auth/me"), false);
  assert.deepEqual(h.controller.getSnapshot().session, session("B"));
  assert.equal(h.saved(), session("B").token);
});

test("A's 401 during B's storage save cannot delete B", async () => {
  const save = deferred();
  const h = harness({ fetcher: (path, options) => path === "/private" ? denied() : ok(session(JSON.parse(options.body).username)),
    storage: { set: (value) => value === session("B").token ? save.promise : Promise.resolve() } });
  await login(h);
  const next = login(h, "B"); await turn();
  const pending = h.controller.request("/private");
  const failed = assert.rejects(pending, { status: 401 }); await turn();
  save.resolve(); await Promise.all([next, failed]);
  assert.deepEqual(h.controller.getSnapshot().session, session("B"));
  assert.equal(h.saved(), session("B").token);
});
