import React from "react";
import { Image, View } from "react-native";

export type PandaPose =
  "logo" | "hello" | "empty" | "waiting" | "success" | "inbox";
const positions: Record<PandaPose, readonly [number, number]> = {
  logo: [0, 0],
  hello: [1, 0],
  empty: [2, 0],
  waiting: [0, 1],
  success: [1, 1],
  inbox: [2, 1],
};
const labels: Record<PandaPose, string> = {
  logo: "Logo panda FoodGo",
  hello: "Panda FoodGo vẫy tay chào",
  empty: "Panda FoodGo bên túi đồ ăn trống",
  waiting: "Panda FoodGo đang chờ",
  success: "Panda FoodGo mang món đến bạn",
  inbox: "Panda FoodGo ôm phong thư",
};

/** Each pose occupies one square cell in the transparent 3 by 2 atlas. */
export function Panda({
  pose = "hello",
  size = 120,
  decorative = false,
}: {
  pose?: PandaPose;
  size?: number;
  decorative?: boolean;
}) {
  const [column, row] = positions[pose];
  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : "image"}
      accessibilityLabel={decorative ? undefined : labels[pose]}
      importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
      style={{
        width: size,
        height: size,
        overflow: "hidden",
        flexShrink: 0,
        alignSelf: "center",
      }}
    >
      <Image
        accessible={false}
        source={require("../../../assets/images/brand/panda-atlas-v2.png")}
        resizeMode="stretch"
        style={{
          position: "absolute",
          width: size * 3,
          height: size * 2,
          left: -column * size,
          top: -row * size,
        }}
      />
    </View>
  );
}
