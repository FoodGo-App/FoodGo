import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/http";
// No automatic mutation retry. An ambiguous network result requires a successful
// authoritative read before the user can explicitly submit a new operation.
export function useWriteAction() {
  const lock = useRef(false), alive = useRef(true);
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [uncertain, setUncertain] = useState(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const run = useCallback(async (work: () => Promise<unknown>, success?: () => void) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null);
    try { await work(); if (alive.current) success?.(); }
    catch (e) {
      if (alive.current) {
        const ambiguous = e instanceof ApiError && (e.status === 0 || e.status >= 500);
        setUncertain(ambiguous); setError((e instanceof Error ? e.message : "Thao tác chưa thành công.") + (ambiguous ? " Kết quả chưa rõ; hãy đọc lại trạng thái trước khi xác nhận thao tác mới." : ""));
      }
    } finally { lock.current = false; if (alive.current) setBusy(false); }
  }, []);
  return { busy, error, uncertain, run, reconciled: () => { setUncertain(false); setError(null); } };
}
