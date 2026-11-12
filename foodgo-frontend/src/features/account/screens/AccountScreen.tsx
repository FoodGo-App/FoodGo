import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {router,type Href} from 'expo-router';
import {useApp} from '../../../providers/AppProvider';
import {Banner,Button,Chip,Panda} from '../../../shared/components/ui';
import {GuiModal} from '../../../shared/components/Gui';
import {M01Screen,MenuRow,m} from '../../catalog/components/M01Layout';
import {loginHref} from '../loginReturn';
import {explain} from '../../../shared/theme/theme';
export default function AccountScreen(){
 const {session,mode,logout,request}=useApp();
 const [busy,setBusy]=useState(false),[message,setMessage]=useState<string|null>(null),[walletChoice,setWalletChoice]=useState<string|null>(null),[callChoice,setCallChoice]=useState<string|null>(null),[settings,setSettings]=useState(false);
 const setting=async(payload:{walletScenario?:string;callScenario?:string})=>{if(busy)return;setBusy(true);try{await request('/demo/settings','POST',payload);if(payload.walletScenario)setWalletChoice(payload.walletScenario);if(payload.callScenario)setCallChoice(payload.callScenario);setMessage('Đã lưu lựa chọn cho lần dùng thử tiếp theo.');}catch(e){setMessage(explain(e));}finally{setBusy(false);}};
 return <><M01Screen title="Tài khoản" subtitle="Thông tin và tiện ích của bạn">
  <View style={{...m.card,flexDirection:'row',alignItems:'center',gap:14,minHeight:130}}><Panda size={68}/><View style={{flex:1,gap:6}}><Text style={m.heading}>{session?.user.displayName??'Chào mừng đến FoodGo'}</Text><Text style={m.meta}>{session?(session.user.role==='CUSTOMER'?'Khách hàng':session.user.role==='DRIVER'?'Tài xế':'Nhà hàng'):'Đăng nhập để lưu món và địa chỉ'}</Text><Text style={m.meta}>{session?'Đã đăng nhập':'Bạn đang xem với vai trò khách'}</Text></View></View>
  {session?<>
   {session.user.role==='CUSTOMER'?<><MenuRow icon="pin" title="Địa chỉ giao hàng" detail="Quản lý tối đa 10 địa chỉ" onPress={()=>router.push('/addresses' as Href)}/><MenuRow icon="store" title="Đơn hàng của tôi" detail="Xem và theo dõi đơn" onPress={()=>router.push('/(customer)/(tabs)/orders')}/><MenuRow icon="heart" title="Món và quán yêu thích" detail="Xem lại những món đã lưu" onPress={()=>router.push('/(customer)/(tabs)/favorites')}/></>:<MenuRow icon="store" title="Mở công việc" onPress={()=>router.replace(session.user.role==='RESTAURANT'?'/restaurant':'/driver')}/>}
   {mode==='demo'&&<><MenuRow icon="person" title="Đổi tài khoản dùng thử" onPress={()=>router.push(loginHref('/account'))}/><MenuRow icon="edit" title="Tùy chọn dùng thử" onPress={()=>setSettings(true)}/></>}
   <View style={{marginTop:12}}><Button title="Đăng xuất" variant="secondary" busy={busy} onPress={()=>{void logout();router.replace('/');}}/></View>
  </>:<Button title="Đăng nhập" onPress={()=>router.push(loginHref('/account'))}/>}
  {message&&<Banner>{message}</Banner>}<Text style={m.meta}>Thông tin và món đã lưu thuộc tài khoản của bạn.</Text>
 </M01Screen><GuiModal title="Tùy chọn dùng thử" visible={settings} onClose={()=>setSettings(false)}>
  <Text style={m.meta}>Chỉ áp dụng trong lần dùng thử, không phát sinh thanh toán hay âm thanh thật.</Text>{[['SUCCEEDED','Ví thành công'],['FAILED','Ví chưa thanh toán được']].map(([id,title])=><Chip key={id} title={title} selected={walletChoice===id} disabled={busy} onPress={()=>{void setting({walletScenario:id});}}/>)}{[['CONNECTED','Gọi: kết nối'],['NO_ANSWER','Gọi: không trả lời'],['FAILED','Gọi: chưa kết nối được']].map(([id,title])=><Chip key={id} title={title} selected={callChoice===id} disabled={busy} onPress={()=>{void setting({callScenario:id});}}/>)}
 </GuiModal></>;
}
