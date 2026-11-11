import React from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Card, Label, styles } from "../../../shared/components/ui";
import {
  colors,
  dateTime,
  money,
  statusLabels,
} from "../../../shared/theme/theme";
import type { Order } from "../../../shared/types/domain";
import { FoodThumbnail } from "../../../shared/components/FoodThumbnail";
export function OrderCard({ order }: { order: Order }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở đơn ${order.id}`}
      onPress={() =>
        router.push({ pathname: "/orders/[id]", params: { id: order.id } })
      }
    >
      <Card>
        <View style={styles.between}>
          <Text style={{ color: colors.brand, fontWeight: "700" }}>
            {statusLabels[order.status]}
          </Text>
          <Label muted>#{order.id}</Label>
        </View>
        <View style={styles.row}>
          {order.items[0] && (
            <FoodThumbnail
              foodId={order.items[0].foodId}
              imageCode={order.items[0].imageCode}
              size={62}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>{order.restaurantName}</Text>
            <Label muted>
              {order.items.length
                ? `${order.items.reduce((sum, i) => sum + i.quantity, 0)} phần`
                : "Xem chi tiết món"}{" "}
              · {dateTime(order.createdAt)}
            </Label>
          </View>
        </View>
        <View style={styles.between}>
          <Label muted>{statusLabels[order.deliveryStatus]}</Label>
          <Text style={{ fontSize: 19, fontWeight: "800", color: colors.ink }}>
            {money(order.total)} ›
          </Text>
        </View>
      </Card>
    </Pressable>
  );
}
