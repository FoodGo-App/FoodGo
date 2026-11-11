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
    [message, setMessage] = useState<string | null>(null);
  const setting = async (payload: unknown) => {
    setBusy(true);
    try {
      await request("/demo/settings", "POST", payload);
      setMessage("Đã lưu kịch bản cho lần diễn tập tiếp theo.");
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
              {session.user.role} · {session.user.id}
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
                Công cụ demo: đổi tài khoản qua đăng nhập để diễn tập khách →
                quán → tài xế. Trong chế độ API, vai trò do máy chủ cấp.
              </Banner>
              <Button
                title="Đổi tài khoản demo"
                variant="secondary"
                onPress={() => router.push("/login")}
              />
              <Card>
                <Heading>Kịch bản mô phỏng</Heading>
                <Label muted>
                  Chỉ áp dụng trong demo, không gửi kết quả ví từ app lên API
                  thật.
                </Label>
                <Chip
                  title="Ví thành công"
                  selected={false}
                  onPress={() => {
                    if (!busy) void setting({ walletScenario: "SUCCEEDED" });
                  }}
                />
                <Chip
                  title="Ví thất bại"
                  selected={false}
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
                            : "Gọi: lỗi"
                      }
                      selected={false}
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
        Ví, vị trí và cuộc gọi được mô phỏng. Không chuyển tiền, xin GPS hoặc
        thu âm.
      </Label>
    </Screen>
  );
}
