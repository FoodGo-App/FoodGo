import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {router,type Href} from 'expo-router';
import {useApp} from '../../providers/AppProvider';
import {Banner,Button} from '../../shared/components/ui';
import {GuiModal} from '../../shared/components/Gui';
import {useWriteAction} from '../../shared/hooks/useWriteAction';
import {ApiError} from '../../shared/api/http';
import {loginHref,safeReturnTo} from '../account/loginReturn';
import type {Food} from '../catalog/catalogService';
import {m,TinyAction} from '../catalog/components/M01Layout';
import {money} from '../../shared/theme/theme';
import {useCartService} from './useCartService';
import {ChoiceFields} from './ChoiceFields';
import {reconcileChoice,validateChoice,estimatedPrice,type Choice} from './cartService';
export function FoodPurchase({food,initial,onContextChange,render}: {food:Food;initial:Choice;onContextChange?:(path:string|null)=>void;render?:(body:React.ReactNode,actions:React.ReactNode)=>React.ReactNode}){
 const {session}=useApp(),service=useCartService(),write=useWriteAction();
 const [choice,setChoice]=useState(()=>reconcileChoice(food,initial)),[replace,setReplace]=useState<{choice:Choice;version:number;name:string}|null>(null),[message,setMessage]=useState<string|null>(null);
 const value={...reconcileChoice(food,choice),quantity:choice.quantity,note:choice.note},invalid=validateChoice(food,value);
 const context=(selected=value)=>safeReturnTo(`/food/${food.id}?${new URLSearchParams({options:selected.optionValueIds.join(','),quantity:String(selected.quantity),note:selected.note})}`);
 const add=()=>{if(!session){router.push(loginHref(context()));return;}if(session.user.role!=='CUSTOMER'){router.replace('/');return;}void write.run(async()=>{const cart=await service.get();try{return await service.add(food.id,value,cart.version);}catch(e){if(e instanceof ApiError&&e.code==='RESTAURANT_REPLACE_REQUIRED')setReplace({choice:{...value,optionValueIds:[...value.optionValueIds]},version:cart.version,name:cart.restaurantName??'quán cũ'});throw e;}},()=>setMessage('Đã thêm món vào giỏ của bạn.'));};
 const body=<><ChoiceFields food={food} showPrice={false} value={value} disabled={write.busy} onChange={v=>{setChoice(v);setReplace(null);setMessage(null);onContextChange?.(context(reconcileChoice(food,v)));}}/>{choice.optionValueIds.length!==value.optionValueIds.length&&<Banner>Một số tùy chọn không còn phục vụ. Kiểm tra lại trước khi thêm nhé.</Banner>}{invalid&&<Banner error>{invalid}</Banner>}{write.error&&<Banner error>{write.error}</Banner>}{message&&<Banner>{message}</Banner>}
  <GuiModal title="Đổi nhà hàng" visible={!!replace} onClose={()=>{if(!write.busy){setReplace(null);write.reconciled();}}}>{replace&&<><Text style={m.text}>Thay toàn bộ giỏ của {replace.name} bằng món này? Các món của quán cũ sẽ được bỏ.</Text><Button title="Xác nhận đổi quán" busy={write.busy} disabled={write.uncertain} onPress={()=>{void write.run(()=>service.add(food.id,replace.choice,replace.version,true),()=>{setReplace(null);setMessage('Đã đổi quán và cập nhật giỏ. Hãy kiểm tra lại.');});}}/><Button title="Giữ giỏ cũ" variant="secondary" onPress={()=>{setReplace(null);write.reconciled();}}/>{write.error&&<Banner error>{write.error}</Banner>}</>}</GuiModal>
 </>;
 const actions=<><View style={m.between}><Text style={m.meta}>Tạm tính {value.quantity} phần</Text><Text style={m.price}>{invalid?'—':money(estimatedPrice(food,value)*value.quantity)}</Text></View><View style={m.row}><TinyAction title="Xem giỏ" onPress={()=>router.push('/cart' as Href)}/><View style={{flex:1}}><Button title={session?'Thêm vào giỏ':'Đăng nhập để thêm giỏ'} busy={write.busy} disabled={!!invalid||write.uncertain} onPress={add}/></View></View></>;
 return render?<>{render(body,actions)}</>:<>{body}{actions}</>;
}
