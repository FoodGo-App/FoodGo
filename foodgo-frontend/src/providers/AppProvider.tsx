import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Requester, Session, User } from "../shared/types/domain";
import { DemoEngine } from "../shared/api/demo";
import { ApiError, httpRequest } from "../shared/api/http";
import { config } from "../shared/config/env";
import { readStore, tokenStore, writeStore } from "../shared/storage/store";

type Context = {
  session: Session | null;
  restoring: boolean;
  request: Requester;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  revision: number;
  mode: "demo" | "api";
  storageError: string | null;
};
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null),
    [restoring, setRestoring] = useState(true),
    [revision, setRevision] = useState(0),
    [storageError, setStorageError] = useState<string | null>(null);
  const engine = useRef(new DemoEngine()),
    currentSession = useRef<Session | null>(null),
    writes = useRef(Promise.resolve());
  const setCurrent = useCallback((next: Session | null) => {
    currentSession.current = next;
    setSession(next);
    setRevision((n) => n + 1);
  }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (config.mode === "demo") {
          const saved =
            await readStore<ReturnType<DemoEngine["snapshot"]>>("demo-server");
          if (saved) engine.current = new DemoEngine(saved);
        } else {
          const token = await tokenStore.get();
          if (token) {
            try {
              const user = await httpRequest<User>(
                config.apiUrl,
                token,
                "/auth/me",
              );
              if (alive) setCurrent({ token, user });
            } catch {
              setStorageError(
                "Chưa xác minh được phiên. Hãy đăng nhập lại khi có mạng.",
              );
            }
          }
        }
      } catch {
        if (alive)
          setStorageError("Không đọc được dữ liệu đã lưu trên thiết bị.");
      } finally {
        if (alive) setRestoring(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [setCurrent]);
  const request: Requester = useCallback(
    async <T,>(
      path: string,
      method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
      body?: unknown,
      key?: string,
    ): Promise<T> => {
      if (config.mode === "api") {
        try {
          return await httpRequest<T>(
            config.apiUrl,
            currentSession.current?.token ?? null,
            path,
            method,
            body,
            key,
          );
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.status === 401 &&
            path !== "/auth/login"
          ) {
            await tokenStore.set(null);
            setCurrent(null);
          }
          throw error;
        }
      }
      const result = engine.current.request(
        currentSession.current?.user.id ?? null,
        path,
        method,
        body,
        key,
      ) as T;
      if (method !== "GET") {
        const snapshot = engine.current.snapshot();
        writes.current = writes.current
          .catch(() => {})
          .then(() => writeStore("demo-server", snapshot));
        try {
          await writes.current;
          setStorageError(null);
        } catch {
          setStorageError(
            "Chưa lưu được phiên demo. Không đảm bảo phục hồi khi đóng app.",
          );
        }
        setRevision((n) => n + 1);
      }
      return result;
    },
    [setCurrent],
  );
  const login = useCallback(
    async (username: string, password: string) => {
      const next = await request<Session>("/auth/login", "POST", {
        username,
        password,
      });
      if (config.mode === "api") await tokenStore.set(next.token);
      setCurrent(next);
    },
    [request, setCurrent],
  );
  const logout = useCallback(async () => {
    let failure = false;
    try {
      await request("/auth/logout", "POST", {});
    } catch {
      failure = true;
    } finally {
      await tokenStore.set(null);
      setCurrent(null);
    }
    if (failure)
      setStorageError(
        "Đã thoát trên thiết bị; chưa xác nhận thu hồi phiên máy chủ.",
      );
  }, [request, setCurrent]);
  return (
    <AppContext.Provider
      value={{
        session,
        restoring,
        request,
        login,
        logout,
        revision,
        mode: config.mode,
        storageError,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppProvider missing");
  return context;
}
