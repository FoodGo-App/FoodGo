import { ApiError } from "../shared/api/http.ts";
import type { Requester, Session, User } from "../shared/types/domain.ts";
import type { TokenStore } from "../shared/storage/tokenStore.ts";

type Send = <T>(token: string | null, path: string, method?: string,
  body?: unknown, key?: string) => Promise<T>;
export type SessionState = {
  session: Session | null;
  restoring: boolean;
  generation: number;
  notice: string | null;
};
const changed = () => new ApiError("SESSION_CHANGED", "Phiên đã thay đổi. Hãy thử lại.");
const removalWarning = "Chưa xóa được phiên đã lưu trên thiết bị. Phiên có thể còn trong bộ nhớ an toàn khi mở lại app.";

// This is the API-mode session lifecycle used by AppProvider, with injected I/O.
export function createSessionController(store: TokenStore, send: Send) {
  let state: SessionState = { session: null, restoring: true, generation: 0, notice: null };
  let intent = 0;
  const listeners = new Set<() => void>();
  function publish(patch: Partial<SessionState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }
  function transition(session: Session | null, notice: string | null = null) {
    publish({ session, notice, restoring: false, generation: state.generation + 1 });
    return state.generation;
  }
  function warnRemoval(generation: number, prefix: string) {
    if (generation === state.generation) publish({ notice: `${prefix} ${removalWarning}` });
  }
  async function restore(alive: () => boolean = () => true) {
    const ticket = intent;
    const current = () => alive() && ticket === intent;
    let token: string | null;
    try {
      token = await store.get();
    } catch {
      if (current()) publish({ restoring: false, notice: "Không đọc được phiên đã lưu trên thiết bị. Hãy đăng nhập lại." });
      return;
    }
    if (!current()) return;
    if (!token) { publish({ restoring: false }); return; }
    try {
      const user = await send<User>(token, "/auth/me");
      if (current()) transition({ token, user });
    } catch (error) {
      if (!current()) return;
      if (error instanceof ApiError && error.status === 401) {
        const message = "Phiên đã bị máy chủ từ chối. Hãy đăng nhập lại.";
        const generation = transition(null, message);
        try { await store.clearIf(token); }
        catch { if (current()) warnRemoval(generation, message); }
      } else {
        // Keep the stored token for verification later, but expose no private user.
        publish({ session: null, restoring: false,
          notice: "Chưa xác minh được phiên do lỗi kết nối hoặc máy chủ. Chưa hiển thị dữ liệu riêng; hãy thử đăng nhập khi có mạng." });
      }
    }
  }
  const request: Requester = async <T>(path: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: unknown, key?: string): Promise<T> => {
    const owner = state.session;
    const generation = state.generation;
    const current = () => generation === state.generation && owner === state.session;
    try {
      const result = await send<T>(owner?.token ?? null, path, method, body, key);
      if (owner && !current()) throw changed();
      return result;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && path !== "/auth/login" && owner && current()) {
        const message = "Phiên đã hết hiệu lực. Hãy đăng nhập lại.";
        const cleared = transition(null, message);
        try { await store.clearIf(owner.token); }
        catch { warnRemoval(cleared, message); }
      }
      // Preserve INVALID_CREDENTIALS/401 and all other API errors for the form.
      throw error;
    }
  };
  async function login(username: string, password: string) {
    const ticket = ++intent;
    const priorGeneration = state.generation;
    publish({ restoring: false });
    const next = await send<Session>(null, "/auth/login", "POST", { username, password });
    if (ticket !== intent) throw changed();
    let notice: string | null = null;
    try { await store.set(next.token); }
    catch { notice = "Đã đăng nhập nhưng chưa lưu được phiên trên thiết bị. Không đảm bảo khôi phục khi mở lại app."; }
    if (ticket !== intent) {
      // An earlier save may already have started. Never delete a newer saved token.
      try { await store.clearIf(next.token); }
      catch { warnRemoval(priorGeneration, "Đăng nhập đã bị hủy;"); }
      throw changed();
    }
    transition(next, notice);
    return next;
  }
  async function logout() {
    ++intent;
    const owner = state.session;
    const generation = transition(null, "Đã thoát giao diện; đang xác nhận xóa phiên lưu và thu hồi trên máy chủ.");
    // Queue deletion now, before any later login can enqueue its save. UI is
    // already Guest, even if native storage or the network never resolves.
    const local = store.set(null);
    const remote = owner
      ? Promise.resolve().then(async () => {
          const result = await send<{ revoked?: boolean }>(owner.token, "/auth/logout", "POST", {});
          if (result?.revoked !== true) throw new ApiError("LOGOUT_UNCONFIRMED", "Chưa xác nhận thu hồi phiên.");
        })
      : Promise.resolve();
    const report = (notice: string) => {
      if (generation === state.generation) publish({ notice });
    };
    let localDone = false, remoteDone = !owner, localFailed = false, remoteFailed = false;
    const update = () => {
      const parts = ["Đã thoát giao diện."];
      if (!localDone) parts.push("Đang xóa phiên đã lưu trên thiết bị.");
      else if (localFailed) parts.push(removalWarning);
      if (!remoteDone) parts.push("Chưa xác nhận thu hồi phiên máy chủ.");
      else if (remoteFailed) parts.push("Chưa xác nhận thu hồi phiên máy chủ; phiên có thể còn hiệu lực.");
      report(localDone && remoteDone && !localFailed && !remoteFailed ? (owner ? "Đã đăng xuất và thu hồi phiên máy chủ." : "Đã thoát giao diện và xóa phiên lưu; không có phiên đã xác minh để thu hồi máy chủ.") : parts.join(" "));
    };
    await Promise.all([
      local.then(() => {}, () => { localFailed = true; }).then(() => { localDone = true; update(); }),
      remote.then(() => {}, () => { remoteFailed = true; }).then(() => { remoteDone = true; update(); }),
    ]);
  }
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    restore, request, login, logout,
    cancelLogin: () => { ++intent; publish({ restoring: false }); },
  };
}
