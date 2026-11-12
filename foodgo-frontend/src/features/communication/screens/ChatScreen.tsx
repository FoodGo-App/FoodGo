import React, { useMemo, useRef, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import { Banner, Button, Card, Heading, Label, LoadState, RequireRole } from "../../../shared/components/ui";
import { GuiScreen, IconButton, guiStyles } from "../../../shared/components/Gui";
import { conversationPeer } from "../lib/presentation";
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
  const peer = conversationPeer(query.data?.conversation.participants ?? [], session!.user.id);
  return (
    <GuiScreen title={peer?.displayName ?? "Trò chuyện"} subtitle={`Đơn #${orderId}`} scroll={false}
      right={query.data && !readOnly ? <IconButton name="call" label="Gọi mô phỏng" variant="plain" onPress={() => router.push({ pathname: "/calls/[orderId]", params: { orderId } })} /> : undefined}
      footer={query.data ? <>
        {readOnly && <Label muted>Đơn đã kết thúc · Hội thoại chỉ đọc.</Label>}
        {draft.value.pending && <Label muted>Tin đang chờ xác nhận · Thử lại với nội dung đã gửi.</Label>}
        {(!readOnly || draft.value.pending) && <View style={chatStyles.composer}>
          {!draft.value.pending && !readOnly && <IconButton name="add" label="Gửi ảnh món ăn minh họa có sẵn" variant="plain" disabled={!draft.ready || busy} onPress={() => { void send(true); }} />}
          {!readOnly && <TextInput accessibilityLabel="Tin nhắn" placeholder="Nhắn người giao món…" placeholderTextColor={colors.muted}
            multiline maxLength={1000} editable={draft.ready && !busy && !draft.value.pending}
            value={draft.value.text} onChangeText={(text) => { void draft.update({ text, pending: null }).catch(() => {}); }} style={chatStyles.input} />}
          <IconButton name={draft.value.pending ? "refresh" : "send"} label={draft.value.pending ? "Thử lại tin đã gửi" : "Gửi tin"}
            disabled={busy || !draft.ready || (!draft.value.text.trim() && !draft.value.pending)} onPress={() => { void send(); }} />
        </View>}
        {!draft.ready && !draft.error && <Label muted>Đang khôi phục nháp…</Label>}
      </> : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{flex:1}} contentContainerStyle={chatStyles.timeline}>
        <LoadState loading={query.loading} error={query.error} retry={() => { void query.reload(); }} />
        {error && <Banner error>{error}</Banner>}
        {draft.error && <><Banner error>{draft.error}</Banner>{!draft.ready && <Button title="Thử đọc lại tin nhắn nháp" onPress={() => { void draft.reload(); }} />}</>}
        {query.data && <>
          {hasOlder && messages.length >= 20 && <Button title="Xem tin nhắn trước" busy={busy} variant="ghost" onPress={() => { void more(); }} />}
          {!messages.length && <Card><Heading>Bắt đầu lời chào</Heading><Label muted>Trao đổi ghi chú giao nhận tại đây. Nút + gửi một ảnh món ăn minh họa có sẵn.</Label></Card>}
          {messages.map((m) => {
            const own = m.senderId === session!.user.id;
            return <AnimatedChange changeKey={m.id} key={m.id}>
              <View style={{alignSelf:own ? "flex-end" : "flex-start",maxWidth:"88%",gap:5}}>
                <View style={[chatStyles.bubble,{backgroundColor:own ? colors.mint : "#F0F0EE"}]}>
                  {!own && <Text style={chatStyles.sender}>{m.senderName}</Text>}
                  {m.kind === "IMAGE" ? <>
                    <Image source={require("../../../../assets/images/food/chicken-rice.png")} accessibilityLabel="Ảnh cơm gà minh họa đính kèm" style={chatStyles.attachment} resizeMode="cover" />
                    <Label muted>Ảnh mẫu minh họa</Label>
                  </> : <Text style={guiStyles.text}>{m.text}</Text>}
                </View>
                <Text style={[chatStyles.time,{textAlign:own ? "right" : "left"}]}>{dateTime(m.createdAt)}</Text>
              </View>
            </AnimatedChange>;
          })}
        </>}
      </ScrollView>
    </GuiScreen>
  );
}
const chatStyles = StyleSheet.create({
  timeline:{padding:18,gap:18,paddingBottom:24,flexGrow:1},composer:{flexDirection:"row",alignItems:"center",gap:6},
  input:{flex:1,minWidth:0,minHeight:46,maxHeight:120,borderRadius:25,backgroundColor:"#F0F0EE",paddingHorizontal:16,paddingVertical:12,fontSize:15,lineHeight:21,color:colors.ink},
  bubble:{borderRadius:20,padding:14,gap:6},sender:{fontSize:12,color:colors.muted},time:{fontSize:11,lineHeight:16,color:colors.muted,paddingHorizontal:3},attachment:{width:200,height:150,maxWidth:"100%",borderRadius:14},
});
