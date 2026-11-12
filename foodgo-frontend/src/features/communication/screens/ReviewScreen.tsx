import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useApp } from "../../../providers/AppProvider";
import { Banner, Button, Field, Heading, Label, LoadState, RequireRole } from "../../../shared/components/ui";
import { DriverAvatar, GuiScreen, Icon, guiStyles } from "../../../shared/components/Gui";
import { MotionPressable } from "../../../shared/components/Motion";
import { ratingDescription } from "../lib/presentation";
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
  const draft = useDraft<ReviewInput & {pending?:ReviewInput|null}>("review", orderId, {
    stars: 5,
    tags: [],
    note: "",
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  const data = query.data;
  const value = data?.review ?? draft.value.pending ?? draft.value;
  const readOnly = !!data?.review || data?.order.status !== "DELIVERED";
  const submit = async () => {
    if (busy || readOnly) return;
    setBusy(true);
    setError(null);
    try {
      const input=draft.value.pending??{stars:draft.value.stars,tags:draft.value.tags,note:draft.value.note};
      await draft.update({...input,pending:input});
      await service.sendReview(orderId, input);
      await draft.update({...input,pending:null});
      await query.reload();
    } catch (e) {
      if((e as {code?:string}).code==="INVALID_REVIEW")await draft.update({...draft.value,pending:null}).catch(()=>{});
      setError(explain(e));
      await query.reload();
    } finally {
      setBusy(false);
    }
  };
  const frozen = readOnly || !draft.ready || busy || !!draft.value.pending;
  return (
    <GuiScreen title={data?.review ? "Đánh giá đã gửi" : "Đánh giá tài xế"}
      footer={data && !readOnly ? <Button title={draft.value.pending ? "Kiểm tra đánh giá vừa gửi" : "Gửi đánh giá"} busy={busy} disabled={!draft.ready || value.note.length > 300} onPress={() => { void submit(); }} /> : undefined}>
      <LoadState loading={query.loading} error={query.error} retry={() => { void query.reload(); }} />
      {error && <Banner error>{error}</Banner>}
      {data && <>
        <View style={reviewStyles.identity}>
          <DriverAvatar name={data.order.driverName ?? "Tài xế giao món"} uri={data.order.driverAvatarUrl} size={148} />
          <Text style={reviewStyles.name}>{data.order.driverName ?? "Tài xế giao món"}</Text>
          <Label muted>Đơn #{orderId}{data.order.status === "DELIVERED" ? " · Đã giao thành công" : ""}</Label>
        </View>
        {data.order.status !== "DELIVERED" && <Banner>Chỉ đánh giá sau khi đơn đã giao thành công.</Banner>}
        {data.review && <Banner>Đánh giá đã được lưu. Cảm ơn bạn đã chia sẻ!</Banner>}
        {!data.review && draft.value.pending && <Banner>Đánh giá đang chờ xác nhận. Kiểm tra lại với nội dung vừa gửi.</Banner>}
        <View style={{alignItems:"center",gap:12}}>
          <Heading>Bạn thấy chuyến giao thế nào?</Heading>
          <View style={reviewStyles.stars}>
            {[1,2,3,4,5].map(stars => <MotionPressable key={stars} accessibilityRole="button" accessibilityLabel={`${stars} sao`} accessibilityState={{disabled:frozen,selected:stars===value.stars}} disabled={frozen} onPress={() => { void draft.update({...value,stars,pending:null}).catch(() => {}); }} style={reviewStyles.star}>
              <Icon name="star" size={34} color={stars <= value.stars ? "#F59A16" : colors.line} />
            </MotionPressable>)}
          </View>
          <Text style={guiStyles.muted}>{ratingDescription(value.stars)}</Text>
        </View>
        <View style={reviewStyles.tags}>
          {[["SERVICE","Phục vụ tận tâm"],["FRIENDLY","Thân thiện"],["DELIVERY","Giao nhận chu đáo"]].map(([tag,label]) => {
            const selected = value.tags.includes(tag);
            return <MotionPressable key={tag} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{checked:selected,disabled:frozen}} disabled={frozen}
              style={[reviewStyles.tag,{backgroundColor:selected ? colors.mint : "#F0F0EE"}]} onPress={() => { if (!frozen) void draft.update({...value,tags:selected ? value.tags.filter(t => t !== tag) : [...value.tags,tag]}).catch(() => {}); }}>
              {selected && <Icon name="check" size={20} />}<Text style={{fontSize:14,lineHeight:20,color:selected ? colors.brand : colors.muted,fontWeight:selected ? "700" : "400"}}>{label}</Text>
            </MotionPressable>;
          })}
        </View>
        <Field label="Nhắn thêm đôi lời" placeholder="Chia sẻ cảm nhận của bạn…" multiline editable={!frozen} value={value.note} maxLength={300}
          onChangeText={(note) => { void draft.update({...value,note,pending:null}).catch(() => {}); }} />
        <Text style={guiStyles.muted}>{value.note.length}/300 · {data.review ? "Đã gửi đánh giá" : draft.saved ? "Đã lưu nháp" : "Nhận xét không bắt buộc"}</Text>
        {draft.error && <Banner error>{draft.error}</Banner>}
        {draft.error && !draft.ready && <Button title="Thử đọc lại đánh giá nháp" onPress={() => { void draft.reload(); }} />}
        <View style={{alignItems:"center",flexDirection:"row",justifyContent:"center",gap:8}}><Icon name="heart" size={20} /><Label muted>Cảm ơn bạn đã chia sẻ!</Label></View>
      </>}
    </GuiScreen>
  );
}
const reviewStyles = StyleSheet.create({
  identity:{alignItems:"center",gap:12,paddingTop:4},name:{fontSize:25,lineHeight:32,fontWeight:"800",color:colors.ink,textAlign:"center"},
  stars:{flexDirection:"row",flexWrap:"wrap",justifyContent:"center",gap:2},star:{minHeight:44,minWidth:44,alignItems:"center",justifyContent:"center"},
  tags:{flexDirection:"row",justifyContent:"center",flexWrap:"wrap",gap:10,paddingVertical:6},tag:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,borderRadius:25,paddingHorizontal:16,paddingVertical:12,minHeight:44},
});
