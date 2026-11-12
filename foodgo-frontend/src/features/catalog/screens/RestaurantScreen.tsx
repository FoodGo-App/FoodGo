import React,{useState} from 'react';
import {Text,View,useWindowDimensions} from 'react-native';
import {router,useLocalSearchParams,type Href} from 'expo-router';
import {ApiFeature} from '../../../shared/components/ApiFeature';
import {useApp} from '../../../providers/AppProvider';
import {useResource} from '../../../shared/hooks/useResource';
import {useWriteAction} from '../../../shared/hooks/useWriteAction';
import {Banner,Button,LoadState} from '../../../shared/components/ui';
import {FoodThumbnail} from '../../../shared/components/FoodThumbnail';
import {GuiModal,IconButton} from '../../../shared/components/Gui';
import {loginHref} from '../../account/loginReturn';
import {catalogService} from '../catalogService';
import {FoodCard} from '../components/FoodCards';
import {DemoRestaurantScreen} from '../components/DemoCatalogPreview';
import {M01Screen,TinyAction,m} from '../components/M01Layout';
export default function RestaurantScreen(){const {mode}=useApp();return mode==='demo'?<DemoRestaurantScreen/>:<ApiFeature><Content/></ApiFeature>;}
function Content(){
 const {id}=useLocalSearchParams<{id:string}>(),{width}=useWindowDimensions(),{request,session}=useApp(),service=catalogService(request),write=useWriteAction();
 const [tab,setTab]=useState('menu'),[favoriteOpen,setFavoriteOpen]=useState(false);
 const data=useResource(()=>service.restaurant(id),true,false,`restaurant:${id}`),menu=useResource(()=>service.foods({restaurantId:id,page:0,size:20}),true,false,`restaurant-menu:${id}`);
 const refresh=()=>{void service.restaurant(id,true).then(()=>data.reload()).catch(()=>{void data.reload();});void service.foods({restaurantId:id,page:0,size:20},true).then(()=>menu.reload()).catch(()=>{void menu.reload();});};
 const save=(saved:boolean)=>{if(!session){setFavoriteOpen(false);router.push(loginHref(`/restaurants/${id}`));return;}if(session.user.role!=='CUSTOMER'){router.replace('/');return;}void write.run(()=>service.favorite('RESTAURANT',id,saved),()=>setFavoriteOpen(false));};
 return <><M01Screen title="Nhà hàng" back right={<IconButton name="heart" label="Tùy chọn yêu thích quán" variant="plain" onPress={()=>setFavoriteOpen(true)}/>} onRefresh={refresh}>
  <LoadState loading={data.loading} error={data.error} retry={refresh}/>{data.data&&<>
   <FoodThumbnail name={data.data.name} imageCode={data.data.imageCode} width={Math.max(240,width-32)} height={190} radius={18}/><Text style={{...m.title,fontSize:24}}>{data.data.name}</Text><Text style={m.meta}>{data.data.sampleRating} ★ · {(data.data.sampleDistanceM/1000).toLocaleString('vi-VN')} km · {data.data.sampleEtaMinutes} phút · Thông tin mẫu</Text>{!data.data.available&&<Banner>Quán đang tạm ngừng phục vụ.</Banner>}
   <View style={{...m.between,borderBottomWidth:0.5,borderColor:'#D7E2DC'}}>{[['menu','Thực đơn'],['info','Thông tin'],['reviews','Đánh giá mẫu']].map(([id,label])=><TinyAction key={id} title={`${tab===id?'● ':''}${label}`} onPress={()=>setTab(id)}/>)}</View>
   {tab==='menu'?<><View style={m.between}><Text style={m.heading}>Món của quán</Text>{menu.data?.hasNext&&<TinyAction title="Xem tất cả" onPress={()=>router.push(`/catalog?restaurantId=${id}` as Href)}/>}</View><LoadState loading={menu.loading} error={menu.error} retry={()=>{void menu.reload();}}/>{menu.data?.content.map(food=><FoodCard key={food.id} food={food} onPress={()=>router.push(`/food/${food.id}` as Href)}/>)}{!menu.loading&&!menu.error&&!menu.data?.content.length&&<Text style={m.meta}>Quán chưa có món đang phục vụ.</Text>}</>:tab==='info'?<><Text style={m.heading}>Địa chỉ quán</Text><Text style={m.text}>{data.data.addressText}</Text><Text style={m.meta}>Ảnh quán là ảnh món minh họa, không phải ảnh địa điểm thực tế.</Text></>:<>{data.data.sampleReviews?.map((review,index)=><View key={index} style={m.card}><Text style={m.heading}>{review.name??'Khách hàng mẫu'}</Text><Text style={m.text}>{review.text??''}</Text><Text style={m.meta}>Đánh giá minh họa</Text></View>)}{!data.data.sampleReviews?.length&&<Text style={m.meta}>Chưa có nhận xét mẫu cho quán này.</Text>}</>}
  </>}
 </M01Screen><GuiModal title="Yêu thích nhà hàng" visible={favoriteOpen} onClose={()=>setFavoriteOpen(false)}><Button title="Lưu quán yêu thích" busy={write.busy} disabled={write.uncertain} onPress={()=>save(true)}/><Button title="Bỏ yêu thích quán" variant="secondary" busy={write.busy} disabled={write.uncertain} onPress={()=>save(false)}/>{write.error&&<Banner error>{write.error}</Banner>}{write.uncertain&&<Button title="Kiểm tra lại yêu thích" onPress={()=>{void service.favorites('RESTAURANT').then(write.reconciled).catch(()=>{});}}/>}</GuiModal></>;
}
