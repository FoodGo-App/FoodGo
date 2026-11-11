import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { useApp } from "../../providers/AppProvider";
type Result<T> = {
  scope: string;
  data: T | null;
  error: string | null;
  updatedAt: string | null;
};
export function useResource<T>(
  load: () => Promise<T>,
  enabled = true,
  poll = false,
  key = "default",
) {
  const { session, revision } = useApp();
  const scope = `${session?.user.id ?? "guest"}:${key}`;
  const fn = useRef(load);
  useLayoutEffect(() => {
    fn.current = load;
  }, [load]);
  const [result, setResult] = useState<Result<T> | null>(null);
  const generation = useRef(0),
    focused = useRef(false),
    fetching = useRef<number | null>(null);
  const reload = useCallback(
    async (force = true) => {
      if (
        !enabled ||
        !focused.current ||
        AppState.currentState !== "active" ||
        (!force && fetching.current !== null)
      )
        return;
      const g = ++generation.current;
      fetching.current = g;
      try {
        const value = await fn.current();
        if (g === generation.current)
          setResult({
            scope,
            data: value,
            error: null,
            updatedAt: new Date().toISOString(),
          });
      } catch (e) {
        if (g === generation.current)
          setResult((previous) => ({
            scope,
            data: previous?.scope === scope ? previous.data : null,
            error: e instanceof Error ? e.message : "Không tải được dữ liệu.",
            updatedAt: previous?.scope === scope ? previous.updatedAt : null,
          }));
      } finally {
        if (fetching.current === g) fetching.current = null;
      }
    },
    [enabled, scope],
  );
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      void reload();
      const listener = AppState.addEventListener("change", (state) => {
        if (state === "active") void reload();
        else generation.current++;
      });
      const timer = poll
        ? setInterval(() => {
            void reload(false);
          }, 5000)
        : null;
      return () => {
        focused.current = false;
        generation.current++;
        if (timer) clearInterval(timer);
        listener.remove();
      };
    }, [reload, poll]),
  );
  useEffect(() => {
    if (focused.current) void reload();
  }, [revision, reload]);
  const visible = result?.scope === scope ? result : null;
  return {
    data: visible?.data ?? null,
    error: visible?.error ?? null,
    loading: enabled && !visible,
    updatedAt: visible?.updatedAt ?? null,
    reload,
  };
}
