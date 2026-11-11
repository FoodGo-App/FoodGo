import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import {
  Banner,
  Button,
  Card,
  Chip,
  Confirm,
  Field,
  Heading,
  Label,
  LoadState,
  MealItems,
  MoneyRows,
  Panda,
  RequireRole,
  Screen,
  styles,
} from "../../../shared/components/ui";
import { SimulatedMap } from "../../../shared/components/SimulatedMap";
import { FoodThumbnail } from "../../../shared/components/FoodThumbnail";
import { useResource } from "../../../shared/hooks/useResource";
import {
  colors,
  dateTime,
  explain,
  money,
  statusLabels,
} from "../../../shared/theme/theme";
import { newRequestKey } from "../../../shared/utils/id";
import { orderService } from "../services/orderService";
import { deliveryService } from "../../delivery/services/deliveryService";
export default function OrderDetailScreen() {
  return (
    <RequireRole roles={["CUSTOMER", "RESTAURANT", "DRIVER"]}>
      <Detail />
    </RequireRole>
  );
}
function Detail() {
  const { id, success } = useLocalSearchParams<{
    id: string;
    success?: string;
  }>();
  const { request, session } = useApp();
  const query = useResource(
    () => orderService(request).detail(id),
    true,
    true,
    id,
  );
  const role = session!.user.role;
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [cod, setCod] = useState(false);
  const issueKey = useRef<string | null>(null);
  const service = deliveryService(request);
  const order = query.data;
  const tracking = useResource(
    () => orderService(request).tracking(id),
    role !== "RESTAURANT" && !!order?.driverId,
    true,
    `tracking:${id}`,
  );
  const act = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      setReason("");
      await query.reload();
    } catch (e) {
      setError(explain(e));
      await query.reload();
    } finally {
      setBusy(false);
    }
  };
  const confirmAction = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setReason("");
      await query.reload();
    } catch (e) {
      setError(explain(e));
      await query.reload();
      throw new Error(explain(e));
    } finally {
      setBusy(false);
    }
  };
  const has = (action: string) => order?.allowedActions?.includes(action);
  if (success === "1" && role === "CUSTOMER" && order)
    return (
      <Screen title="Đặt món thành công!" subtitle={`Mã đơn #${id}`} back>
        <Panda pose="success" size={220} />
        <View style={{ alignItems: "center", gap: 12 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: colors.brand,
              textAlign: "center",
            }}
          >
            {statusLabels[order.status]}
          </Text>
          <Text style={[styles.muted, { textAlign: "center" }]}>
            Đơn đã được ghi nhận. Bạn có thể theo dõi xác nhận của quán và hành
            trình giao món.
          </Text>
        </View>
        <Card>
          <View style={styles.row}>
            <FoodThumbnail
              foodId={order.items[0]?.foodId}
              imageCode={order.items[0]?.imageCode}
              size={76}
            />
            <View style={{ flex: 1, gap: 6 }}>
              <Heading>{order.restaurantName}</Heading>
              <Label muted>
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} phần
                · {order.paymentMethod === "COD" ? "Tiền mặt" : "Ví mô phỏng"}
              </Label>
              <Text style={styles.bigPrice}>{money(order.total)}</Text>
            </View>
          </View>
        </Card>
        <Button
          title="Theo dõi đơn"
          onPress={() =>
            router.replace({ pathname: "/orders/[id]", params: { id } })
          }
        />
        <Button
          title="Về trang chủ"
          variant="ghost"
          onPress={() => router.replace("/(customer)/(tabs)/home")}
        />
      </Screen>
    );
  return (
    <Screen
      title="Chi tiết đơn"
      subtitle={id ? `Mã đơn #${id}` : undefined}
      back
      onRefresh={() => {
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
      {error && <Banner error>{error}</Banner>}
      {order && (
        <>
          <Card>
            <Text
              style={{ fontSize: 22, fontWeight: "800", color: colors.brand }}
            >
              {statusLabels[order.status]}
            </Text>
            <View style={styles.between}>
              <Label muted>Giao nhận</Label>
              <Label>{statusLabels[order.deliveryStatus]}</Label>
            </View>
            <View style={styles.between}>
              <Label muted>
                {order.paymentMethod === "COD" ? "Tiền mặt" : "Ví mô phỏng"}
              </Label>
              <Label>{statusLabels[order.paymentStatus]}</Label>
            </View>
            {query.updatedAt && (
              <Label muted>Cập nhật lúc {dateTime(query.updatedAt)}</Label>
            )}
          </Card>
          {order.driverId && role !== "RESTAURANT" && (
            <>
              {tracking.error && <Banner error>{tracking.error}</Banner>}
              {tracking.data &&
                (tracking.data.mapAssetCode === "AREA_A" ? (
                  <SimulatedMap etaMinutes={tracking.data.etaMinutes} />
                ) : (
                  <Banner>Chưa có bản đồ mẫu cho khu vực của đơn này.</Banner>
                ))}
              <Card>
                <Heading>{order.driverName ?? "Tài xế đã nhận"}</Heading>
                <Label muted>
                  Liên hệ theo đơn, chỉ giữa khách hàng và tài xế.
                </Label>
                <Button
                  title="Mở hội thoại"
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: "/conversations/[orderId]",
                      params: { orderId: id },
                    })
                  }
                />
                {has("call") && (
                  <Button
                    title="Gọi mô phỏng"
                    variant="ghost"
                    onPress={() =>
                      router.push({
                        pathname: "/calls/[orderId]",
                        params: { orderId: id },
                      })
                    }
                  />
                )}
              </Card>
            </>
          )}
          {order.issue && (
            <Banner error>
              Trở ngại giao: {order.issue}. Đơn chưa được xác nhận giao thành
              công.
            </Banner>
          )}
          <Card>
            <Heading>Giao đến {order.recipientName}</Heading>
            <Label>{order.addressText}</Label>
            <Label muted>{order.recipientPhone}</Label>
          </Card>
          <Card>
            <Heading>{order.restaurantName}</Heading>
            <MealItems items={order.items} />
            <View style={styles.divider} />
            <MoneyRows data={order} />
          </Card>
          <Heading>Tiến trình đơn hàng</Heading>
          {order.events.map((event, i) => (
            <View
              key={event.id}
              style={[styles.row, { alignItems: "flex-start" }]}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor:
                    i === order.events.length - 1 ? colors.brand : colors.mint,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color:
                      i === order.events.length - 1 ? "white" : colors.brand,
                  }}
                >
                  ✓
                </Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Label>{event.text}</Label>
                <Label muted>{dateTime(event.createdAt)}</Label>
              </View>
            </View>
          ))}
          {role === "CUSTOMER" && (
            <>
              {has("cancel") ? (
                <>
                  <Field
                    label="Lý do hủy (không bắt buộc)"
                    value={reason}
                    onChangeText={setReason}
                    maxLength={300}
                  />
                  <Confirm
                    title="Hủy đơn hàng"
                    detail="Chỉ hủy nếu quán chưa tiếp nhận. Hệ thống kiểm tra lại trạng thái khi xác nhận."
                    onConfirm={() =>
                      confirmAction(() =>
                        orderService(request).cancel(id, reason),
                      )
                    }
                  />
                </>
              ) : (
                !["CANCELLED", "REJECTED", "DELIVERED"].includes(
                  order.status,
                ) && (
                  <Banner>Nhà hàng đã tiếp nhận nên không thể hủy đơn.</Banner>
                )
              )}
              {has("retryDispatch") && (
                <Button
                  title="Tìm lại tài xế"
                  busy={busy}
                  onPress={() => {
                    void act(() => orderService(request).retry(id));
                  }}
                />
              )}
              {order.status === "DELIVERED" && (
                <Button
                  title="Xem / đánh giá tài xế"
                  onPress={() =>
                    router.push({
                      pathname: "/reviews/[orderId]",
                      params: { orderId: id },
                    })
                  }
                />
              )}
            </>
          )}
          {role === "RESTAURANT" && (
            <Card>
              <Heading>Công việc nhà hàng</Heading>
              {has("accept") && (
                <Button
                  title="Nhận đơn"
                  busy={busy}
                  onPress={() => {
                    void act(() => service.restaurantAction(id, "accept"));
                  }}
                />
              )}
              {has("prepare") && (
                <Button
                  title="Bắt đầu chuẩn bị"
                  busy={busy}
                  onPress={() => {
                    void act(() => service.restaurantAction(id, "prepare"));
                  }}
                />
              )}
              {has("ready") && (
                <Button
                  title="Món đã sẵn sàng"
                  busy={busy}
                  onPress={() => {
                    void act(() => service.restaurantAction(id, "ready"));
                  }}
                />
              )}
              {has("reject") && (
                <>
                  <Field
                    label="Lý do từ chối"
                    value={reason}
                    onChangeText={setReason}
                    maxLength={300}
                    multiline
                  />
                  <Confirm
                    title="Từ chối đơn"
                    detail="Đơn sẽ kết thúc; ví mô phỏng được hoàn theo kết quả hệ thống."
                    onConfirm={() => {
                      if (!reason.trim())
                        return Promise.reject(
                          new Error("Vui lòng nhập lý do."),
                        );
                      return confirmAction(() =>
                        service.restaurantAction(id, "reject", reason),
                      );
                    }}
                  />
                </>
              )}
            </Card>
          )}
          {role === "DRIVER" && (
            <Card>
              <Heading>Công việc giao hàng</Heading>
              <Label>
                Cần thu:{" "}
                {money(
                  order.paymentMethod === "COD" &&
                    order.paymentStatus === "UNPAID"
                    ? order.total
                    : 0,
                )}
              </Label>
              {has("pickup") && (
                <Button
                  title="Đã lấy món tại quán"
                  busy={busy}
                  onPress={() => {
                    void act(() => service.pickup(id));
                  }}
                />
              )}
              {!has("pickup") &&
                !has("deliver") &&
                order.status !== "DELIVERED" && (
                  <Banner>
                    Chờ nhà hàng báo món sẵn sàng trước khi lấy món.
                  </Banner>
                )}
              {has("deliver") && (
                <>
                  {order.paymentMethod === "COD" ? (
                    <Chip
                      title={`${cod ? "☑" : "☐"} Tôi đã thu đủ ${money(order.total)} COD`}
                      selected={cod}
                      onPress={() => setCod((v) => !v)}
                    />
                  ) : (
                    <Banner>
                      Đã thanh toán ví mô phỏng. Không thu thêm tiền mặt.
                    </Banner>
                  )}
                  <Confirm
                    title="Xác nhận giao thành công"
                    detail="Chỉ xác nhận sau khi đã giao món và hoàn thành việc thu tiền đúng phương thức."
                    onConfirm={() => {
                      if (order.paymentMethod === "COD" && !cod)
                        return Promise.reject(
                          new Error("Cần xác nhận đã thu đủ COD."),
                        );
                      return confirmAction(() =>
                        service.deliver(
                          id,
                          order.paymentMethod === "COD" && cod,
                        ),
                      );
                    }}
                  />
                  <Field
                    label="Trở ngại giao hàng"
                    value={reason}
                    onChangeText={setReason}
                    maxLength={300}
                    multiline
                  />
                  <Button
                    title="Ghi nhận trở ngại"
                    variant="secondary"
                    busy={busy}
                    disabled={!reason.trim()}
                    onPress={() => {
                      issueKey.current ??= newRequestKey();
                      void act(async () => {
                        await service.issue(id, reason, issueKey.current!);
                        issueKey.current = null;
                      });
                    }}
                  />
                </>
              )}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
