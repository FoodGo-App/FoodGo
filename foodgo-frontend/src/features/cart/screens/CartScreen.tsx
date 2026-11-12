import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {router,type Href} from 'expo-router';
import {ApiFeature} from '../../../shared/components/ApiFeature';
import {useApp} from '../../../providers/AppProvider';
import {useResource} from '../../../shared/hooks/useResource';
import {useWriteAction} from '../../../shared/hooks/useWriteAction';
import {Banner,Button,Empty,Label,LoadState,RequireRole} from '../../../shared/components/ui';
import {GuiModal,IconButton} from '../../../shared/components/Gui';
import {M01Screen,TinyAction,m} from '../../catalog/components/M01Layout';
import {money} from '../../../shared/theme/theme';
import {FoodThumbnail} from '../../../shared/components/FoodThumbnail';
import {catalogService} from '../../catalog/catalogService';
import {ChoiceFields} from '../ChoiceFields';
import {useCartService} from '../useCartService';
import {reconcileChoice,validateChoice,type CartLine,type Choice} from '../cartService';
export default function CartScreen(){return <ApiFeature><RequireRole roles={['CUSTOMER']}><Content/></RequireRole></ApiFeature>;}
function Content(){
 const service=useCartService(),data=useResource(()=>service.get(),true,false,'cart'),write=useWriteAction();
 const [edit,setEdit]=useState<string|null>(null),[remove,setRemove]=useState<string|null|false>(false),cart=data.data;
 const refresh=async()=>{if(await data.reload())write.reconciled();},pending=cart?.pendingMutation;
 const frozen=write.busy||!!pending||write.uncertain||!!data.error;
 const editing=cart?.items.find(line=>line.id===edit);
 const quantity=(line:CartLine,amount:number)=>{if(!cart||frozen)return;void write.run(async()=>{await service.edit(line,{optionValueIds:line.optionValueIds,note:line.note,quantity:amount},cart.version);await refresh();});};
 return <><M01Screen title="Giỏ hàng của tôi" subtitle="Chỉ chọn món từ một nhà hàng" back onRefresh={()=>{void refresh();}} right={<IconButton name="close" label="Xóa toàn giỏ" variant="plain" disabled={!cart?.items.length||frozen} onPress={()=>setRemove(null)}/>} footer={cart&&!!cart.items.length&&<><View style={m.between}><Text style={m.text}>Tạm tính tiền món</Text><Text style={m.price}>{money(cart.estimatedSubtotal)}</Text></View><Text style={m.meta}>Phí giao và ưu đãi sẽ hiện khi đặt đơn.</Text><Button title="Tiếp tục đặt món" disabled={!cart.items.length||cart.items.some(i=>i.valid===false)||frozen} onPress={()=>router.push('/checkout/review')}/></>}>
  <LoadState loading={data.loading} error={data.error} retry={()=>{void refresh();}}/>{write.error&&<Banner error>{write.error}</Banner>}
  {pending&&<View style={m.card}><Text style={m.heading}>Giỏ hàng cần kiểm tra lại</Text><Text style={m.text}>Kết nối vừa gián đoạn. Kiểm tra giỏ trước khi tiếp tục nhé.</Text>{cart.version>pending.version?<Button title="Tiếp tục với giỏ hiện tại" onPress={()=>{void write.run(()=>service.acknowledge(),()=>{void refresh();});}}/>:<Button title="Thử lại thay đổi vừa rồi" busy={write.busy} onPress={()=>{void write.run(()=>service.retryPending(),()=>{void refresh();});}}/>}</View>}
  {cart&&<>{cart.items.length?<View style={{...m.card,backgroundColor:'#E4F2EB',borderWidth:0}}><Text style={m.heading}>{cart.restaurantName} · {cart.items.reduce((n,x)=>n+x.quantity,0)} phần trong giỏ</Text></View>:<Empty title="Giỏ hàng trống" detail="Chọn món ngon rồi quay lại nhé." action={{title:'Khám phá món',onPress:()=>router.push('/catalog' as Href)}}/>}
   {cart.items.map(line=><View key={line.id} style={m.card}><View style={{...m.row,alignItems:'flex-start'}}><FoodThumbnail name={line.foodName} foodId={line.foodId} imageCode={line.imageCode} size={78}/><View style={{flex:1,gap:4}}><Text style={m.heading}>{line.foodName}</Text><Text style={m.meta}>{line.options||'Phần tiêu chuẩn'}{line.note?` · ${line.note}`:''}</Text><Text style={m.price}>{line.valid===false?'Cần chọn lại':money(line.lineTotal)}</Text></View></View>{line.valid===false&&<Banner error>{line.invalidMessage??'Món hoặc lựa chọn không còn hợp lệ. Hãy sửa hoặc bỏ món.'}</Banner>}<View style={m.between}><View style={m.row}><IconButton name="remove" label={`Giảm ${line.foodName}`} disabled={frozen||line.valid===false||line.quantity<=1} onPress={()=>quantity(line,line.quantity-1)}/><Text style={m.text}>{line.quantity}</Text><IconButton name="add" label={`Tăng ${line.foodName}`} disabled={frozen||line.valid===false||line.quantity>=99} onPress={()=>quantity(line,line.quantity+1)}/></View><View style={m.row}><TinyAction title="Sửa" disabled={frozen} onPress={()=>setEdit(line.id)}/><TinyAction title="Xóa" danger disabled={frozen} onPress={()=>setRemove(line.id)}/></View></View></View>)}
  </>}
 </M01Screen><GuiModal title="Sửa món trong giỏ" visible={!!editing} onClose={()=>setEdit(null)}>{editing&&cart&&<Editor key={`${editing.id}:${cart.version}`} line={editing} version={cart.version} done={()=>{setEdit(null);void refresh();}}/>}</GuiModal>
 <GuiModal title={remove===null?'Xóa giỏ hàng':'Bỏ món đã chọn'} visible={remove!==false} onClose={()=>{if(!write.busy)setRemove(false);}}>{cart&&<><Text style={m.text}>{remove===null?'Xóa toàn bộ món trong giỏ?':'Bạn muốn bỏ món này khỏi giỏ?'}</Text><Button title="Đồng ý xóa" variant="danger" busy={write.busy} disabled={!!pending||write.uncertain} onPress={()=>{void write.run(()=>service.remove(remove===false?null:remove,cart.version),()=>{setRemove(false);void refresh();});}}/><Button title="Giữ lại" variant="secondary" onPress={()=>setRemove(false)}/>{write.error&&<Banner error>{write.error}</Banner>}{write.uncertain&&<Button title="Cập nhật giỏ hàng" onPress={()=>{void refresh();}}/>}</>}</GuiModal></>;
}
function Editor({line,version,done}:{line:CartLine;version:number;done:()=>void}){const {request}=useApp(),service=useCartService(),food=useResource(()=>catalogService(request).food(line.foodId,true),true,false,`edit-food:${line.id}`),write=useWriteAction();const [choice,setChoice]=useState<Choice>({optionValueIds:line.optionValueIds,quantity:line.quantity,note:line.note});if(!food.data)return <LoadState loading={food.loading} error={food.error} retry={()=>{void food.reload();}} />;const value={...reconcileChoice(food.data,choice),quantity:choice.quantity,note:choice.note},error=validateChoice(food.data,value);return <View style={{gap:16}}><ChoiceFields food={food.data} value={value} onChange={setChoice} disabled={write.busy} />{error&&<Label>{error}</Label>}{write.error&&<Banner error>{write.error}</Banner>}{write.uncertain&&<Button title="Đọc lại giỏ để xác minh" onPress={done} />}<Button title="Lưu thay đổi" busy={write.busy} disabled={!!error||write.uncertain} onPress={()=>{void write.run(()=>service.edit(line,value,version),done);}} /><Button title="Đóng chỉnh sửa" variant="ghost" onPress={done} /></View>;}
