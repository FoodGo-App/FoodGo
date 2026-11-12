import React,{useState} from 'react';
import {Text,View} from 'react-native';
import {ApiFeature} from '../../../shared/components/ApiFeature';
import {useApp} from '../../../providers/AppProvider';
import type {Address} from '../../../shared/types/domain';
import {Banner,Button,Chip,Empty,Field,Label,LoadState,RequireRole} from '../../../shared/components/ui';
import {GuiModal,Icon} from '../../../shared/components/Gui';
import {M01Screen,TinyAction,m} from '../../catalog/components/M01Layout';
import {useResource} from '../../../shared/hooks/useResource';
import {useDraft} from '../../../shared/hooks/useDraft';
import {useWriteAction} from '../../../shared/hooks/useWriteAction';
import {addressService,blankAddress,validateAddress,type AddressInput} from '../addressService';
export default function AddressesScreen(){return <ApiFeature><RequireRole roles={['CUSTOMER']}><Content/></RequireRole></ApiFeature>;}
function Content(){
 const {request}=useApp(),service=addressService(request),data=useResource(()=>service.list(),true,false,'addresses');
 const [editing,setEditing]=useState<Address|'new'|null>(null),[deleting,setDeleting]=useState<Address|null>(null),[message,setMessage]=useState<string|null>(null);
 const write=useWriteAction(),refresh=async()=>{if(await data.reload())write.reconciled();};
 return <><M01Screen title="Địa chỉ giao hàng" back subtitle={data.data?`${data.data.length}/10 địa chỉ · Điểm nhận minh họa`:undefined} onRefresh={()=>{void refresh();}} footer={<Button title="Thêm địa chỉ mới" disabled={!data.data||data.data.length>=10||write.busy||write.uncertain} onPress={()=>{setEditing('new');setDeleting(null);}}/>}>
  <LoadState loading={data.loading} error={data.error} retry={()=>{void refresh();}}/>{message&&<Banner>{message}</Banner>}{write.error&&<Banner error>{write.error}</Banner>}{write.uncertain&&<Button title="Đọc lại danh sách địa chỉ" onPress={()=>{void refresh();}}/>}
  {data.data?.length===0&&<Empty title="Chưa có địa chỉ" detail="Thêm nơi nhận món để đặt hàng nhanh hơn."/>}
  {data.data?.map(a=><View key={a.id} style={m.card}><View style={m.row}><View style={m.icon}><Icon name="pin"/></View><Text style={m.heading}>{a.label||'Địa chỉ'}</Text></View><Text style={m.text}>{a.recipientName} · {a.recipientPhone}</Text><Text style={m.meta}>{a.addressText}</Text><Text style={m.meta}>Điểm nhận {a.mapPointCode==='CUSTOMER_B'?'2':'1'} · Khu vực mẫu A</Text><View style={m.divider}/><View style={m.row}><TinyAction title="Sửa địa chỉ" disabled={write.busy||write.uncertain} onPress={()=>setEditing(a)}/><TinyAction title="Xóa địa chỉ" danger disabled={write.busy||write.uncertain} onPress={()=>setDeleting(a)}/></View></View>)}
  <Text style={m.meta}>Điểm ghim dùng dữ liệu minh họa, không sử dụng GPS.</Text>
 </M01Screen><GuiModal title={editing==='new'?'Thêm địa chỉ mới':'Chỉnh sửa địa chỉ'} visible={!!editing} onClose={()=>setEditing(null)}>{editing&&<Editor key={editing==='new'?'new':editing.id} initial={editing==='new'?blankAddress:editing} id={editing==='new'?undefined:editing.id} onClose={()=>setEditing(null)} saved={warning=>{setMessage(warning??'Đã lưu địa chỉ.');setEditing(null);void refresh();}}/>}</GuiModal>
 <GuiModal title="Xóa địa chỉ" visible={!!deleting} onClose={()=>{if(!write.busy)setDeleting(null);}}>{deleting&&<><Text style={m.text}>Xóa địa chỉ {deleting.label}? Địa chỉ trên đơn đã tạo vẫn được giữ.</Text><Button title="Xác nhận xóa" busy={write.busy} disabled={write.uncertain} onPress={()=>{void write.run(()=>service.remove(deleting.id),()=>{setDeleting(null);void refresh();});}}/><Button title="Giữ địa chỉ" variant="secondary" onPress={()=>setDeleting(null)}/>{write.error&&<Banner error>{write.error}</Banner>}</>}</GuiModal></>;
}
function Editor({ initial, id, onClose, saved }: { initial: AddressInput; id?: string; onClose: () => void; saved: (warning?:string) => void }) {
  const { request } = useApp(), draft = useDraft("address", id ?? "new", initial), write = useWriteAction();
  const [validation, setValidation] = useState<string | null>(null);
  const value = draft.value;
  return <View style={{gap:16}}><Label muted>Nhập thông tin người nhận và khu vực giao hàng mẫu.</Label>
    {([ ["recipientName", "Người nhận"], ["recipientPhone", "Số điện thoại"], ["addressText", "Địa chỉ"], ["label", "Nhãn"] ] as const).map(([key,label]) => <Field key={key} label={label} value={value[key]} editable={draft.ready && !write.busy} keyboardType={key === "recipientPhone" ? "phone-pad" : "default"} onChangeText={text => { void draft.update({ ...value, [key]: text }).catch(() => {}); }} />)}
    <Label>Điểm nhận trong khu vực mẫu</Label>{["CUSTOMER_A", "CUSTOMER_B"].map((point,index) => <Chip key={point} title={`Điểm nhận ${index + 1}`} disabled={!draft.ready || write.busy} selected={value.mapPointCode === point} onPress={() => { if (!draft.ready || write.busy) return; void draft.update({ ...value, areaCode: "AREA_A", mapPointCode: point }).catch(() => {}); }} />)}
    {draft.error && <Banner error>{draft.error}</Banner>}{!draft.ready && draft.error && <Button title="Tải lại bản nháp" variant="secondary" onPress={() => { void draft.reload(); }} />}{draft.saved && <Label muted>Đã lưu nháp riêng cho tài khoản.</Label>}
    {(validation || write.error) && <Banner error>{validation ?? write.error}</Banner>}
    {write.uncertain && <Button title="Đọc lại địa chỉ trước khi tiếp tục" onPress={() => { void write.run(async () => { await addressService(request).list(); }, write.reconciled); }} />}
    <Button title="Lưu địa chỉ" busy={write.busy} disabled={!draft.ready || write.uncertain} onPress={() => { const error = validateAddress(value); setValidation(error); if (!error) {let warning:string|undefined;void write.run(async () => {await addressService(request).save({ ...value, recipientName:value.recipientName.trim(),addressText:value.addressText.trim(),label:value.label.trim() },id);if(!id)try{await draft.update(blankAddress);}catch{warning="Địa chỉ đã lưu; chưa dọn được bản nháp. Kiểm tra danh sách trước khi tạo địa chỉ mới.";}},()=>saved(warning));} }} />
    <Button title="Đóng biểu mẫu" variant="ghost" onPress={onClose} />
  </View>;
}
