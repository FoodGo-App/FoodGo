import React, { useState } from "react";
import { View } from "react-native";
import { useApp } from "../../../providers/AppProvider";
import {
  Button,
  Chip,
  Empty,
  LoadState,
  RequireRole,
  Screen,
} from "../../../shared/components/ui";
import { useResource } from "../../../shared/hooks/useResource";
import { orderService } from "../services/orderService";
import { OrderCard } from "../components/OrderCard";
import type { Order } from "../../../shared/types/domain";
export default function OrdersScreen() {
  return (
    <RequireRole roles={["CUSTOMER"]}>
      <Orders />
    </RequireRole>
  );
}
function Orders() {
  const { request } = useApp();
  const [status, setStatus] = useState(""),
    [page, setPage] = useState(0),
    [previous, setPrevious] = useState<Order[]>([]);
  const query = useResource(
    () => orderService(request).list(page, status),
    true,
    true,
    `orders:${page}:${status}`,
  );

  const items = [...previous, ...(query.data?.content ?? [])].filter(
    (x, i, all) => all.findIndex((o) => o.id === x.id) === i,
  );
  return (
    <Screen
      title="Đơn hàng của bạn"
      subtitle="Theo dõi từng bước, từ bếp đến tay bạn."
      onRefresh={() => {
        setPage(0);
        setPrevious([]);
        void query.reload();
      }}
    >
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {[
          ["", "Tất cả"],
          ["PENDING_CONFIRMATION", "Chờ xác nhận"],
          ["OUT_FOR_DELIVERY", "Đang giao"],
          ["DELIVERED", "Hoàn tất"],
        ].map(([value, label]) => (
          <Chip
            key={value}
            title={label}
            selected={status === value}
            onPress={() => {
              setPrevious([]);
              setPage(0);
              setStatus(value);
            }}
          />
        ))}
      </View>
      <LoadState
        loading={query.loading}
        error={query.error}
        retry={() => {
          void query.reload();
        }}
      />
      {!query.loading && !items.length && !query.error && (
        <Empty
          title="Chưa có đơn trong nhóm này"
          detail="Các đơn đã đặt sẽ xuất hiện tại đây."
        />
      )}
      {items.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
      {query.data?.hasNext && (
        <Button
          title="Xem thêm đơn"
          variant="secondary"
          onPress={() => {
            setPrevious(items);
            setPage((n) => n + 1);
          }}
        />
      )}
    </Screen>
  );
}
