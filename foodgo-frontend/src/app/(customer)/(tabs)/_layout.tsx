import React from "react";
import { Tabs } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { colors } from "../../../shared/theme/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
const tabs: { name: string; title: string; symbol: SymbolViewProps["name"] }[] =
  [
    {
      name: "home",
      title: "Trang chủ",
      symbol: { ios: "house", android: "home", web: "home" },
    },
    {
      name: "orders",
      title: "Đơn hàng",
      symbol: {
        ios: "list.bullet.rectangle",
        android: "receipt_long",
        web: "receipt_long",
      },
    },
    {
      name: "favorites",
      title: "Yêu thích",
      symbol: { ios: "heart", android: "favorite", web: "favorite" },
    },
    {
      name: "inbox",
      title: "Hộp thư",
      symbol: {
        ios: "bubble.left",
        android: "chat_bubble",
        web: "chat_bubble",
      },
    },
    {
      name: "account",
      title: "Tài khoản",
      symbol: {
        ios: "person.crop.circle",
        android: "account_circle",
        web: "account_circle",
      },
    },
  ];
export default function CustomerTabs() {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: colors.line,
          height: 76 + insets.bottom + Math.max(0, fontScale - 1) * 24,
          paddingTop: 6,
          paddingBottom: Math.max(8, insets.bottom),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          lineHeight: 16,
          fontWeight: "600",
          flexShrink: 0,
        },
      }}
    >
      {tabs.map(({ name, title, symbol }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => (
              <SymbolView
                name={symbol}
                size={24}
                tintColor={color}
                style={{ width: 24, height: 24 }}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
