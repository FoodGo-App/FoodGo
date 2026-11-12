import { combineResourceData } from "./resourceData";
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
import { explain } from "../theme/theme";
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
  combine?: (previous: T | null, incoming: T) => T,
) {
  const { session, revision, sessionGeneration } = useApp();
  const scope = `${sessionGeneration}:${session?.user.id ?? "guest"}:${key}`;
  const fn = useRef(load);
  const combineRef = useRef(combine);
  useLayoutEffect(() => {
    fn.current = load;
    combineRef.current = combine;
  }, [load, combine]);
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
          setResult((previous) => ({
            scope,
            data: combineResourceData(previous, scope, value, combineRef.current),
            error: null,
            updatedAt: new Date().toISOString(),
          }));
        return g === generation.current;
      } catch (e) {
        if (g === generation.current)
          setResult((previous) => ({
            scope,
            data: previous?.scope === scope ? previous.data : null,
            error: explain(e),
            updatedAt: previous?.scope === scope ? previous.updatedAt : null,
          }));
        return false;
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
