import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "../../providers/AppProvider";
import { readStore, writeStore } from "../storage/store";
export function useDraft<T>(kind: string, id: string, initial: T) {
  const { session } = useApp();
  const key = `draft:${session?.user.id ?? "guest"}:${kind}:${id}`;
  const [defaultValue] = useState(initial);
  const [state, setState] = useState({
    key: "",
    value: defaultValue,
    ready: false,
    saved: false,
    error: null as string | null,
  });
  const chain = useRef(Promise.resolve());
  useEffect(() => {
    let alive = true;
    readStore<T>(key)
      .then((value) => {
        if (alive)
          setState({
            key,
            value: value ?? defaultValue,
            ready: true,
            saved: false,
            error: null,
          });
      })
      .catch(() => {
        if (alive)
          setState({
            key,
            value: defaultValue,
            ready: true,
            saved: false,
            error: "Không đọc được bản nháp.",
          });
      });
    return () => {
      alive = false;
    };
  }, [key, defaultValue]);
  const update = useCallback(
    (value: T) => {
      setState({ key, value, ready: true, saved: false, error: null });
      const pending = chain.current
        .catch(() => {})
        .then(() => writeStore(key, value));
      chain.current = pending;
      pending
        .then(() =>
          setState((previous) =>
            previous.key === key
              ? { ...previous, saved: true, error: null }
              : previous,
          ),
        )
        .catch(() =>
          setState((previous) =>
            previous.key === key
              ? { ...previous, error: "Không lưu được bản nháp." }
              : previous,
          ),
        );
      return pending;
    },
    [key],
  );
  return state.key === key
    ? { ...state, update }
    : { value: defaultValue, ready: false, saved: false, error: null, update };
}
