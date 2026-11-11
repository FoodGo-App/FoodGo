import React, { useState } from "react";
import { router } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import {
  Button,
  Card,
  Empty,
  Heading,
  Label,
  LoadState,
  RequireRole,
  Screen,
} from "../../../shared/components/ui";
import { useResource } from "../../../shared/hooks/useResource";
import { orderService } from "../../orders/services/orderService";
import { deliveryService } from "../../delivery/services/deliveryService";
import type { Order } from "../../../shared/types/domain";
export default function InboxScreen() {
  return (
    <RequireRole roles={["CUSTOMER", "DRIVER"]}>
      <Inbox />
    </RequireRole>
  );
}
function Inbox() {
  const { request, session } = useApp();
  const [page, setPage] = useState(0),
    [previous, setPrevious] = useState<Order[]>([]);
  const query = useResource(
    async () => {
      const [active, history] =
        session!.user.role === "DRIVER"
          ? await Promise.all([
              deliveryService(request).jobs(page, "active"),
              deliveryService(request).jobs(page, "history"),
            ])
          : [
              await orderService(request).list(page),
              { content: [], hasNext: false },
            ];
      return {
        content: [...active.content, ...history.content].filter(
          (o) =>
            o.driverId ||
            ["DRIVER_ASSIGNED", "PICKED_UP", "DELIVERED"].includes(
              o.deliveryStatus,
            ),
        ),
        hasNext: active.hasNext || history.hasNext,
      };
    },
    true,
    true,
    `inbox:${page}`,
  );
  const items = [...previous, ...(query.data?.content ?? [])].filter(
    (o, i, all) => all.findIndex((x) => x.id === o.id) === i,
  );
  return (
    <Screen
      title="Hộp thư"
      subtitle="Trao đổi với người giao món, theo từng đơn."
      onRefresh={() => {
        setPage(0);
        setPrevious([]);
        void query.reload();
      }}
    >
      <LoadState
        loading={query.loading}
        error={query.error}
        retry={() => {
          void query.reload();
        }}
      />
      {!query.loading && !items.length && !query.error && (
        <Empty
          pose="inbox"
          title="Chưa có hội thoại"
          detail="Hội thoại xuất hiện sau khi tài xế nhận giao đơn."
        />
      )}
      {items.map((o) => (
        <Card key={o.id}>
          <Heading>
            {session!.user.role === "DRIVER"
              ? o.recipientName || "Khách của đơn"
              : (o.driverName ?? "Tài xế")}
          </Heading>
          <Label muted>
            {o.restaurantName} · #{o.id}
          </Label>
          <Button
            title="Mở hội thoại"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: "/conversations/[orderId]",
                params: { orderId: o.id },
              })
            }
          />
        </Card>
      ))}
      {query.data?.hasNext && (
        <Button
          title="Xem thêm hội thoại"
          variant="secondary"
          onPress={() => {
            setPrevious(items);
            setPage((p) => p + 1);
          }}
        />
      )}
    </Screen>
  );
}
