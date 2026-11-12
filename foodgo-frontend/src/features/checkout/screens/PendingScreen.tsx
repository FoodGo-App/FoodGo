import React, { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import {
  Banner,
  Button,
  Card,
  Heading,
  Label,
  LoadState,
  Panda,
  RequireRole,
  Screen,
} from "../../../shared/components/ui";
import { useResource } from "../../../shared/hooks/useResource";
import { checkoutService } from "../services/checkoutService";
import { removeStore, writeStore } from "../../../shared/storage/store";
import { attemptReference, checkoutMessage, readAttempt } from "../checkoutFlow";
import { SuccessMotion } from "../../../shared/components/Motion";
import type { Attempt } from "../../../shared/types/domain";
export default function PendingScreen() {
  return (
    <RequireRole roles={["CUSTOMER"]}>
      <Pending />
    </RequireRole>
  );
}
function Pending() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { request, session } = useApp();
  const service = checkoutService(request);
  const lookup = useRef({ route: id, attempt: id });
  const query = useResource(async () => {
    const attempt = await readAttempt(service, lookup.current.route === id ? lookup.current.attempt : id);
    lookup.current = { route: id, attempt: attempt.id };
    return attempt;
  }, true, true, id);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    if (query.data?.result !== 'PENDING') return;
    void writeStore(`checkout:${session!.user.id}`, attemptReference(query.data)).catch(() => setError('Chưa lưu được thanh toán đang chờ. Hãy kiểm tra kết quả trước khi rời màn hình.'));
  }, [query.data, session]);
  const finish = async (a: Attempt) => {
    if (a.result === "PENDING") {
      await query.reload();
      return;
    }
    await removeStore(`checkout:${session!.user.id}`);
    if (a.orderId)
      router.replace({
        pathname: "/orders/[id]",
        params: { id: a.orderId, ...(a.result === "SUCCEEDED" ? { success: "1" } : {}) },
      });
    else router.replace("/checkout/review");
  };
  const action = async (cancel = false) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      const attemptId = query.data?.id ?? id;
      await finish(await (cancel ? service.cancel(attemptId) : service.resolve(attemptId)));
    } catch (e) {
      setError(checkoutMessage(e));
      void query.reload();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const panda = <Panda size={170} pose={query.data?.result === "SUCCEEDED" ? "success" : query.data?.result === "PENDING" ? "waiting" : "empty"} />;
  return (
    <Screen
      title="Thanh toán ví"
      subtitle="Ví thử nghiệm · Không chuyển tiền thật"
      back
    >
      {query.data?.result === "SUCCEEDED" ? <SuccessMotion>{panda}</SuccessMotion> : panda}
      <LoadState
        loading={query.loading}
        error={query.error ? checkoutMessage(query.error) : null}
        retry={() => {
          void query.reload();
        }}
      />
      {error && <Banner error>{error}</Banner>}
      {query.data && (
        <Card>
          <Heading>
            {{ PENDING: "Đang chờ thanh toán", SUCCEEDED: "Đã đặt món thành công", FAILED: "Thanh toán chưa thành công", CANCELLED: "Đã hủy thanh toán", REFUNDED: "Đã hoàn khoản thanh toán thử nghiệm" }[query.data.result]}
          </Heading>
          {query.data.result === "PENDING" ? <Banner>Đơn sẽ được tạo khi ví thử nghiệm xác nhận thành công. Bạn có thể kiểm tra kết quả hoặc hủy thanh toán.</Banner> : query.data.reasonCode ? <Label muted>{checkoutMessage(query.data.reasonCode)}</Label> : null}
          {query.data.result === "PENDING" ? (
            <>
              <Button
                title="Kiểm tra kết quả ví"
                busy={busy}
                onPress={() => {
                  void action();
                }}
              />
              <Button
                title="Hủy lần thanh toán"
                busy={busy}
                variant="ghost"
                onPress={() => {
                  void action(true);
                }}
              />
            </>
          ) : (
            <Button
              title={
                query.data.orderId ? "Xem đơn đã tạo" : "Quay lại kiểm tra đơn"
              }
              busy={busy}
              onPress={() => {
                void finish(query.data!);
              }}
            />
          )}
        </Card>
      )}
      {query.error && <Button title="Quay lại kiểm tra đơn" variant="secondary" onPress={() => router.replace("/checkout/review")} />}
    </Screen>
  );
}
