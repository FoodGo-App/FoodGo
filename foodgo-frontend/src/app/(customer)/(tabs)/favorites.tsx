import React from "react";
import { Empty, RequireRole, Screen } from "../../../shared/components/ui";
export default function Favorites() {
  return (
    <RequireRole roles={["CUSTOMER"]}>
      <Screen title="Yêu thích">
        <Empty
          title="Danh sách yêu thích thuộc M02"
          detail="Điểm nối dành cho module khám phá món và giỏ hàng của nhóm."
        />
      </Screen>
    </RequireRole>
  );
}
