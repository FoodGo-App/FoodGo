import React, { useRef, useState } from "react";
import { Image, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import {
  Banner,
  Button,
  Card,
  Field,
  Heading,
  Label,
  LoadState,
  RequireRole,
  Screen,
  styles,
} from "../../../shared/components/ui";
import { useResource } from "../../../shared/hooks/useResource";
import { useDraft } from "../../../shared/hooks/useDraft";
import { communicationService } from "../services/communicationService";
import { colors, dateTime, explain } from "../../../shared/theme/theme";
import { newRequestKey } from "../../../shared/utils/id";
import type { Message, MessageInput } from "../../../shared/types/domain";
export default function ChatScreen() {
  return (
    <RequireRole roles={["CUSTOMER", "DRIVER"]}>
      <Chat />
    </RequireRole>
  );
}
function Chat() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { request, session } = useApp();
  const service = communicationService(request);
  const query = useResource(
    async () => {
      const [conversation, messages] = await Promise.all([
        service.conversation(orderId),
        service.messages(orderId),
      ]);
      return { conversation, messages };
    },
    true,
    true,
    orderId,
  );
  const draft = useDraft<{ text: string; pending: MessageInput | null }>(
    "chat",
    orderId,
    { text: "", pending: null },
  );
  const [older, setOlder] = useState<Message[]>([]),
    [hasOlder, setHasOlder] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const messages = [...older, ...(query.data?.messages ?? [])].filter(
    (x, i, a) => a.findIndex((y) => y.id === x.id) === i,
  );
  const readOnly = query.data?.conversation.readOnly ?? true;
  const send = async (image = false) => {
    if (lock.current || !draft.ready || (readOnly && !draft.value.pending))
      return;
    lock.current = true;
    setBusy(true);
    setError(null);
    const input = draft.value.pending ?? {
      clientMessageId: newRequestKey(),
      kind: image ? ("IMAGE" as const) : ("TEXT" as const),
      ...(image
        ? { assetCode: "MEAL_SAMPLE" }
        : { text: draft.value.text.trim() }),
    };
    try {
      if (input.kind === "TEXT" && !input.text) return;
      await draft.update({ ...draft.value, pending: input });
      await service.send(orderId, input);
      await draft.update({ text: "", pending: null });
      await query.reload();
    } catch (e) {
      setError(explain(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const more = async () => {
    setBusy(true);
    setError(null);
    try {
      const old = await service.messages(orderId, messages[0]?.id);
      setOlder([...old, ...older]);
      setHasOlder(old.length === 20);
    } catch (e) {
      setError(explain(e));
    } finally {
      setBusy(false);
    }
  };
  const peer = query.data?.conversation.participants.find(
    (p) => p.id !== session!.user.id,
  );
  return (
    <Screen
      title={peer?.displayName ?? "Trò chuyện"}
      subtitle={`Theo đơn #${orderId} · Không có chatbot`}
      back
      footer={
        query.data && (
          <>
            {readOnly ? (
              <Banner>
                Đơn đã kết thúc. Bạn có thể xem lịch sử; không gửi tin mới.
              </Banner>
            ) : (
              <>
                <Field
                  label="Tin nhắn"
                  multiline
                  maxLength={1000}
                  editable={draft.ready && !busy && !draft.value.pending}
                  value={draft.value.text}
                  onChangeText={(text) => draft.update({ text, pending: null })}
                  placeholder="Nhắn người giao món…"
                />
                {draft.error && <Banner error>{draft.error}</Banner>}
                <Label muted>
                  {draft.saved
                    ? "Đã lưu nháp trên thiết bị"
                    : draft.ready
                      ? "Tối đa 1.000 ký tự"
                      : "Đang khôi phục nháp…"}
                </Label>
              </>
            )}
            {(!readOnly || draft.value.pending) && (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Button
                    title={
                      draft.value.pending ? "Thử lại tin đã gửi" : "Gửi tin"
                    }
                    disabled={
                      !draft.ready ||
                      (!draft.value.text.trim() && !draft.value.pending)
                    }
                    busy={busy}
                    onPress={() => {
                      void send();
                    }}
                  />
                </View>
                {!draft.value.pending && !readOnly && (
                  <Button
                    title="Ảnh mẫu"
                    variant="secondary"
                    disabled={!draft.ready}
                    busy={busy}
                    onPress={() => {
                      void send(true);
                    }}
                  />
                )}
              </View>
            )}
          </>
        )
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
      {query.data && (
        <>
          {!readOnly && (
            <Button
              title="Gọi thoại mô phỏng"
              variant="ghost"
              onPress={() =>
                router.push({
                  pathname: "/calls/[orderId]",
                  params: { orderId },
                })
              }
            />
          )}
          <Banner>
            Hội thoại riêng của khách và tài xế theo đơn. Ảnh đính kèm dùng bộ
            mẫu, không truy cập camera.
          </Banner>
          {hasOlder && messages.length >= 20 && (
            <Button
              title="Tải tin trước"
              busy={busy}
              variant="ghost"
              onPress={() => {
                void more();
              }}
            />
          )}
          {!messages.length && (
            <Card>
              <Heading>Bắt đầu lời chào</Heading>
              <Label muted>
                Bạn có thể trao đổi ghi chú giao nhận tại đây.
              </Label>
            </Card>
          )}
          {messages.map((m) => (
            <View
              key={m.id}
              style={{
                alignSelf:
                  m.senderId === session!.user.id ? "flex-end" : "flex-start",
                maxWidth: "88%",
                backgroundColor:
                  m.senderId === session!.user.id ? colors.mint : colors.white,
                borderRadius: 16,
                padding: 14,
                gap: 6,
                borderWidth: 1,
                borderColor: colors.line,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.muted }}>
                {m.senderName}
              </Text>
              {m.kind === "IMAGE" ? (
                <>
                  <Image
                    source={require("../../../../assets/images/food/chicken-rice.png")}
                    accessibilityLabel="Ảnh cơm gà minh họa đính kèm"
                    style={{ width: 160, height: 120, borderRadius: 10 }}
                    resizeMode="cover"
                  />
                  <Label muted>Ảnh mẫu đính kèm</Label>
                </>
              ) : (
                <Label>{m.text}</Label>
              )}
              <Text style={{ fontSize: 11, color: colors.muted }}>
                {dateTime(m.createdAt)}
              </Text>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}
