import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { TextInputProps, ViewStyle, StyleProp } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "../../providers/AppProvider";
import { colors, money } from "../theme/theme";
import type { CartItem, Quote, Order, Role } from "../types/domain";
import { Panda, type PandaPose } from "./Panda";
import { Brand } from "./Brand";
import { FoodThumbnail } from "./FoodThumbnail";
import { SymbolView } from "expo-symbols";
export { Panda } from "./Panda";

export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  content: { padding: 20, gap: 18, paddingBottom: 32 },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.6,
  },
  heading: { fontSize: 19, fontWeight: "700", color: colors.ink },
  text: { fontSize: 15, lineHeight: 23, color: colors.ink },
  muted: { fontSize: 13, lineHeight: 20, color: colors.muted },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 12,
  },
  banner: { backgroundColor: colors.mint, borderRadius: 12, padding: 12 },
  chip: {
    minHeight: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  footer: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.white,
    gap: 8,
  },
  divider: { height: 1, backgroundColor: colors.line },
  brand: { color: colors.brand },
  bigPrice: { fontSize: 24, fontWeight: "800", color: colors.orange },
  link: { fontSize: 14, color: colors.brand, fontWeight: "700" },
});
export function Label({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return <Text style={muted ? styles.muted : styles.text}>{children}</Text>;
}
export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Banner({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <View
      accessibilityRole={error ? "alert" : undefined}
      style={[styles.banner, error && { backgroundColor: "#FBE9E8" }]}
    >
      <Text
        style={[styles.muted, { color: error ? colors.danger : colors.brand }]}
      >
        {children}
      </Text>
    </View>
  );
}
export function Button({
  title,
  onPress,
  disabled = false,
  busy = false,
  variant = "primary",
  testID,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  testID?: string;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 50,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          variant === "primary"
            ? colors.brand
            : variant === "secondary"
              ? colors.mint
              : variant === "danger"
                ? "#FBE9E8"
                : "transparent",
        opacity: disabled || busy ? 0.55 : pressed ? 0.8 : 1,
        borderWidth: variant === "ghost" ? 1 : 0,
        borderColor: colors.line,
        flexDirection: "row",
        gap: 8,
      })}
    >
      {busy && (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? colors.white : colors.brand}
        />
      )}
      <Text
        style={{
          fontSize: 15,
          lineHeight: 22,
          fontWeight: "700",
          textAlign: "center",
          color:
            variant === "primary"
              ? colors.white
              : variant === "danger"
                ? colors.danger
                : colors.brand,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  title,
  selected,
  onPress,
  disabled = false,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.chip,
        selected && {
          backgroundColor: colors.brand,
          borderColor: colors.brand,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 13,
          color: selected ? colors.white : colors.ink,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Label>{label}</Label>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          props.multiline && { minHeight: 90, textAlignVertical: "top" },
          props.style,
        ]}
      />
    </View>
  );
}
export function Empty({
  title,
  detail,
  action,
  pose = "empty",
}: {
  title: string;
  detail?: string;
  action?: { title: string; onPress: () => void };
  pose?: PandaPose;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 32, gap: 14 }}>
      <Panda size={180} pose={pose} />
      <Heading>{title}</Heading>
      {detail && (
        <Text style={[styles.muted, { textAlign: "center" }]}>{detail}</Text>
      )}
      {action && <Button {...action} />}
    </View>
  );
}
export function LoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  return loading ? (
    <View style={{ padding: 30, gap: 12 }}>
      <ActivityIndicator color={colors.brand} />
      <Label muted>Đang tải dữ liệu…</Label>
    </View>
  ) : error ? (
    <View style={{ gap: 10 }}>
      <Banner error>{error}</Banner>
      <Button title="Thử tải lại" onPress={retry} variant="secondary" />
    </View>
  ) : null;
}
export function Screen({
  title,
  subtitle,
  children,
  footer,
  back = false,
  onRefresh,
  scroll = true,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  back?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
}) {
  const { mode, storageError } = useApp();
  return (
    <SafeAreaView
      style={styles.page}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 14,
            gap: 8,
          }}
        >
          <View style={{ gap: 4 }}>
            <View style={styles.between}>
              {back ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flexShrink: 1,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Quay lại"
                    style={{
                      minWidth: 44,
                      minHeight: 44,
                      justifyContent: "center",
                    }}
                    onPress={() =>
                      router.canGoBack() ? router.back() : router.replace("/")
                    }
                  >
                    <SymbolView
                      name={{
                        ios: "chevron.left",
                        android: "arrow_back_ios_new",
                        web: "arrow_back_ios_new",
                      }}
                      size={21}
                      tintColor={colors.brand}
                      style={{ width: 24, height: 24 }}
                    />
                  </Pressable>
                  <Brand compact />
                </View>
              ) : (
                <Brand />
              )}
            </View>
            {mode === "demo" && (
              <Text style={[styles.muted, { fontSize: 11 }]}>Chế độ demo</Text>
            )}
          </View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Label muted>{subtitle}</Label>}
          {storageError && <Banner error>{storageError}</Banner>}
        </View>
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.content}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={false}
                  onRefresh={onRefresh}
                  tintColor={colors.brand}
                />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 20, gap: 12 }}>
            {children}
          </View>
        )}
        {footer && <View style={styles.footer}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function RequireRole({
  roles,
  children,
}: {
  roles: Role[];
  children: React.ReactNode;
}) {
  const { session, restoring } = useApp();
  if (restoring)
    return <ActivityIndicator style={{ flex: 1 }} color={colors.brand} />;
  if (!session || !roles.includes(session.user.role))
    return (
      <Screen title={session ? "Không đúng vai trò" : "Đăng nhập để tiếp tục"}>
        <Empty
          title={session ? "Mở công việc của bạn" : "Panda đang chờ bạn"}
          pose="hello"
          detail="Dữ liệu đơn và liên hệ chỉ dành cho tài khoản có quyền."
          action={{
            title: session ? "Về tài khoản" : "Đăng nhập",
            onPress: () =>
              router.replace(session ? "/(customer)/(tabs)/account" : "/login"),
          }}
        />
      </Screen>
    );
  return <React.Fragment key={session.user.id}>{children}</React.Fragment>;
}
export function MoneyRows({
  data,
}: {
  data: Pick<
    Quote | Order,
    "subtotal" | "deliveryFee" | "foodDiscount" | "deliveryDiscount" | "total"
  >;
}) {
  return (
    <View style={{ gap: 12 }}>
      {[
        ["Tiền món", data.subtotal],
        ["Phí giao hàng", data.deliveryFee],
        ["Ưu đãi", -data.foodDiscount - data.deliveryDiscount],
      ].map(([text, amount]) => (
        <View key={text} style={styles.between}>
          <Label muted>{text}</Label>
          <Label>{money(amount as number)}</Label>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.between}>
        <Heading>Tổng thanh toán</Heading>
        <Text style={styles.bigPrice}>{money(data.total)}</Text>
      </View>
    </View>
  );
}
export function MealItems({ items }: { items: CartItem[] }) {
  return (
    <View style={{ gap: 16 }}>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <FoodThumbnail
            foodId={item.foodId}
            imageCode={item.imageCode}
            size={68}
          />
          <View style={{ flex: 1, gap: 3 }}>
            <Heading>{item.foodName}</Heading>
            <Label muted>
              {item.options}
              {item.note ? ` · ${item.note}` : ""}
            </Label>
            <View style={styles.between}>
              <Label>× {item.quantity}</Label>
              <Text style={{ fontWeight: "700", color: colors.ink }}>
                {money(item.unitPrice * item.quantity)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}
export function Confirm({
  title,
  detail,
  onConfirm,
  children,
}: {
  title: string;
  detail: string;
  onConfirm: () => Promise<void>;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  return (
    <View style={{ gap: 10 }}>
      {open ? (
        <Card>
          <Heading>{title}</Heading>
          <Label>{detail}</Label>
          {children}
          {error && <Banner error>{error}</Banner>}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Button
                title="Quay lại"
                variant="ghost"
                disabled={busy}
                onPress={() => setOpen(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Xác nhận"
                busy={busy}
                onPress={() => {
                  setBusy(true);
                  setError(null);
                  onConfirm()
                    .then(() => setOpen(false))
                    .catch((e) => setError(e.message))
                    .finally(() => setBusy(false));
                }}
              />
            </View>
          </View>
        </Card>
      ) : (
        <Button title={title} variant="danger" onPress={() => setOpen(true)} />
      )}
    </View>
  );
}
