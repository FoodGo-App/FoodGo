import React, { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import {
  Banner,
  Button,
  Card,
  Chip,
  Field,
  Heading,
  Label,
  LoadState,
  Panda,
  RequireRole,
  Screen,
  styles,
} from "../../../shared/components/ui";
import { useResource } from "../../../shared/hooks/useResource";
import { useDraft } from "../../../shared/hooks/useDraft";
import { communicationService } from "../services/communicationService";
import { orderService } from "../../orders/services/orderService";
import { colors, explain } from "../../../shared/theme/theme";
import type { Review, ReviewInput } from "../../../shared/types/domain";
export default function ReviewScreen() {
  return (
    <RequireRole roles={["CUSTOMER"]}>
      <ReviewForm />
    </RequireRole>
  );
}
function ReviewForm() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { request } = useApp();
  const service = communicationService(request);
  const query = useResource(
    async () => {
      const order = await orderService(request).detail(orderId);
      let review: Review | null = null;
      try {
        review = await service.review(orderId);
      } catch (e) {
        if (
          (e as { status?: number }).status !== 404 &&
          (!(e instanceof Error) || e.message !== "NOT_FOUND")
        )
          throw e;
      }
      return { order, review };
    },
    true,
    false,
    orderId,
  );
  const draft = useDraft<ReviewInput>("review", orderId, {
    stars: 5,
    tags: [],
    note: "",
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const data = query.data;
  const value = data?.review ?? draft.value;
  const readOnly = !!data?.review || data?.order.status !== "DELIVERED";
  const submit = async () => {
    if (busy || readOnly) return;
    setBusy(true);
    setError(null);
    try {
      await service.sendReview(orderId, draft.value);
      await query.reload();
    } catch (e) {
      setError(explain(e));
      await query.reload();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen
      title={data?.review ? "Đánh giá đã gửi" : "Một lời cảm ơn"}
      subtitle={`Dành cho tài xế · Đơn #${orderId}`}
      back
      footer={
        data && !readOnly ? (
          <Button
            title="Gửi đánh giá"
            busy={busy}
            disabled={!draft.ready || value.note.length > 300}
            onPress={() => {
              void submit();
            }}
          />
        ) : undefined
      }
    >
      <LoadState
        loading={query.loading}
        error={query.error}
        retry={() => {
          void query.reload();
        }}
      />
      {error && <Banner error>{error}</Banner>}
      {data && (
        <>
          <View style={{ alignItems: "center" }}>
            <Panda size={150} pose={data.review ? "success" : "hello"} />
            <Heading>{data.order.driverName ?? "Tài xế giao món"}</Heading>
          </View>
          {data.order.status !== "DELIVERED" && (
            <Banner>Chỉ đánh giá sau khi đơn đã giao thành công.</Banner>
          )}
          {data.review && (
            <Banner>
              Đánh giá đã được lưu. Mỗi đơn có một đánh giá tài xế.
            </Banner>
          )}
          <View
            style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}
          >
            {[1, 2, 3, 4, 5].map((stars) => (
              <Button
                key={stars}
                title={stars <= value.stars ? "★" : "☆"}
                accessibilityLabel={`${stars} sao`}
                variant="ghost"
                disabled={readOnly || !draft.ready}
                onPress={() => draft.update({ ...value, stars })}
              />
            ))}
          </View>
          <Card>
            <Heading>Bạn hài lòng về điều gì?</Heading>
            <View style={{ gap: 10 }}>
              {[
                ["SERVICE", "Phục vụ tận tâm"],
                ["FRIENDLY", "Thân thiện"],
                ["DELIVERY", "Giao nhận chu đáo"],
              ].map(([tag, label]) => (
                <Chip
                  key={tag}
                  title={label}
                  selected={value.tags.includes(tag)}
                  disabled={readOnly || !draft.ready || busy}
                  onPress={() => {
                    if (!readOnly && draft.ready)
                      draft.update({
                        ...value,
                        tags: value.tags.includes(tag)
                          ? value.tags.filter((t) => t !== tag)
                          : [...value.tags, tag],
                      });
                  }}
                />
              ))}
            </View>
            <Field
              label="Nhận xét (không bắt buộc)"
              multiline
              editable={!readOnly && draft.ready && !busy}
              value={value.note}
              maxLength={300}
              onChangeText={(note) => draft.update({ ...value, note })}
            />
            <Text style={[styles.muted, { color: colors.muted }]}>
              {value.note.length}/300 ·{" "}
              {data.review
                ? "Đã gửi đánh giá"
                : draft.saved
                  ? "Đã lưu nháp"
                  : "Nhận xét của bạn sẽ gắn với đơn này."}
            </Text>
            {draft.error && <Label>{draft.error}</Label>}
          </Card>
        </>
      )}
    </Screen>
  );
}
