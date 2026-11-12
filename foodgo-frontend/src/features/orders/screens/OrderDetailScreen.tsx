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
import { useDraft } from "../../../shared/hooks/useDraft";
import { prepareIssue, type IssueDraft } from "../lib/issueDraft";
import { AnimatedChange, SuccessMotion } from "../../../shared/components/Motion";
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
  const actionLock = useRef(false);
  const issueDraft = useDraft<IssueDraft>("delivery-issue",id,{text:"",pending:null});
  const service = deliveryService(request);
  const order = query.data;
  const tracking = useResource(
    () => orderService(request).tracking(id),
    role !== "RESTAURANT" && !!order?.driverId,
    true,
    `tracking:${id}`,
  );
  const act = async (fn: () => Promise<unknown>) => {
    if (actionLock.current) return;
    actionLock.current=true;
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
      actionLock.current=false;
      setBusy(false);
    }
  };
  const confirmAction = async (fn: () => Promise<unknown>) => {
    if(actionLock.current) throw new Error("Đang xử lý, chờ một chút nhé.");
    actionLock.current=true;
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
      actionLock.current=false;
      setBusy(false);
    }
  };
  const reportIssue = async () => {
    if(actionLock.current || !issueDraft.ready)return;
    actionLock.current=true;setBusy(true);setError(null);
    try {
      const input=prepareIssue(issueDraft.value,newRequestKey);
      await issueDraft.update({text:input.reason,pending:input});
      await service.issue(id,input.reason,input.requestKey);
      await issueDraft.update({text:"",pending:null});
      await query.reload();
    } catch(e) {
      if(["ORDER_STATE_CONFLICT","INVALID_REASON","INVALID_REQUEST_KEY"].includes((e as {code?:string}).code??""))
        await issueDraft.update({text:issueDraft.value.text,pending:null}).catch(()=>{});
      setError(explain(e));await query.reload();
    } finally {actionLock.current=false;setBusy(false);}
  };
  const has = (action: string) => order?.allowedActions?.includes(action);
  if (success === "1" && role === "CUSTOMER" && order)
    return (
      <Screen title="Đặt món thành công!" subtitle={`Mã đơn #${id}`} back>
        <SuccessMotion><Panda pose="success" size={220} /></SuccessMotion>
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
                · {order.paymentMethod === "COD" ? "Tiền mặt" : "Ví thử nghiệm"}
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
          <AnimatedChange changeKey={`${order.status}:${order.deliveryStatus}:${order.paymentStatus}`}><Card>
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
                {order.paymentMethod === "COD" ? "Tiền mặt" : "Ví thử nghiệm"}
              </Label>
              <Label>{statusLabels[order.paymentStatus]}</Label>
            </View>
            {query.updatedAt && (
              <Label muted>Cập nhật lúc {dateTime(query.updatedAt)}</Label>
            )}
          </Card></AnimatedChange>
          {order.driverId && role !== "RESTAURANT" && (
            <>
              {tracking.error && <Banner error>{tracking.error}</Banner>}
              {tracking.data &&
                (tracking.data.mapAssetCode === "AREA_A" ? (
                  <SimulatedMap etaMinutes={tracking.data.etaMinutes} restaurantName={order.restaurantName} />
                ) : (
                  <Banner>Chưa có bản đồ mẫu cho khu vực của đơn này.</Banner>
                ))}
              <Card>
                <Heading>{order.driverName ?? "Tài xế đã nhận"}</Heading>
                <Label muted>
                  Liên hệ theo đơn, chỉ giữa khách hàng và tài xế.
                </Label>
                <Button
                    title="Nhắn tin"
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
                    title="Gọi · dùng thử"
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
                    label="Bạn muốn hủy vì lý do gì?"
                    value={reason}
                    onChangeText={setReason}
                    maxLength={300}
                  />
                  <Confirm
                    title="Hủy đơn hàng"
                    detail="Chỉ hủy nếu quán chưa tiếp nhận. Hệ thống kiểm tra lại trạng thái khi xác nhận."
                    onConfirm={() =>
                      reason.trim() ? confirmAction(() =>
                        orderService(request).cancel(id, reason.trim()),
                      ) : Promise.reject(new Error("Nhập lý do hủy đơn giúp mình nhé."))
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
                    detail="Đơn sẽ được hủy. Nếu đã trả bằng ví thử nghiệm, khoản tiền sẽ được hoàn lại."
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
                      title={`${cod ? "☑" : "☐"} Đã thu đủ ${money(order.total)} tiền mặt`}
                      selected={cod}
                      disabled={busy}
                      onPress={() => setCod((v) => !v)}
                    />
                  ) : (
                    <Banner>
                      Khách đã trả bằng ví thử nghiệm. Không thu thêm tiền mặt.
                    </Banner>
                  )}
                  <Confirm
                    title="Xác nhận giao thành công"
                    detail="Chỉ xác nhận sau khi đã giao món và hoàn thành việc thu tiền đúng phương thức."
                    onConfirm={() => {
                      if (order.paymentMethod === "COD" && !cod)
                        return Promise.reject(
                          new Error("Xác nhận đã thu đủ tiền mặt trước khi hoàn tất nhé."),
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
                    label="Bạn đang gặp khó khăn gì?"
                    value={issueDraft.value.text}
                    editable={issueDraft.ready&&!busy&&!issueDraft.value.pending}
                    onChangeText={(text)=>{void issueDraft.update({text,pending:null}).catch(()=>{});}}
                    maxLength={300}
                    multiline
                  />
                  <Button
                    title={issueDraft.value.pending?"Kiểm tra nội dung vừa gửi":"Báo khó khăn khi giao"}
                    variant="secondary"
                    busy={busy}
                    disabled={!issueDraft.ready||(!issueDraft.value.pending&&!issueDraft.value.text.trim())}
                    onPress={() => {
                      void reportIssue();
                    }}
                  />
                  {issueDraft.value.pending&&<Banner>Nội dung đang chờ xác nhận. Bấm kiểm tra để gửi lại đúng nội dung trước đó.</Banner>}
                  {issueDraft.error&&<><Banner error>{issueDraft.error}</Banner>{!issueDraft.ready&&<Button title="Thử đọc lại thông báo" onPress={()=>{void issueDraft.reload();}} />}</>}
                </>
              )}
            </Card>
          )}
          {role==="DRIVER"&&issueDraft.value.pending&&!has("deliver")&&<Card><Heading>Kiểm tra thông báo vừa gửi</Heading><Label>{issueDraft.value.pending.reason}</Label><Button title="Kiểm tra thông báo" busy={busy} onPress={()=>{void reportIssue();}} /></Card>}
        </>
      )}
    </Screen>
  );
}
