import React, { useState } from "react";
import { router } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import {
  Banner,
  Button,
  Card,
  Field,
  Heading,
  Label,
  Panda,
  Screen,
} from "../../../shared/components/ui";
import { DEMO_USERS } from "../../../shared/api/demo";
import { explain } from "../../../shared/theme/theme";
export default function LoginScreen() {
  const { mode, login, restoring } = useApp();
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const enter = async (name: string, pass: string) => {
    if (busy || restoring) return;
    setBusy(true);
    setError(null);
    try {
      await login(name, pass);
      router.replace("/");
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Chào bạn, mời vào FoodGo" back>
      <Panda size={145} />
      {error && <Banner error>{error}</Banner>}
      {mode === "demo" ? (
        <>
          <Banner>
            Chọn một tài khoản để dùng thử FoodGo. Bạn có thể đổi tài khoản
            để cùng theo dõi một đơn từ lúc đặt đến khi giao.
          </Banner>
          {DEMO_USERS.map((user) => (
            <Card key={user.id}>
              <Heading>{user.displayName}</Heading>
              <Label muted>
                {user.role === "CUSTOMER"
                  ? "Khách hàng"
                  : user.role === "DRIVER"
                    ? "Tài xế"
                    : "Nhà hàng"}
              </Label>
              <Button
                title={`Tiếp tục với ${user.displayName}`}
                variant="secondary"
                busy={busy}
                disabled={restoring}
                onPress={() => {
                  void enter(user.id, "demo");
                }}
              />
            </Card>
          ))}
        </>
      ) : (
        <Card>
          <Field
            label="Tên đăng nhập"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <Field
            label="Mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Button
            title="Đăng nhập"
            busy={busy}
            disabled={restoring || !username.trim() || !password}
            onPress={() => {
              void enter(username.trim(), password);
            }}
          />
          <Label muted>
            Đăng nhập bằng tài khoản FoodGo của bạn.
          </Label>
        </Card>
      )}
    </Screen>
  );
}
