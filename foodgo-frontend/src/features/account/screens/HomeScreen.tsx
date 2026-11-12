import React,{useState} from 'react';
import {ScrollView,Text,View} from 'react-native';
import {router,useLocalSearchParams,type Href} from 'expo-router';
import {useApp} from '../../../providers/AppProvider';
import {useResource} from '../../../shared/hooks/useResource';
import {Banner,Button,Panda} from '../../../shared/components/ui';
import {Brand} from '../../../shared/components/Brand';
import {Icon} from '../../../shared/components/Gui';
import {MotionPressable} from '../../../shared/components/Motion';
import {FoodThumbnail} from '../../../shared/components/FoodThumbnail';
import {colors,explain} from '../../../shared/theme/theme';
import {catalogService} from '../../catalog/catalogService';
import {FoodCard,RestaurantCard} from '../../catalog/components/FoodCards';
import {DemoDiscoveryHome} from '../../catalog/components/DemoCatalogPreview';
import {M01Screen,SearchBar,TinyAction,CartShortcut,m} from '../../catalog/components/M01Layout';
import {loginHref,PUBLIC_HOME} from '../loginReturn';
export default function HomeScreen(){
 const {mode,session,request}=useApp(),{selection}=useLocalSearchParams<{selection?:string}>();
 const [search,setSearch]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const discover=()=>router.push((search.trim()?`/catalog?q=${encodeURIComponent(search.trim())}`:'/catalog') as Href);
 return <M01Screen title="Trang chủ" header={<View style={{...m.between,paddingHorizontal:16,paddingVertical:8}}><Brand compact/><CartShortcut onPress={()=>router.push('/cart' as Href)}/></View>}>
  <View style={{...m.row,gap:5}}><Icon name="pin" size={15}/><Text style={m.meta}>Giao đến: Khu vực mẫu A</Text></View>
  <SearchBar value={search} onChangeText={setSearch} onSubmitEditing={discover}/>
  <View style={{...m.row,backgroundColor:colors.mint,borderRadius:20,padding:16,overflow:'hidden'}}><View style={{flex:1,gap:7}}><Text style={{fontSize:21,lineHeight:27,fontWeight:'700',color:colors.ink}}>Bữa ngon,{"\n"}giá thêm vui!</Text><TinyAction title="Khám phá món ngon" onPress={discover}/></View><Panda size={95} pose="hello"/></View>
  {mode==='api'?<CatalogHome/>:<DemoDiscoveryHome/>}
  {error&&<Banner error>{error}</Banner>}
  {mode==='demo'&&<View style={m.card}><Text style={m.heading}>Thử đặt một bữa từ Bếp Nhà</Text><Text style={m.meta}>{selection==='demo-meal'?'Kiểm tra lại bữa đã chọn rồi xác nhận giỏ mẫu nhé.':'Giỏ mẫu giúp bạn thử đặt món và theo dõi giao hàng.'}</Text><Button title="Chuẩn bị giỏ mẫu" busy={busy} onPress={()=>{if(session?.user.role!=='CUSTOMER'){router.push(loginHref(`${PUBLIC_HOME}?selection=demo-meal`));return;}setBusy(true);void request('/demo/cart','POST',{}).then(()=>router.push('/checkout/review')).catch(e=>setError(explain(e))).finally(()=>setBusy(false));}}/></View>}
 </M01Screen>;
}
function CatalogHome(){
 const {request}=useApp(),service=catalogService(request);
 const data=useResource(()=>service.home(),true,false,'catalog-home');
 const restaurants=useResource(()=>service.restaurants({areaCode:'AREA_A',page:0,size:6}),true,false,'catalog-restaurant-preview');
 return <View style={{gap:18}}>
  {data.error&&<><Banner error>{data.error}</Banner><TinyAction title="Tải lại gợi ý" onPress={()=>{void service.home(true).then(()=>data.reload()).catch(()=>{});}}/></>}
  <Text style={m.heading}>Bạn muốn ăn gì?</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:17}}>{data.data?.categories.map(c=><MotionPressable key={c.id} accessibilityRole="button" accessibilityLabel={`Danh mục ${c.name}`} onPress={()=>router.push(`/catalog?categoryId=${c.id}` as Href)} style={{width:64,alignItems:'center',gap:7}}><FoodThumbnail name={c.name} imageCode={/cơm/i.test(c.name)?'CHICKEN_RICE':/uống|sữa/i.test(c.name)?'MILK_TEA':/bánh/i.test(c.name)?'BANH_MI':/bún|phở|mì|hủ tiếu/i.test(c.name)?'PHO_BO':/chay/i.test(c.name)?'MUSHROOM_RICE':undefined} size={60} radius={30}/><Text numberOfLines={2} style={{...m.meta,textAlign:'center',color:colors.ink}}>{c.name}</Text></MotionPressable>)}</ScrollView>
  <View style={m.between}><Text style={m.heading}>Món nổi bật</Text><TinyAction title="Xem tất cả" onPress={()=>router.push('/catalog')}/></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12}}>{data.data?.suggestedFoods.slice(0,6).map(food=><FoodCard key={food.id} food={food} restaurantName={restaurants.data?.content.find(r=>r.id===food.restaurantId)?.name} horizontal onPress={()=>router.push(`/food/${food.id}` as Href)}/>)}</ScrollView>
  {!data.loading&&!data.error&&!data.data?.suggestedFoods.length&&<Text style={m.meta}>Chưa có món gợi ý. Thử khám phá các quán nhé.</Text>}
  <View style={m.between}><Text style={m.heading}>Quán gợi ý</Text><TinyAction title="Khám phá" onPress={()=>router.push('/catalog?type=RESTAURANT' as Href)}/></View>
  {restaurants.error&&<Banner error>{restaurants.error}</Banner>}
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:12}}>{restaurants.data?.content.map(r=><RestaurantCard key={r.id} restaurant={r} horizontal onPress={()=>router.push(`/restaurants/${r.id}` as Href)}/>)}</ScrollView>
  {!!data.data?.offers.length&&<View style={m.card}><View style={m.row}><Icon name="ticket"/><Text style={m.heading}>Ưu đãi hôm nay</Text></View><Text style={m.text}>{data.data.offers[0].code} · {data.data.offers[0].name}</Text><Text style={m.meta}>Chọn mã và kiểm tra điều kiện ở bước đặt món.</Text></View>}
 </View>;
}
