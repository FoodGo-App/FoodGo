import React,{useEffect,useState} from 'react';
import {FlatList,ScrollView,Text,View} from 'react-native';
import {router,useLocalSearchParams,type Href} from 'expo-router';
import {ApiFeature} from '../../../shared/components/ApiFeature';
import {useApp} from '../../../providers/AppProvider';
import {useResource} from '../../../shared/hooks/useResource';
import {Button,Chip,Empty,LoadState} from '../../../shared/components/ui';
import {GuiModal,IconButton} from '../../../shared/components/Gui';
import {M01Screen,SearchBar,m,TinyAction} from '../components/M01Layout';
import {captureReturnTo,loginHref} from '../../account/loginReturn';
import {catalogService,type Food,type Restaurant} from '../catalogService';
import {FoodCard,RestaurantCard} from '../components/FoodCards';
import {DemoCatalogScreen} from '../components/DemoCatalogPreview';
export default function CatalogScreen(){const {mode}=useApp();const params=useLocalSearchParams();return mode==='demo'?<DemoCatalogScreen key={JSON.stringify(params)}/>:<ApiFeature><Content key={JSON.stringify(params)}/></ApiFeature>;}
function Content(){
 const {request,session}=useApp(),service=catalogService(request),params=useLocalSearchParams<{q?:string;categoryId?:string;restaurantId?:string;type?:string;sort?:string;fav?:string}>();
 const [text,setText]=useState(typeof params.q==='string'?params.q:''),[q,setQ]=useState(text),[type,setType]=useState(params.type==='RESTAURANT'?'RESTAURANT':'FOOD'),[category,setCategory]=useState(typeof params.categoryId==='string'?params.categoryId:''),[sort,setSort]=useState(['price','distance','rating'].includes(params.sort??'')?params.sort!:'rating'),[page,setPage]=useState(0),[onlyFavorites,setOnlyFavorites]=useState(params.fav==='1'),[filters,setFilters]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>{setQ(text.trim());setPage(0);},280);return()=>clearTimeout(timer);},[text]);
 const query={q,categoryId:category,restaurantId:typeof params.restaurantId==='string'?params.restaurantId:undefined,areaCode:'AREA_A',sort,page,size:20};
 const categories=useResource(()=>service.categories(),true,false,'catalog-categories');
 const restaurantNames=useResource(()=>service.restaurants({areaCode:'AREA_A',page:0,size:50}),type==='FOOD',false,'catalog-public-restaurant-names');
 const returnContext=captureReturnTo('/catalog',{q,categoryId:category,restaurantId:query.restaurantId,type,sort,fav:'1'});
 const result=useResource(async()=>{if(onlyFavorites){const p=await service.favorites(type as 'FOOD'|'RESTAURANT',q,sort,page);return {...p,content:p.content.map(f=>f.summary)};}return type==='FOOD'?service.foods(query):service.restaurants(query);},!onlyFavorites||session?.user.role==='CUSTOMER',false,JSON.stringify({type,onlyFavorites,...query}));
 const refresh=()=>{void(async()=>{if(onlyFavorites){await result.reload();return;}if(type==='FOOD')await service.foods(query,true);else await service.restaurants(query,true);await result.reload();})().catch(()=>{void result.reload();});};
 return <><M01Screen title={q?'Kết quả tìm kiếm':'Khám phá món ăn'} back scroll={false} right={<IconButton name="heart" label="Yêu thích của tôi" variant="plain" onPress={()=>router.push('/(customer)/(tabs)/favorites')}/> }>
  <View style={{paddingHorizontal:16,paddingTop:4,gap:8}}>
   <SearchBar value={text} onChangeText={setText} onSubmitEditing={()=>{setQ(text.trim());setPage(0);}}/>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0,height:46}} contentContainerStyle={{gap:7,alignItems:'center'}}><Chip title="Tất cả" selected={!category} onPress={()=>{setCategory('');setPage(0);}}/>{categories.data?.map(c=><Chip key={c.id} title={c.name} selected={category===c.id} onPress={()=>{setCategory(c.id);setPage(0);}}/>)}</ScrollView>
   <View style={m.between}><View style={m.row}>{['FOOD','RESTAURANT'].map(t=><TinyAction key={t} title={`${type===t?'● ':''}${t==='FOOD'?'Món ăn':'Nhà hàng'}`} onPress={()=>{setType(t);setPage(0);}}/>)}</View><TinyAction title={`Bộ lọc${onlyFavorites?' · ♥':''}${sort==='price'?' · Giá':''}`} onPress={()=>setFilters(true)}/></View>
  </View>
  <FlatList<Food|Restaurant> style={{flex:1}} data={result.data?.content??[]} keyExtractor={item=>item.id} keyboardShouldPersistTaps="handled" refreshing={result.loading} onRefresh={refresh} contentContainerStyle={{padding:16,paddingTop:4,gap:10,paddingBottom:24}} ListHeaderComponent={<>{onlyFavorites&&!session&&<Button title="Đăng nhập để xem yêu thích" onPress={()=>router.push(loginHref(returnContext))}/>} {result.error&&<LoadState loading={false} error={result.error} retry={refresh}/>}<Text style={m.meta}>{onlyFavorites?'Đang lọc món đã lưu · ':''}{q?`Kết quả cho “${q}”`:'Gợi ý trong khu vực mẫu'}</Text></>} ListEmptyComponent={!result.loading&&!result.error?<Empty title="Chưa tìm thấy món phù hợp" detail="Thử từ khóa hoặc danh mục khác nhé."/>:undefined} renderItem={({item})=>'basePrice' in item?<FoodCard food={item} restaurantName={restaurantNames.data?.content.find(r=>r.id===item.restaurantId)?.name} onPress={()=>router.push(`/food/${item.id}` as Href)}/>:<RestaurantCard restaurant={item} onPress={()=>router.push(`/restaurants/${item.id}` as Href)}/>} ListFooterComponent={page>0||result.data?.hasNext?<View style={m.between}><TinyAction title="Trang trước" disabled={page===0} onPress={()=>setPage(n=>n-1)}/><Text style={m.meta}>Trang {page+1}</Text><TinyAction title="Trang sau" disabled={!result.data?.hasNext} onPress={()=>setPage(n=>n+1)}/></View>:undefined}/>
 </M01Screen><GuiModal title="Lọc và sắp xếp" visible={filters} onClose={()=>setFilters(false)} footer={<Button title="Xem kết quả" onPress={()=>setFilters(false)}/>}>
  <Text style={m.heading}>Sắp xếp theo</Text>{[['rating','Điểm đánh giá mẫu'],['distance','Gần điểm mẫu'],['price','Giá tăng dần']].map(([id,label])=><Chip key={id} title={label} selected={sort===id} onPress={()=>{setSort(id);setPage(0);}}/>)}
  <Chip title="Chỉ món và quán yêu thích" selected={onlyFavorites} onPress={()=>{if(!session){setFilters(false);router.push(loginHref(returnContext));return;}if(session.user.role!=='CUSTOMER'){router.replace('/');return;}setOnlyFavorites(v=>!v);setCategory('');setPage(0);}}/>
  <Text style={m.meta}>Điểm đánh giá, khoảng cách và thời gian giao là thông tin minh họa.</Text>
 </GuiModal></>;
}
