import React from "react";
import { Image, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { useApp } from "../../providers/AppProvider";
import { colors } from "../theme/theme";

const pictures = {
  CHICKEN_RICE: require("../../../assets/images/food/chicken-rice.png"),
  MUSHROOM_RICE: require("../../../assets/images/food/mushroom-rice.png"),
};
export function FoodThumbnail({
  foodId,
  imageCode,
  size = 64,
}: {
  foodId?: string;
  imageCode?: string;
  size?: number;
}) {
  const { mode } = useApp();
  const key =
    imageCode ??
    (mode === "demo"
      ? foodId === "food-1"
        ? "CHICKEN_RICE"
        : foodId === "food-2"
          ? "MUSHROOM_RICE"
          : undefined
      : undefined);
  const source =
    key && Object.hasOwn(pictures, key)
      ? pictures[key as keyof typeof pictures]
      : undefined;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: colors.warm,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {source ? (
        <Image
          source={source}
          accessibilityLabel="Ảnh món minh họa"
          resizeMode="cover"
          style={{ width: size, height: size }}
        />
      ) : (
        <SymbolView
          name={{ ios: "fork.knife", android: "restaurant", web: "restaurant" }}
          size={24}
          tintColor={colors.orange}
          style={{ width: 24, height: 24 }}
        />
      )}
    </View>
  );
}
