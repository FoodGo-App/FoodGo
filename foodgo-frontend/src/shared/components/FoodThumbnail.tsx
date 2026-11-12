import React from "react";
import { Image, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { SymbolView } from "expo-symbols";
import { useApp } from "../../providers/AppProvider";
import { colors } from "../theme/theme";
import { illustrativePhotoKey, type KnownImageCode } from "./foodPhotoCatalog";

const pictures: Record<KnownImageCode, ImageSourcePropType> = {
  CHICKEN_RICE: require("../../../assets/images/food/foodgo-com-ga.jpg"),
  MUSHROOM_RICE: require("../../../assets/images/food/foodgo-com-nam.jpg"),
  PHO_BO: require("../../../assets/images/food/foodgo-pho-bo.jpg"),
  BANH_MI: require("../../../assets/images/food/foodgo-banh-mi.jpg"),
  BUN_THIT_NUONG: require("../../../assets/images/food/foodgo-bun-thit-nuong.jpg"),
  MILK_TEA: require("../../../assets/images/food/foodgo-tra-sua.jpg"),
  COM_TAM_SUON: require("../../../assets/images/food/foodgo-com-tam-suon.jpg"),
  PHO_TAI: require("../../../assets/images/food/foodgo-pho-tai.jpg"),
  BUN_BO_HUE: require("../../../assets/images/food/foodgo-bun-bo-hue.jpg"),
  BANH_MI_THIT: require("../../../assets/images/food/foodgo-banh-mi-thit.jpg"),
  MI_HOANH_THANH: require("../../../assets/images/food/foodgo-mi-hoanh-thanh.jpg"),
  TRA_SUA_TRAN_CHAU: require("../../../assets/images/food/foodgo-tra-sua-tran-chau.jpg"),
  KHOAI_TAY_CHIEN: require("../../../assets/images/food/foodgo-khoai-tay-chien.jpg"),
  BUN_DAU: require("../../../assets/images/food/foodgo-bun-dau.jpg"),
  COM_CHAY_NAM: require("../../../assets/images/food/foodgo-com-chay-nam.jpg"),
  BANH_MI_CHAY: require("../../../assets/images/food/foodgo-banh-mi-chay.jpg"),
  HU_TIEU_NAM_VANG: require("../../../assets/images/food/foodgo-hu-tieu-nam-vang.jpg"),
  BUN_THIT_NUONG_2: require("../../../assets/images/food/foodgo-bun-thit-nuong-2.jpg"),
};
// Preserve the established checkout/order artwork for existing callers.
const originalPictures: Partial<Record<KnownImageCode, ImageSourcePropType>> = {
  CHICKEN_RICE: require("../../../assets/images/food/chicken-rice.png"),
  MUSHROOM_RICE: require("../../../assets/images/food/mushroom-rice.png"),
};

export function FoodThumbnail({ foodId, imageCode, name, size = 64, radius = 14, width = size, height = size }: {
  foodId?: string;
  imageCode?: string;
  name?: string;
  size?: number;
  radius?: number;
  width?: number;
  height?: number;
}) {
  const { mode } = useApp();
  const key = illustrativePhotoKey(imageCode, name) ??
    (mode === "demo" && !imageCode ? (foodId === "food-1" ? "CHICKEN_RICE" : foodId === "food-2" ? "MUSHROOM_RICE" : null) : null);
  const source = key ? (!name && originalPictures[key]) || pictures[key] : undefined;
  return (
    <View style={{ width, height, borderRadius: radius, overflow: "hidden", backgroundColor: colors.warm, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {source ? <Image source={source} accessibilityLabel={name ? `Ảnh minh họa ${name}` : "Ảnh món minh họa"} resizeMode="cover" style={{ width, height }} /> : (
        <SymbolView name={{ ios: "fork.knife", android: "restaurant", web: "restaurant" }} size={26} tintColor={colors.orange} style={{ width: 26, height: 26 }} />
      )}
    </View>
  );
}
