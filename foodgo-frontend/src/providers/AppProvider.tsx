import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
  useSyncExternalStore,
} from "react";
import type { Requester, Session } from "../shared/types/domain";
import { DemoEngine } from "../shared/api/demo";
import { ApiError, httpRequest } from "../shared/api/http";
import { config } from "../shared/config/env";
import { readStore, tokenStore, writeStore } from "../shared/storage/store";
import { createSessionController } from "./sessionController";

type Context = {
  session: Session | null;
  restoring: boolean;
  request: Requester;
  login: (username: string, password: string) => Promise<Session>;
  cancelLogin: () => void;
  getSession: () => Session | null;
  logout: () => Promise<void>;
  revision: number;
  sessionGeneration: number;
  mode: "demo" | "api";
  storageError: string | null;
};
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null),
    [restoring, setRestoring] = useState(true),
    [revision, setRevision] = useState(0),
    [demoGeneration, setDemoGeneration] = useState(0),
    [storageError, setStorageError] = useState<string | null>(null);
  const [api] = useState(() => createSessionController(tokenStore,
    (token, path, method, body, key) => httpRequest(config.apiUrl, token, path, method, body, key)));
  const auth = useSyncExternalStore(api.subscribe, api.getSnapshot, api.getSnapshot);
  const demoLoginIntent = useRef(0);
  const engine = useRef(new DemoEngine()),
    currentSession = useRef<Session | null>(null),
    writes = useRef(Promise.resolve());
  const setCurrent = useCallback((next: Session | null) => {
    currentSession.current = next;
    setSession(next);
    setDemoGeneration((n) => n + 1);
    setRevision((n) => n + 1);
  }, []);
  useEffect(() => {
    let alive = true;
    if (config.mode === "api") {
      void api.restore(() => alive);
    } else {
      (async () => {
        try {
          const saved = await readStore<ReturnType<DemoEngine["snapshot"]>>("demo-server");
          if (alive && saved) engine.current = new DemoEngine(saved);
        } catch {
          if (alive) setStorageError("Không đọc được dữ liệu đã lưu trên thiết bị.");
        } finally {
          if (alive) setRestoring(false);
        }
      })();
    }
    return () => { alive = false; };
  }, [api]);
  const request: Requester = useCallback(
    async <T,>(path: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: unknown, key?: string): Promise<T> => {
      if (config.mode === "api") return api.request<T>(path, method, body, key);
      const result = engine.current.request(currentSession.current?.user.id ?? null,
        path, method, body, key) as T;
      if (method !== "GET") {
        const snapshot = engine.current.snapshot();
        writes.current = writes.current.catch(() => {}).then(() => writeStore("demo-server", snapshot));
        try { await writes.current; setStorageError(null); }
        catch { setStorageError("Chưa lưu được phiên demo. Không đảm bảo phục hồi khi đóng app."); }
        setRevision((n) => n + 1);
      }
      return result;
    }, [api]);
  const login = useCallback(async (username: string, password: string) => {
    if (config.mode === "api") return api.login(username, password);
    const ticket = ++demoLoginIntent.current;
    const next = await request<Session>("/auth/login", "POST", { username, password });
    if (ticket !== demoLoginIntent.current) throw new ApiError("SESSION_CHANGED", "Đăng nhập đã bị hủy.");
    setCurrent(next);
    return next;
  }, [api, request, setCurrent]);
  const getSession = useCallback(() => config.mode === "api" ? api.getSnapshot().session : currentSession.current, [api]);
  const cancelLogin = useCallback(() => {
    demoLoginIntent.current++;
    api.cancelLogin();
  }, [api]);
  const logout = useCallback(async () => {
    if (config.mode === "api") return api.logout();
    // Demo logout is local and must not wait for persisting the demo snapshot.
    demoLoginIntent.current++;
    const owner = currentSession.current;
    setCurrent(null);
    engine.current.request(owner?.user.id ?? null, "/auth/logout", "POST", {});
  }, [api, setCurrent]);
  return (
    <AppContext.Provider value={{
      session: config.mode === "api" ? auth.session : session,
      restoring: config.mode === "api" ? auth.restoring : restoring,
      request, login, logout, cancelLogin, getSession,
      revision: revision + (config.mode === "api" ? auth.generation : 0),
      sessionGeneration: config.mode === "api" ? auth.generation : demoGeneration,
      mode: config.mode,
      storageError: config.mode === "api" ? auth.notice : storageError,
    }}>
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppProvider missing");
  return context;
}
