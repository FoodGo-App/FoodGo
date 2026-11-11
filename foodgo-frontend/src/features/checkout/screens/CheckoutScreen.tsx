import React, { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
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
  MealItems,
  MoneyRows,
  RequireRole,
  Screen,
  styles,
} from "../../../shared/components/ui";
import { useResource } from "../../../shared/hooks/useResource";
import { newRequestKey } from "../../../shared/utils/id";
import { explain, money } from "../../../shared/theme/theme";
import {
  readStore,
  removeStore,
  writeStore,
} from "../../../shared/storage/store";
import { shouldKeepCheckoutReference } from "../../../shared/api/adapters";
import { checkoutService } from "../services/checkoutService";
import type {
  Attempt,
  PaymentMethod,
  Quote,
} from "../../../shared/types/domain";

type Pending = { key: string; quoteId: string; expectedCartVersion: number };
export default function CheckoutScreen() {
  return (
    <RequireRole roles={["CUSTOMER"]}>
      <Checkout />
    </RequireRole>
  );
}
function Checkout() {
  const { request, session } = useApp(),
    service = checkoutService(request);
  const context = useResource(() => service.context());
  const [addressId, setAddress] = useState(""),
    [offerId, setOffer] = useState(""),
    [method, setMethod] = useState<PaymentMethod>("COD"),
    [quote, setQuote] = useState<Quote | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [pending, setPending] = useState<Pending | null>(null),
    [ready, setReady] = useState(false),
    [now, setNow] = useState(() => Date.now());
  const lock = useRef(false);
  const storeKey = `checkout:${session!.user.id}`;
  useEffect(() => {
    let alive = true;
    readStore<Pending>(storeKey)
      .then((value) => {
        if (alive) {
          setPending(value);
          setReady(true);
        }
      })
      .catch(() => {
        if (alive) {
          setError(
            "Không đọc được yêu cầu đã gửi. Vui lòng kiểm tra danh sách đơn trước khi đặt.",
          );
        }
      });
    return () => {
      alive = false;
    };
  }, [storeKey]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const run = async (fn: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      if (!shouldKeepCheckoutReference(e)) {
        await removeStore(storeKey);
        setPending(null);
        setQuote(null);
        void context.reload();
      }
      setError(explain(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const handleAttempt = async (a: Attempt) => {
    if (a.result === "SUCCEEDED" && a.orderId) {
      await removeStore(storeKey);
      setPending(null);
      router.replace({
        pathname: "/orders/[id]",
        params: { id: a.orderId, success: "1" },
      });
    } else if (a.result === "PENDING")
      router.push({ pathname: "/checkout/pending", params: { id: a.id } });
    else {
      await removeStore(storeKey);
      setPending(null);
      setQuote(null);
      setError(
        a.reasonCode ?? "Lần thanh toán chưa thành công; giỏ vẫn được giữ.",
      );
    }
  };
  const recover = () =>
    run(async () => {
      if (!pending) return;
      try {
        await handleAttempt(await service.byKey(pending.key));
      } catch (e) {
        if (
          (e instanceof Error && e.message === "NOT_FOUND") ||
          (e as { status?: number }).status === 404
        )
          await handleAttempt(
            await service.place(
              pending.quoteId,
              pending.expectedCartVersion,
              pending.key,
            ),
          );
        else throw e;
      }
    });
  const changed = () => {
    setQuote(null);
    setError(null);
  };
  const data = context.data;
  const selectedAddress = addressId || data?.addresses[0]?.id || "";
  const remaining = quote
    ? Math.max(0, Math.floor((Date.parse(quote.expiresAt) - now) / 1000))
    : 0;
  return (
    <Screen
      title="Kiểm tra đơn"
      subtitle="Một bữa ngon, giao đến đúng nơi."
      back
      onRefresh={() => {
        changed();
        void context.reload();
      }}
      footer={
        pending ? (
          <Button
            title="Kiểm tra / gửi lại cùng yêu cầu"
            busy={busy}
            onPress={recover}
          />
        ) : (
          <>
            <Text style={styles.muted}>
              {quote
                ? `Báo giá còn ${remaining} giây`
                : "Lấy báo giá từ hệ thống trước khi xác nhận."}
            </Text>
            <Button
              title={
                quote ? `Xác nhận đặt · ${money(quote.total)}` : "Xem báo giá"
              }
              disabled={
                !ready ||
                !data?.cart.items.length ||
                !selectedAddress ||
                (!!quote && remaining === 0)
              }
              busy={busy}
              onPress={() =>
                run(async () => {
                  if (!data) return;
                  if (!quote) {
                    setQuote(
                      await service.quote({
                        addressId: selectedAddress,
                        offerId: offerId || undefined,
                        paymentMethod: method,
                        expectedCartVersion: data.cart.version,
                      }),
                    );
                    return;
                  }
                  const ref = {
                    key: newRequestKey(),
                    quoteId: quote.id,
                    expectedCartVersion: quote.expectedCartVersion,
                  };
                  await writeStore(storeKey, ref);
                  setPending(ref);
                  await handleAttempt(
                    await service.place(
                      ref.quoteId,
                      ref.expectedCartVersion,
                      ref.key,
                    ),
                  );
                })
              }
            />
            {quote && remaining === 0 && (
              <Button
                title="Lấy báo giá mới"
                variant="secondary"
                onPress={() => {
                  setQuote(null);
                }}
              />
            )}
          </>
        )
      }
    >
      <LoadState
        loading={context.loading}
        error={context.error}
        retry={() => {
          void context.reload();
        }}
      />
      {error && <Banner error>{error}</Banner>}
      {pending && (
        <Banner>
          Đã có yêu cầu đặt đơn chưa kết thúc. Kiểm tra bằng cùng mã; không tạo
          lần thanh toán mới.
        </Banner>
      )}
      {data && !data.cart.items.length && !pending ? (
        <Empty
          title="Giỏ hàng đang trống"
          detail="Chọn món ở M02 rồi quay lại kiểm tra đơn."
          action={{ title: "Về trang chủ", onPress: () => router.replace("/") }}
        />
      ) : (
        data && (
          <>
            <Heading>Giao đến</Heading>
            {data.addresses.length ? (
              data.addresses.map((a) => (
                <Card key={a.id}>
                  <View style={styles.between}>
                    <Heading>
                      {a.label} · {a.recipientName}
                    </Heading>
                    <Chip
                      title={selectedAddress === a.id ? "Đã chọn" : "Chọn"}
                      selected={addressId === a.id}
                      onPress={() => {
                        if (!pending) {
                          setAddress(a.id);
                          changed();
                        }
                      }}
                    />
                  </View>
                  <Label muted>{a.addressText}</Label>
                  <Label muted>{a.recipientPhone}</Label>
                </Card>
              ))
            ) : (
              <Banner error>
                Chưa có địa chỉ. Cần thêm địa chỉ từ module Tài khoản trước khi
                đặt.
              </Banner>
            )}
            <Card>
              <Heading>{data.cart.restaurantName}</Heading>
              <MealItems items={data.cart.items} />
            </Card>
            <Heading>Ưu đãi của bạn</Heading>
            <View style={{ gap: 10 }}>
              <Chip
                title="Không dùng ưu đãi"
                selected={!offerId}
                onPress={() => {
                  if (!pending) {
                    setOffer("");
                    changed();
                  }
                }}
              />
              {data.offers.map((offer) => (
                <Card key={offer.id}>
                  <Heading>
                    {offer.code} · {offer.name}
                  </Heading>
                  <Label muted>
                    Tiền món tối thiểu {money(offer.minSubtotal)}
                    {offer.requiredMethod ? " · Chỉ ví mô phỏng" : ""}
                  </Label>
                  <Chip
                    title={offerId === offer.id ? "Đang chọn" : "Dùng ưu đãi"}
                    selected={offerId === offer.id}
                    onPress={() => {
                      if (!pending) {
                        setOffer(offer.id);
                        changed();
                      }
                    }}
                  />
                </Card>
              ))}
            </View>
            <Heading>Thanh toán</Heading>
            <View style={{ gap: 10 }}>
              {(["COD", "MOCK_WALLET"] as const).map((m) => (
                <Chip
                  key={m}
                  title={
                    m === "COD" ? "Tiền mặt khi nhận món" : "Ví · Mô phỏng"
                  }
                  selected={method === m}
                  onPress={() => {
                    if (!pending) {
                      setMethod(m);
                      changed();
                    }
                  }}
                />
              ))}
            </View>
            {quote ? (
              <Card>
                <Heading>Báo giá đã kiểm tra</Heading>
                <MoneyRows data={quote} />
              </Card>
            ) : (
              <Banner>
                Giá tại giỏ là dự tính. Hệ thống kiểm tra lại món, địa chỉ, ưu
                đãi và giá trước khi đặt.
              </Banner>
            )}
            <Label muted>
              Chỉ hủy trong lúc chờ nhà hàng xác nhận. Không có phí ngoài tổng
              thanh toán.
            </Label>
          </>
        )
      )}
    </Screen>
  );
}
