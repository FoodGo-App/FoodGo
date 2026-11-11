import React, { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import {
  Banner,
  Button,
  Card,
  Heading,
  Label,
  Panda,
  Screen,
  styles,
} from "../../../shared/components/ui";
import { colors, explain } from "../../../shared/theme/theme";
import { FoodThumbnail } from "../../../shared/components/FoodThumbnail";
export default function HomeScreen() {
  const { session, mode, request } = useApp();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  return (
    <Screen title="Hôm nay, bạn muốn ăn gì?" subtitle="Bữa ngon, ngay gần bạn.">
      <View
        style={{
          backgroundColor: colors.mint,
          borderRadius: 24,
          padding: 18,
          flexDirection: "row",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <View style={{ flex: 1, gap: 12 }}>
          <Text
            style={{
              fontSize: 24,
              lineHeight: 33,
              color: colors.ink,
              fontWeight: "800",
            }}
          >
            Bữa ngon,{"\n"}thêm niềm vui.
          </Text>
          <Text style={{ fontSize: 13, lineHeight: 21, color: colors.brand }}>
            Panda mang sự chu đáo đến từng chuyến giao.
          </Text>
        </View>
        <Panda size={128} pose="hello" />
      </View>
      {error && <Banner error>{error}</Banner>}
      <Card>
        <Heading>Đơn của bạn, luôn trong tầm tay</Heading>
        <Label muted>
          Kiểm tra món, xác nhận đơn và theo dõi hành trình giao nhận.
        </Label>
        <Button
          title={session ? "Kiểm tra đơn hàng" : "Đăng nhập để đặt món"}
          onPress={() =>
            router.push(
              session?.user.role === "CUSTOMER"
                ? "/checkout/review"
                : session
                  ? "/"
                  : "/login",
            )
          }
        />
        <Button
          title="Xem đơn đã đặt"
          variant="secondary"
          onPress={() => router.push("/(customer)/(tabs)/orders")}
        />
      </Card>
      {mode === "demo" && (
        <>
          <Heading>Thử một bữa ngon từ Bếp Nhà</Heading>
          <Banner>
            Giỏ mẫu giúp bạn thử hành trình đặt và giao món. Chưa phát sinh giao
            dịch thật.
          </Banner>
          <Card>
            <View style={styles.between}>
              <Heading>Bếp Nhà</Heading>
              <Text style={{ color: colors.orange, fontWeight: "700" }}>
                TRUA10
              </Text>
            </View>
            <View style={styles.row}>
              <FoodThumbnail imageCode="CHICKEN_RICE" size={80} />
              <View style={{ flex: 1, gap: 4 }}>
                <Label>2 phần cơm gà nướng</Label>
                <Label muted>Thêm 1 phần cơm nấm kho</Label>
              </View>
            </View>
            <Label muted>Tiền món 140.000đ · Phí giao mẫu 15.000đ</Label>
            <Button
              title="Chuẩn bị giỏ mẫu"
              variant="secondary"
              busy={busy}
              onPress={() => {
                if (session?.user.role !== "CUSTOMER") {
                  router.push("/login");
                  return;
                }
                setBusy(true);
                request("/demo/cart", "POST", {})
                  .then(() => router.push("/checkout/review"))
                  .catch((e) => setError(explain(e)))
                  .finally(() => setBusy(false));
              }}
            />
          </Card>
          <Button
            title="Mở tài khoản / công cụ demo"
            variant="ghost"
            onPress={() => router.push("/account")}
          />
        </>
      )}
      {mode === "api" && (
        <Banner>
          Nhận giỏ và địa chỉ từ module M01/M02 qua API. Chưa có dữ liệu thì màn
          kiểm tra đơn hiển thị hướng dẫn thay vì tự tạo món giả.
        </Banner>
      )}
    </Screen>
  );
}
