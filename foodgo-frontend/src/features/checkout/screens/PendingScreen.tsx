import React, { useState } from "react";
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
import { removeStore } from "../../../shared/storage/store";
import { explain, statusLabels } from "../../../shared/theme/theme";
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
  const query = useResource(() => service.attempt(id), true, true, id);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const finish = async (a: Attempt) => {
    if (a.result === "PENDING") {
      await query.reload();
      return;
    }
    await removeStore(`checkout:${session!.user.id}`);
    if (a.orderId)
      router.replace({
        pathname: "/orders/[id]",
        params: { id: a.orderId, success: "1" },
      });
    else router.replace("/checkout/review");
  };
  const action = async (cancel = false) => {
    setBusy(true);
    setError(null);
    try {
      await finish(await (cancel ? service.cancel(id) : service.resolve(id)));
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      title="Thanh toán ví"
      subtitle="Ví mô phỏng · Không chuyển tiền thật"
      back
    >
      <Panda
        size={170}
        pose={
          query.data?.result === "SUCCEEDED"
            ? "success"
            : query.data?.result === "PENDING"
              ? "waiting"
              : "empty"
        }
      />
      <LoadState
        loading={query.loading}
        error={query.error}
        retry={() => {
          void query.reload();
        }}
      />
      {error && <Banner error>{error}</Banner>}
      {query.data && (
        <Card>
          <Heading>
            {statusLabels[query.data.result] ?? query.data.result}
          </Heading>
          <Label>Mã lần xử lý: {query.data.id}</Label>
          <Banner>
            Ví đang chờ chưa có nghĩa là đơn đã được tạo. Luôn tra lại cùng lần
            xử lý khi mất phản hồi.
          </Banner>
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
    </Screen>
  );
}
