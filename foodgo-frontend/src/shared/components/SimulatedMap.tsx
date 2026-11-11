import React from "react";
import { Text, View } from "react-native";
import { colors } from "../theme/theme";
export function SimulatedMap({ etaMinutes = 25 }: { etaMinutes?: number }) {
  return (
    <View
      accessibilityLabel="Bản đồ mô phỏng từ Bếp Nhà đến điểm giao mẫu, không sử dụng GPS"
      style={{
        height: 210,
        backgroundColor: "#E6EDDE",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          position: "absolute",
          width: "130%",
          height: 22,
          backgroundColor: "#FFFEF7",
          top: 70,
          left: -20,
          transform: [{ rotate: "20deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: "130%",
          height: 20,
          backgroundColor: "#FFFEF7",
          top: 110,
          left: -20,
          transform: [{ rotate: "-25deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 20,
          height: 300,
          backgroundColor: "#FFFEF7",
          left: 120,
          top: -30,
          transform: [{ rotate: "-14deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: "25%",
          top: 85,
          width: "45%",
          height: 60,
          borderLeftWidth: 4,
          borderBottomWidth: 4,
          borderRightWidth: 4,
          borderColor: colors.brand,
          borderStyle: "dashed",
        }}
      />
      <Text
        style={{
          position: "absolute",
          left: "19%",
          top: 65,
          color: colors.brand,
          fontWeight: "700",
        }}
      >
        ● Bếp Nhà
      </Text>
      <Text
        style={{
          position: "absolute",
          right: 20,
          top: 60,
          color: colors.orange,
          fontWeight: "700",
        }}
      >
        ● Điểm giao mẫu
      </Text>
      <View
        style={{
          position: "absolute",
          left: 12,
          top: 12,
          backgroundColor: "white",
          padding: 7,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: colors.brand, fontSize: 12 }}>
          Bản đồ mô phỏng
        </Text>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          backgroundColor: "white",
          padding: 10,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: colors.ink, fontWeight: "700" }}>
          {etaMinutes} phút
        </Text>
        <Text style={{ color: colors.muted, fontSize: 11 }}>
          ETA mẫu · Không phải GPS
        </Text>
      </View>
    </View>
  );
}
