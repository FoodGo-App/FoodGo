import {M01Screen as Screen,m} from "../../catalog/components/M01Layout";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
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
  const [passwordVisible, setPasswordVisible] = useState(false);
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
    <Screen title="Đăng nhập" back onBack={cancel}>
      <View style={{backgroundColor:"#E4F2EB",borderRadius:20,padding:16,alignItems:"center",gap:8}}><Panda size={100}/><Text style={{...m.heading,fontSize:20,textAlign:"center"}}>Chào bạn, mời vào FoodGo</Text><Text style={m.meta}>Đăng nhập để tiếp tục chọn món</Text></View>
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
          <View style={{ position: "relative" }}>
            <Field
              label="Mật khẩu"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
              style={{ paddingRight: 72 }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              accessibilityHint="Đổi cách hiển thị mật khẩu, không thay đổi mật khẩu đã nhập"
              onPress={() => setPasswordVisible((value) => !value)}
              style={{ position: "absolute", right: 8, bottom: 0, minWidth: 52, minHeight: 50, justifyContent: "center", alignItems: "center" }}
            >
              <Text style={{ color: "#006C59", fontWeight: "700" }}>{passwordVisible ? "Ẩn" : "Hiện"}</Text>
            </Pressable>
          </View>
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
      <Button title="Tiếp tục xem món như khách" variant="secondary" onPress={cancel}/>
    </Screen>
  );
}
