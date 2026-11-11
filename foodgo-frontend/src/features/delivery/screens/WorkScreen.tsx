import React, { useState } from "react";
import { router } from "expo-router";
import { View } from "react-native";
import { useApp } from "../../../providers/AppProvider";
import {
  Banner,
  Button,
  Card,
  Chip,
  Empty,
  Heading,
  Label,
  LoadState,
  RequireRole,
  Screen,
  styles,
} from "../../../shared/components/ui";
import { useResource } from "../../../shared/hooks/useResource";
import { deliveryService } from "../services/deliveryService";
import { OrderCard } from "../../orders/components/OrderCard";
import { explain, money } from "../../../shared/theme/theme";
import type { DriverOffer, Order, Page } from "../../../shared/types/domain";
export default function WorkScreen() {
  return (
    <RequireRole roles={["RESTAURANT", "DRIVER"]}>
      <Work />
    </RequireRole>
  );
}
function Work() {
  const { request, session } = useApp();
  const role = session!.user.role;
  const [tab, setTab] = useState("active"),
    [page, setPage] = useState(0),
    [previous, setPrevious] = useState<(Order | DriverOffer)[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const service = deliveryService(request);
  const query = useResource<Page<Order | DriverOffer>>(
    () =>
      role === "RESTAURANT"
        ? service.restaurant(page)
        : tab === "offers"
          ? service.offers(page)
          : service.jobs(page, tab),
    true,
    true,
    `work:${role}:${tab}:${page}`,
  );
  const items = [...previous, ...(query.data?.content ?? [])].filter(
    (x, i, a) => a.findIndex((y) => y.id === x.id) === i,
  );
  const action = async (offer: DriverOffer, accept: boolean) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await service.offerAction(
        offer.id,
        accept ? "accept" : "decline",
      );
      if (accept)
        router.push({ pathname: "/orders/[id]", params: { id: result.id } });
      else await query.reload();
    } catch (e) {
      setError(explain(e));
      await query.reload();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      title={role === "RESTAURANT" ? "Gian bếp của bạn" : "Chuyến giao hôm nay"}
      subtitle={
        role === "RESTAURANT"
          ? "Chăm chút từng bữa ăn."
          : "Nhận món đúng lúc, giao bằng sự tận tâm."
      }
      onRefresh={() => {
        setPrevious([]);
        setPage(0);
        void query.reload();
      }}
    >
      <Button
        title="Tài khoản / đổi vai trò demo"
        variant="ghost"
        onPress={() => router.push("/account")}
      />
      {role === "DRIVER" && (
        <View style={styles.row}>
          {[
            ["active", "Đang giao"],
            ["offers", "Đề xuất"],
            ["history", "Lịch sử"],
          ].map(([v, label]) => (
            <Chip
              key={v}
              title={label}
              selected={tab === v}
              onPress={() => {
                setPrevious([]);
                setPage(0);
                setTab(v);
              }}
            />
          ))}
        </View>
      )}
      <LoadState
        loading={query.loading}
        error={query.error}
        retry={() => {
          void query.reload();
        }}
      />
      {error && <Banner error>{error}</Banner>}
      {!query.loading && !items.length && !query.error && (
        <Empty
          title={
            tab === "offers" ? "Chưa có đề xuất giao" : "Chưa có công việc"
          }
          detail="Các đơn đúng phạm vi tài khoản sẽ xuất hiện ở đây."
        />
      )}
      {items.map((item) =>
        "codAmount" in item ? (
          <Card key={item.id}>
            <Heading>{item.restaurantName}</Heading>
            <Label muted>
              Khu vực giao:{" "}
              {item.areaCode === "AREA_A" ? "Khu vực A" : item.areaCode}
            </Label>
            <View style={styles.between}>
              <Label>COD cần thu</Label>
              <Heading>{money(item.codAmount)}</Heading>
            </View>
            <Banner>
              Địa chỉ chi tiết và liên hệ khách chỉ hiển thị sau khi nhận giao.
            </Banner>
            <Button
              title="Nhận đơn giao"
              busy={busy}
              onPress={() => {
                void action(item, true);
              }}
            />
            <Button
              title="Bỏ qua đề xuất"
              variant="ghost"
              busy={busy}
              onPress={() => {
                void action(item, false);
              }}
            />
          </Card>
        ) : (
          <OrderCard key={item.id} order={item} />
        ),
      )}
      {query.data?.hasNext && (
        <Button
          title="Xem thêm"
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
