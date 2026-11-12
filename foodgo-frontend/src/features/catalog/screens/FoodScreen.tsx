import React,{useState} from 'react';
import {Text,View,useWindowDimensions} from 'react-native';
import {router,useLocalSearchParams,type Href} from 'expo-router';
import {ApiFeature} from '../../../shared/components/ApiFeature';
import {FoodThumbnail} from '../../../shared/components/FoodThumbnail';
import {GuiModal,IconButton} from '../../../shared/components/Gui';
import {Banner,Button,LoadState} from '../../../shared/components/ui';
import {useApp} from '../../../providers/AppProvider';
import {useResource} from '../../../shared/hooks/useResource';
import {useWriteAction} from '../../../shared/hooks/useWriteAction';
import {captureReturnTo,loginHref} from '../../account/loginReturn';
import {FoodPurchase} from '../../cart/FoodPurchase';
import {M01Screen,TinyAction,m} from '../components/M01Layout';
import {DemoFoodScreen} from '../components/DemoCatalogPreview';
import {catalogService} from '../catalogService';
import {money} from '../../../shared/theme/theme';
export default function FoodScreen(){const {mode}=useApp();return mode==='demo'?<DemoFoodScreen/>:<ApiFeature><Content/></ApiFeature>;}
function Content(){
 const params=useLocalSearchParams<{id:string;options?:string;quantity?:string;note?:string}>(),{id}=params,{width}=useWindowDimensions(),{request,session}=useApp(),service=catalogService(request),write=useWriteAction();
 const data=useResource(()=>service.food(id),true,false,`food:${id}`),[selectedContext,setSelectedContext]=useState<{id:string;path:string|null}|null>(null),[favoriteOpen,setFavoriteOpen]=useState(false);
 const favorite=(saved:boolean)=>{if(!session){router.push(loginHref(selectedContext?.id===id?selectedContext.path:captureReturnTo(`/food/${id}`,params)));return;}if(session.user.role!=='CUSTOMER'){router.replace('/');return;}void write.run(()=>service.favorite('FOOD',id,saved),()=>setFavoriteOpen(false));};
 const modal=<GuiModal title="Yêu thích món" visible={favoriteOpen} onClose={()=>setFavoriteOpen(false)}><Button title="Lưu món yêu thích" busy={write.busy} disabled={write.uncertain} onPress={()=>favorite(true)}/><Button title="Bỏ yêu thích món" variant="secondary" busy={write.busy} disabled={write.uncertain} onPress={()=>favorite(false)}/>{write.error&&<Banner error>{write.error}</Banner>}{write.uncertain&&<Button title="Đọc lại yêu thích món" onPress={()=>{void service.favorites('FOOD').then(write.reconciled).catch(()=>{});}}/>}</GuiModal>;
 if(!data.data)return <M01Screen title="Chi tiết món" back><LoadState loading={data.loading} error={data.error} retry={()=>{void data.reload();}}/></M01Screen>;
 const food=data.data;
 return <><FoodPurchase key={`${id}:${JSON.stringify(params)}`} food={food} initial={{optionValueIds:typeof params.options==='string'?params.options.split(',').filter(Boolean):[],quantity:Number(params.quantity??1),note:typeof params.note==='string'?params.note:''}} onContextChange={path=>setSelectedContext({id,path})} render={(body,actions)=><M01Screen title="Chi tiết món" back right={<IconButton name="heart" label="Tùy chọn yêu thích món" variant="plain" onPress={()=>setFavoriteOpen(true)}/>} footer={actions}>
  <FoodThumbnail name={food.name} imageCode={food.imageCode} width={Math.max(240,width-32)} height={210} radius={18}/><Text style={{...m.title,fontSize:23}}>{food.name}</Text><View style={m.between}><Text style={m.price}>{money(food.basePrice)}</Text><TinyAction title="Xem nhà hàng" onPress={()=>router.push(`/restaurants/${food.restaurantId}` as Href)}/></View><Text style={m.text}>{food.description}</Text>{(!food.available||food.restaurantAvailable===false)&&<Banner>Món hoặc quán đang tạm ngừng phục vụ.</Banner>}{data.error&&<Banner error>{data.error}</Banner>}{body}<Text style={m.meta}>Ảnh minh họa. Giá được kiểm tra lại khi thêm vào giỏ.</Text>
 </M01Screen>}/>{modal}</>;
}
