import React, { useMemo, useRef, useState } from "react";
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
import { mergeHistory, MessageTimeline } from "../lib/history";
import { AnimatedChange } from "../../../shared/components/Motion";
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
  const timeline=useMemo(()=>new MessageTimeline<Message>(`${session?.user.id}:${orderId}`),[orderId,session?.user.id]);
  const query = useResource(
    async () => {
      const [conversation, messages] = await Promise.all([
        service.conversation(orderId),
        timeline.refresh(after=>service.messages(orderId,undefined,after)),
      ]);
      return { conversation, messages };
    },
    true,
    true,
    orderId,
    (previous, incoming) => ({ ...incoming, messages: mergeHistory(previous ? {scope: orderId, messages: previous.messages} : null, orderId, incoming.messages).messages }),
  );
  const draft = useDraft<{ text: string; pending: MessageInput | null }>(
    "chat",
    orderId,
    { text: "", pending: null },
  );
  const historyScope = `${session!.user.id}:${orderId}`;
  const [older, setOlder] = useState<{scope:string; messages:Message[]; hasOlder:boolean}>({scope:"",messages:[],hasOlder:true}),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const lock = useRef(false);
  const messages = mergeHistory(older, historyScope, query.data?.messages ?? []).messages;
  const hasOlder = older.scope === historyScope ? older.hasOlder : true;
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
      const sent = await service.send(orderId, input);
      timeline.add([sent]);
      setOlder(previous=>({...mergeHistory(previous,historyScope,[sent]),hasOlder:previous.scope===historyScope?previous.hasOlder:true}));
      await draft.update({ text: "", pending: null });
      await query.reload();
    } catch (e) {
      const code = (e as {code?:string}).code;
      if(code === "MESSAGE_READ_ONLY" || code === "INVALID_MESSAGE") {
        await draft.update({text:draft.value.text,pending:null}).catch(()=>{});
      }
      setError(explain(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const more = async () => {
    if(lock.current)return;
    lock.current=true;
    setBusy(true);
    setError(null);
    try {
      const old = await service.messages(orderId, messages[0]?.id);
      timeline.add(old);
      setOlder(previous=>({...mergeHistory(previous,historyScope,old),hasOlder:old.length===20}));
    } catch (e) {
      setError(explain(e));
    } finally {
      lock.current=false;
      setBusy(false);
    }
  };
  const peer = query.data?.conversation.participants.find(
    (p) => p.id !== session!.user.id,
  );
  return (
    <Screen
      title={peer?.displayName ?? "Trò chuyện"}
      subtitle={`Đơn #${orderId}`}
      back
      footer={
        query.data && (
          <>
            {readOnly ? (
              <>
                <Banner>Đơn đã kết thúc. Bạn vẫn có thể đọc lại cuộc trò chuyện.</Banner>
                {draft.value.pending && <Button title="Kiểm tra tin vừa gửi" busy={busy} onPress={()=>{void send();}} />}
              </>
            ) : (
              <>
                <Field
                  label="Tin nhắn"
                  multiline
                  maxLength={1000}
                  editable={draft.ready && !busy && !draft.value.pending}
                  value={draft.value.text}
                  onChangeText={(text) => { void draft.update({ text, pending: null }).catch(()=>{}); }}
                  placeholder="Nhắn người giao món…"
                />
                {draft.error && <Banner error>{draft.error}</Banner>}
                <Label muted>
                  {draft.saved
                    ? "Đã lưu tin nhắn nháp"
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
                    title="Gửi ảnh minh họa"
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
      {draft.error&&<><Banner error>{draft.error}</Banner>{!draft.ready&&<Button title="Thử đọc lại tin nhắn nháp" onPress={()=>{void draft.reload();}} />}</>}
      {query.data && (
        <>
          {!readOnly && (
            <Button
              title="Gọi tài xế · dùng thử"
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
            Nhắn nhau để giao món thuận tiện hơn. Hiện bạn có thể gửi ảnh minh họa có sẵn.
          </Banner>
          {hasOlder && messages.length >= 20 && (
            <Button
              title="Xem tin nhắn trước"
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
            <AnimatedChange changeKey={m.id} key={m.id}>
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
            </AnimatedChange>
          ))}
        </>
      )}
    </Screen>
  );
}
