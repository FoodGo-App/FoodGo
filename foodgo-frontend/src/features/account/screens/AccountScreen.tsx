import React, { useState } from "react";
import { router } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import {
  Banner,
  Button,
  Card,
  Chip,
  Heading,
  Label,
  Panda,
  Screen,
} from "../../../shared/components/ui";
import { explain } from "../../../shared/theme/theme";
export default function AccountScreen() {
  const { session, mode, logout, request } = useApp();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState<string | null>(null),
    [walletChoice, setWalletChoice] = useState<string | null>(null),
    [callChoice, setCallChoice] = useState<string | null>(null);
  const setting = async (payload: { walletScenario?: string; callScenario?: string }) => {
    if (busy) return;
    setBusy(true);
    try {
      await request("/demo/settings", "POST", payload);
      if (payload.walletScenario) setWalletChoice(payload.walletScenario);
      if (payload.callScenario) setCallChoice(payload.callScenario);
      setMessage("Đã lưu lựa chọn cho lần dùng thử tiếp theo.");
    } catch (e) {
      setMessage(explain(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Tài khoản" subtitle="Một ứng dụng, đúng công việc của bạn.">
      <Panda size={125} />
      {session ? (
        <>
          <Card>
            <Heading>{session.user.displayName}</Heading>
            <Label muted>
              {session.user.role === "CUSTOMER" ? "Khách hàng" : session.user.role === "DRIVER" ? "Tài xế" : "Nhà hàng"}
            </Label>
            {session.user.role === "CUSTOMER" ? (
              <Button
                title="Đơn hàng của tôi"
                onPress={() => router.push("/(customer)/(tabs)/orders")}
              />
            ) : (
              <Button
                title="Mở công việc"
                onPress={() =>
                  router.replace(
                    session.user.role === "RESTAURANT"
                      ? "/restaurant"
                      : "/driver",
                  )
                }
              />
            )}
            <Button
              title="Đăng xuất"
              variant="ghost"
              busy={busy}
              onPress={() => {
                setBusy(true);
                logout()
                  .then(() => router.replace("/"))
                  .finally(() => setBusy(false));
              }}
            />
          </Card>
          {mode === "demo" && (
            <>
              <Banner>
                Bạn đang dùng thử FoodGo. Chọn tài khoản khác để trải nghiệm
                đặt món, chuẩn bị món hoặc giao hàng.
              </Banner>
              <Button
                title="Đổi tài khoản dùng thử"
                variant="secondary"
                onPress={() => router.push("/login")}
              />
              <Card>
                <Heading>Tùy chọn dùng thử</Heading>
                <Label muted>
                  Các lựa chọn này chỉ áp dụng cho lần dùng thử; không phát sinh
                  thanh toán thật.
                </Label>
                <Chip
                  title="Ví thành công"
                  selected={walletChoice === "SUCCEEDED"}
                  disabled={busy}
                  onPress={() => {
                    if (!busy) void setting({ walletScenario: "SUCCEEDED" });
                  }}
                />
                <Chip
                  title="Ví chưa thanh toán được"
                  selected={walletChoice === "FAILED"}
                  disabled={busy}
                  onPress={() => {
                    if (!busy) void setting({ walletScenario: "FAILED" });
                  }}
                />
                {(["CONNECTED", "NO_ANSWER", "FAILED"] as const).map(
                  (value) => (
                    <Chip
                      key={value}
                      title={
                        value === "CONNECTED"
                          ? "Gọi: kết nối"
                          : value === "NO_ANSWER"
                            ? "Gọi: không trả lời"
                            : "Gọi: chưa kết nối được"
                      }
                      selected={callChoice === value}
                      disabled={busy}
                      onPress={() => {
                        if (!busy) void setting({ callScenario: value });
                      }}
                    />
                  ),
                )}
              </Card>
            </>
          )}
        </>
      ) : (
        <Button title="Đăng nhập" onPress={() => router.push("/login")} />
      )}
      {message && <Banner>{message}</Banner>}
      <Label muted>
        {mode === "demo" ? "Thanh toán, vị trí và cuộc gọi trong chế độ dùng thử đều được mô phỏng." : "Quản lý tài khoản và theo dõi công việc của bạn tại đây."}
      </Label>
    </Screen>
  );
}
