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
            Công cụ chọn tài khoản demo, không phải xác thực thật. Đơn được giữ
            giữa các vai trò để diễn tập cùng một luồng.
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
                title={`Dùng tài khoản ${user.id}`}
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
            Dùng tài khoản được cấp. Không có đăng ký hoặc tự chọn quyền.
          </Label>
        </Card>
      )}
    </Screen>
  );
}
