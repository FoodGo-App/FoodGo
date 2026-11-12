import React from "react";
import { router } from "expo-router";
import { Empty, RequireRole, Screen } from "../../../shared/components/ui";
export default function Favorites() {
  return (
    <RequireRole roles={["CUSTOMER"]}>
      <Screen title="Yêu thích">
        <Empty
          title="Chưa có món yêu thích"
          action={{ title: "Xem đơn đã đặt", onPress: () => router.push("/(customer)/(tabs)/orders") }}
          detail="Những món bạn lưu sẽ xuất hiện tại đây. Hiện bạn có thể xem lại các đơn đã đặt."
        />
      </Screen>
    </RequireRole>
  );
}
