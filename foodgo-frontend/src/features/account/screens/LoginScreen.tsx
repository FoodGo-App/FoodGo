import React, { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams, usePreventRemove, useIsFocused, type Href } from "expo-router";
import { afterLoginTarget, cancelLoginTarget } from "../loginReturn";
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
  const { mode, login, cancelLogin, restoring } = useApp();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const focused = useIsFocused();
  const [leaving, setLeaving] = useState(false);
  const attempt = useRef(0), mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const disablePrevention = usePreventRemove(focused && !leaving, () => cancel());
  function cancel() {
    attempt.current++;
    cancelLogin();
    setLeaving(true);
    disablePrevention();
    router.replace(cancelLoginTarget(returnTo) as Href);
  }
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const enter = async (name: string, pass: string) => {
    if (busy || restoring) return;
    const ticket = ++attempt.current;
    setBusy(true);
    setError(null);
    try {
      const next = await login(name, pass);
      if (!mounted.current || ticket !== attempt.current) return;
      setLeaving(true);
      disablePrevention();
      router.replace(afterLoginTarget(next.user.role, returnTo, mode) as Href);
    } catch (e) {
      if (mounted.current && ticket === attempt.current) setError(explain(e));
    } finally {
      if (mounted.current && ticket === attempt.current) setBusy(false);
    }
  };
  return (
    <Screen title="Chào bạn, mời vào FoodGo" back onBack={cancel}>
      <Panda size={145} />
      {error && <Banner error>{error}</Banner>}
      <Button title="Hủy đăng nhập" variant="ghost" onPress={cancel} />
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
