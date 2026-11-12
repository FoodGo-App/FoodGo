import React, {useState} from 'react';
import {RefreshControl, ScrollView, Text, View, useWindowDimensions} from 'react-native';
import {router} from 'expo-router';
import type {Order,Tracking} from '../../../shared/types/domain';
import {GuiScreen,GuiModal,Icon,IconButton,DriverAvatar,guiStyles as g} from '../../../shared/components/Gui';
import {IllustratedMap} from '../../../shared/components/IllustratedMap';
import {Banner,Button,Field,MealItems,MoneyRows,Panda} from '../../../shared/components/ui';
import {AnimatedChange,SuccessMotion} from '../../../shared/components/Motion';
import {FoodThumbnail} from '../../../shared/components/FoodThumbnail';
import {colors,dateTime,explain,money,statusLabels} from '../../../shared/theme/theme';
import {customerPresentation} from '../lib/customerPresentation';

export function CustomerOrderView({order,tracking,trackingError,error,busy,onRefresh,onCancel,onRetry}: {order:Order;tracking:Tracking|null;trackingError:string|null;error:string|null;busy:boolean;onRefresh:()=>void;onCancel:(reason:string)=>Promise<void>;onRetry:()=>void}){
 const state=customerPresentation(order),{height}=useWindowDimensions();
 const [details,setDetails]=useState(false),[help,setHelp]=useState(false),[cancel,setCancel]=useState(false),[reason,setReason]=useState(''),[cancelError,setCancelError]=useState<string|null>(null);
 const go=(kind:'conversations'|'calls'|'reviews')=>router.push({pathname:kind==='conversations'?'/conversations/[orderId]':kind==='calls'?'/calls/[orderId]':'/reviews/[orderId]',params:{orderId:order.id}});
 const summary=<View style={{...g.row,backgroundColor:colors.mint,padding:14,borderRadius:16}}><FoodThumbnail foodId={order.items[0]?.foodId} imageCode={order.items[0]?.imageCode} size={52}/><View style={{flex:1,gap:4}}><Text style={g.heading}>{order.restaurantName}</Text><Text style={g.muted}>{order.items.reduce((n,x)=>n+x.quantity,0)} phần · {order.paymentMethod==='COD'?'Tiền mặt':'Ví thử nghiệm'}</Text></View><Text style={{fontWeight:'800',color:colors.orange,fontSize:19}}>{money(order.total)}</Text></View>;
 return <>
  <GuiScreen title={state.tracking?'Theo dõi giao hàng':'Theo dõi đơn'} subtitle={`#${order.id}`} scroll={!state.tracking} onRefresh={onRefresh}>
   {error&&<View style={{padding:16,gap:8}}><Banner error>{error}</Banner><Button title="Thử cập nhật đơn" variant="secondary" onPress={onRefresh}/></View>}
   {state.tracking?<ScrollView contentContainerStyle={{flexGrow:1}} refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.brand}/>}>
    {tracking?.mapAssetCode==='AREA_A'?<IllustratedMap restaurantName={order.restaurantName} addressText={order.addressText} tracking height={Math.max(240,Math.min(420,height*0.48))}/>:<View style={{minHeight:230,alignItems:'center',justifyContent:'center',padding:24,gap:12}}><Icon name="pin" size={48}/><Text style={g.muted}>{trackingError||'Chưa có bản đồ minh họa cho khu vực này.'}</Text><Button title="Cập nhật theo dõi" variant="ghost" onPress={onRefresh}/></View>}
    <View style={{padding:20,gap:17,borderTopLeftRadius:24,borderTopRightRadius:24,backgroundColor:colors.paper}}>
     <Text style={g.heading}>{state.heading}</Text>
     {trackingError&&<><Banner error>Chưa cập nhật được theo dõi. Thông tin đang hiển thị từ lần tải trước.</Banner><Button title="Cập nhật theo dõi" variant="secondary" onPress={onRefresh}/></>}
     {tracking&&!trackingError&&!error&&<View style={g.row}><View style={{...g.row,padding:9,borderRadius:20,backgroundColor:'#F9EAD9'}}><Icon name="clock" color={colors.orange}/><Text style={{color:colors.orange,fontSize:19,fontWeight:'800'}}>{tracking.etaMinutes} phút</Text></View><Text style={g.muted}>Thời gian dự kiến mẫu</Text></View>}
     <View style={g.row}><Icon name="pin"/><View style={{flex:1}}><Text style={g.muted}>Giao đến</Text><Text style={g.text}>{order.addressText}</Text></View></View><View style={g.divider}/>
     <View style={g.row}><DriverAvatar name={order.driverName||'Tài xế'} uri={order.driverAvatarUrl} size={52}/><View style={{flex:1}}><Text style={{...g.heading,fontSize:17}}>{order.driverName||'Tài xế đã nhận chuyến'}</Text><Text style={g.muted}>Tài xế FoodGo</Text></View><IconButton name="call" label="Gọi tài xế dùng thử" onPress={()=>go('calls')}/><IconButton name="chat" label="Nhắn tin tài xế" onPress={()=>go('conversations')}/></View>
     <Button title="Chi tiết đơn và tiến trình" variant="ghost" onPress={()=>setDetails(true)}/>
     {order.issue&&<Banner>Trở ngại giao hàng: {order.issue}</Banner>}
     <Button title="Cần hỗ trợ?" variant="ghost" onPress={()=>setHelp(true)}/>
    </View>
   </ScrollView>:<>
    <View style={{alignItems:'center',paddingVertical:16,gap:14}}>
     <Icon name={state.terminal?'check':'clock'} size={34}/><Text style={g.muted}>{state.terminal?statusLabels[order.paymentStatus]:order.status==='PENDING_CONFIRMATION'?'Đơn đã được gửi đến quán':'Quán đã nhận đơn'}</Text>
     <AnimatedChange changeKey={state.heading}><Text style={{...g.title,fontSize:27,lineHeight:35}}>{state.heading}</Text></AnimatedChange>
     {state.canReview?<SuccessMotion><Panda size={165} pose="success"/></SuccessMotion>:<Panda size={165} pose={state.terminal?'empty':'waiting'}/>}
     <Text style={{...g.muted,textAlign:'center',maxWidth:320}}>{state.canReview?'Cảm ơn bạn đã chọn FoodGo. Chia sẻ cảm nhận về chuyến giao nhé.':state.terminal?'Bạn có thể xem lại món, thanh toán và tiến trình trong chi tiết đơn.':order.deliveryStatus==='NO_DRIVER'?'Chưa có tài xế nhận chuyến. Bạn có thể thử tìm lại khi hệ thống cho phép.':order.status==='PENDING_CONFIRMATION'?'Quán sẽ kiểm tra món và xác nhận đơn của bạn.':'Chúng mình sẽ cập nhật khi tài xế nhận chuyến.'}</Text>
    </View>
    {!state.terminal&&<View style={{flexDirection:'row',gap:2,marginVertical:10}}>{state.steps.map(step=><View key={step.label} style={{flex:1,alignItems:'center',gap:9}}><View style={{height:2,backgroundColor:step.done?colors.brand:colors.line,position:'absolute',left:0,right:0,top:12}}/><View style={{height:25,width:25,borderRadius:13,borderWidth:2,borderColor:step.done||step.active?colors.brand:colors.line,backgroundColor:step.done||step.active?colors.brand:colors.paper,alignItems:'center',justifyContent:'center'}}>{step.done?<Icon name="check" size={15} color="white"/>:step.active?<View style={{width:7,height:7,borderRadius:4,backgroundColor:'white'}}/>:null}</View><Text style={{fontSize:11,lineHeight:16,textAlign:'center',color:step.active?colors.brand:colors.muted,fontWeight:step.active?'700':'400'}}>{step.label}</Text></View>)}</View>}
    {summary}
    {state.canReview&&<Button title="Đánh giá tài xế" onPress={()=>go('reviews')}/>}
    {state.canRetry&&<Button title="Tìm lại tài xế" busy={busy} onPress={onRetry}/>}
    <Button title="Xem chi tiết đơn" variant="ghost" onPress={()=>setDetails(true)}/>
    <Button title="Cần hỗ trợ?" variant="secondary" onPress={()=>setHelp(true)}/>
   </>}
  </GuiScreen>
  <GuiModal title="Chi tiết đơn" visible={details} onClose={()=>setDetails(false)} footer={<Button title="Xong" onPress={()=>setDetails(false)}/>}>
   <Text style={g.heading}>{order.restaurantName} · #{order.id}</Text><Text style={g.text}>{order.recipientName} · {order.recipientPhone}</Text><Text style={g.muted}>{order.addressText}</Text><MealItems items={order.items}/><View style={g.divider}/><MoneyRows data={order}/><Text style={g.muted}>{statusLabels[order.paymentStatus]} · {order.paymentMethod==='COD'?'Tiền mặt':'Ví thử nghiệm'}</Text><Text style={g.heading}>Tiến trình đơn hàng</Text>{order.events.map(e=><View key={e.id} style={{...g.row,alignItems:'flex-start'}}><Icon name="check" size={17}/><View style={{flex:1}}><Text style={g.text}>{e.text}</Text><Text style={g.muted}>{dateTime(e.createdAt)}</Text></View></View>)}
   {state.terminal&&order.driverId&&<Button title="Đọc lại hội thoại" variant="secondary" onPress={()=>{setDetails(false);go('conversations');}}/>}
  </GuiModal>
  <GuiModal title="Hỗ trợ đơn hàng" visible={help} onClose={()=>setHelp(false)}>
   <Text style={g.heading}>Mình có thể giúp gì cho bạn?</Text><Text style={g.text}>{state.canCancel?'Bạn có thể hủy khi quán chưa tiếp nhận.':'Đơn đã được xử lý theo trạng thái hiện tại. Bạn có thể trao đổi với tài xế khi đã có người nhận chuyến.'}</Text>
   {order.driverId&&!state.terminal&&<Button title="Nhắn người giao món" onPress={()=>{setHelp(false);go('conversations');}}/>}
   {state.canRetry&&<Button title="Tìm lại tài xế" busy={busy} onPress={()=>{setHelp(false);onRetry();}}/>}
   {state.canCancel&&<Button title="Hủy đơn hàng" variant="danger" onPress={()=>{setHelp(false);setCancel(true);}}/>}
   <Button title="Xem thông tin đơn" variant="secondary" onPress={()=>{setHelp(false);setDetails(true);}}/>
  </GuiModal>
  <GuiModal title="Hủy đơn hàng" visible={cancel} onClose={()=>{if(!busy)setCancel(false);}} footer={<Button title="Xác nhận hủy đơn" variant="danger" busy={busy} disabled={!reason.trim()||!state.canCancel} onPress={()=>{void(async()=>{try{setCancelError(null);await onCancel(reason.trim());setCancel(false);setReason('');}catch(e){setCancelError(explain(e));}})();}} />}><Text style={g.text}>Bạn muốn hủy vì lý do gì?</Text><Field label="Lý do hủy" value={reason} onChangeText={setReason} maxLength={300} multiline editable={!busy}/>{cancelError&&<Banner error>{cancelError}</Banner>}<Text style={g.muted}>Quán chưa tiếp nhận thì đơn mới có thể hủy. Tiền ví thử nghiệm được hoàn theo kết quả hệ thống.</Text></GuiModal>
 </>;
}
