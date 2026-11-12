import {MotionPressable} from '../../../shared/components/Motion';
import {IconButton} from '../../../shared/components/Gui';
import React,{useEffect,useState} from 'react';
import {FlatList,Text,View} from 'react-native';
import {router,type Href} from 'expo-router';
import {ApiFeature} from '../../../shared/components/ApiFeature';
import {useApp} from '../../../providers/AppProvider';
import {useResource} from '../../../shared/hooks/useResource';
import {useWriteAction} from '../../../shared/hooks/useWriteAction';
import {Banner,Button,Chip,Empty,LoadState,RequireRole} from '../../../shared/components/ui';
import {M01Screen,SearchBar,TinyAction,m} from '../components/M01Layout';
import {FoodThumbnail} from '../../../shared/components/FoodThumbnail';
import {catalogService} from '../catalogService';
import {money} from '../../../shared/theme/theme';
export default function FavoritesScreen(){return <ApiFeature><RequireRole roles={['CUSTOMER']}><Content/></RequireRole></ApiFeature>;}
function Content(){
 const {request}=useApp(),service=catalogService(request),write=useWriteAction();
 const [type,setType]=useState<'FOOD'|'RESTAURANT'>('FOOD'),[text,setText]=useState(''),[q,setQ]=useState(''),[page,setPage]=useState(0),[sort,setSort]=useState('rating');
 useEffect(()=>{const timer=setTimeout(()=>{setQ(text.trim());setPage(0);},280);return()=>clearTimeout(timer);},[text]);
 const data=useResource(()=>service.favorites(type,q,sort,page),true,false,`favorites:${type}:${q}:${sort}:${page}`);
 const refresh=async()=>{if(await data.reload())write.reconciled();};
 return <M01Screen title="Yêu thích của tôi" scroll={false}>
  <View style={{paddingHorizontal:16,gap:10,paddingBottom:10}}><View style={m.between}><View style={m.row}>{(['FOOD','RESTAURANT'] as const).map(t=><Chip key={t} title={t==='FOOD'?'Món ăn':'Nhà hàng'} selected={type===t} onPress={()=>{setType(t);setPage(0);}}/>)}</View><TinyAction title={sort==='price'?'Theo giá':'Điểm mẫu'} onPress={()=>{setSort(s=>s==='price'?'rating':'price');setPage(0);}}/></View><SearchBar label="Tìm trong yêu thích" placeholder="Tìm trong yêu thích…" value={text} onChangeText={setText}/></View>
  <FlatList style={{flex:1}} data={data.data?.content??[]} keyExtractor={f=>`${f.type}:${f.targetId}`} keyboardShouldPersistTaps="handled" refreshing={data.loading} onRefresh={()=>{void refresh();}} contentContainerStyle={{padding:16,paddingTop:0,gap:10,paddingBottom:24}} ListHeaderComponent={<><LoadState loading={data.loading} error={data.error} retry={()=>{void refresh();}}/>{write.error&&<Banner error>{write.error}</Banner>}{write.uncertain&&<Button title="Đọc lại yêu thích" onPress={()=>{void refresh();}}/>}</>} ListEmptyComponent={!data.loading&&!data.error?<Empty title="Chưa có yêu thích phù hợp" detail="Lưu món hoặc quán bạn thích để dễ tìm lại nhé."/>:undefined} renderItem={({item})=><View style={{...m.card,padding:10,flexDirection:'row',alignItems:'center'}}><MotionPressable accessibilityRole="button" accessibilityLabel={`Xem chi tiết ${item.summary.name}`} onPress={()=>router.push((item.type==='FOOD'?`/food/${item.targetId}`:`/restaurants/${item.targetId}`) as Href)} style={{...m.row,flex:1}}><FoodThumbnail name={item.summary.name} imageCode={item.summary.imageCode} size={78}/><View style={{flex:1,gap:4}}><Text style={m.heading}>{item.summary.name}</Text><Text style={m.price}>{'basePrice' in item.summary?money(item.summary.basePrice):`${item.summary.sampleRating} ★ · ${item.summary.sampleEtaMinutes} phút`}</Text>{(!item.summary.available||('restaurantAvailable' in item.summary&&item.summary.restaurantAvailable===false))&&<Text style={m.meta}>Tạm ngừng phục vụ</Text>}</View></MotionPressable><IconButton name="heart" label={`Bỏ yêu thích ${item.summary.name}`} variant="plain" disabled={write.busy||write.uncertain} onPress={()=>{void write.run(()=>service.favorite(item.type,item.targetId,false),()=>{void refresh();});}}/></View>} ListFooterComponent={page>0||data.data?.hasNext?<View style={m.between}><TinyAction title="Trang trước" disabled={page===0} onPress={()=>setPage(n=>n-1)}/><TinyAction title="Trang sau" disabled={!data.data?.hasNext} onPress={()=>setPage(n=>n+1)}/></View>:undefined}/>
 </M01Screen>;
}
