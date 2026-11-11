import React from "react";
import { Text, View } from "react-native";
import { Panda } from "./Panda";
import { colors } from "../theme/theme";

export function Brand({ compact = false }: { compact?: boolean }) {
  const fontSize = compact ? 23 : 29;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="FoodGo — logo panda"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        flexShrink: 1,
      }}
    >
      <Panda pose="logo" size={compact ? 36 : 46} decorative />
      <Text
        allowFontScaling={false}
        style={{
          fontSize,
          fontWeight: "900",
          letterSpacing: -1.1,
          color: colors.brand,
          lineHeight: fontSize + 7,
        }}
      >
        food<Text style={{ color: "#D85B09" }}>go</Text>
      </Text>
    </View>
  );
}
