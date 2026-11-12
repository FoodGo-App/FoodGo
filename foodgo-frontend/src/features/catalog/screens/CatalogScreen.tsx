import {ApiFeature} from "../../../shared/components/ApiFeature";
import React,{useState} from "react";
import {FlatList,ScrollView,View} from "react-native";
import {router,useLocalSearchParams,type Href} from "expo-router";
import {captureReturnTo,loginHref} from "../../account/loginReturn";
import {useApp} from "../../../providers/AppProvider";
import {useResource} from "../../../shared/hooks/useResource";
import {Button,Card,Chip,Empty,Field,Heading,Label,LoadState,Screen} from "../../../shared/components/ui";
import {money} from "../../../shared/theme/theme";
import {catalogService,type Food,type Restaurant} from "../catalogService";
export default function CatalogScreen(){const params=useLocalSearchParams();return <ApiFeature><Content key={JSON.stringify(params)} /></ApiFeature>;}
function Content(){
 const {request,session}=useApp(),service=catalogService(request),params=useLocalSearchParams<{q?:string;categoryId?:string;restaurantId?:string;type?:string;sort?:string;fav?:string}>();
 const [text,setText]=useState(typeof params.q==="string"?params.q:""),[q,setQ]=useState(text),[type,setType]=useState(params.type==="RESTAURANT"?"RESTAURANT":"FOOD"),[category,setCategory]=useState(typeof params.categoryId==="string"?params.categoryId:""),[sort,setSort]=useState(["price","distance","rating"].includes(params.sort??"")?params.sort!:"rating"),[page,setPage]=useState(0),[onlyFavorites,setOnlyFavorites]=useState(params.fav==="1");
 const query={q,categoryId:category,restaurantId:typeof params.restaurantId==="string"?params.restaurantId:undefined,areaCode:"AREA_A",sort,page,size:20};
 const categories=useResource(()=>service.categories(),true,false,"catalog-categories");
 const returnContext=captureReturnTo("/catalog",{q,categoryId:category,restaurantId:query.restaurantId,type,sort,fav:"1"});
 const result=useResource(async()=>{if(onlyFavorites){const p=await service.favorites(type as "FOOD"|"RESTAURANT",q,sort,page);return {...p,content:p.content.map(f=>f.summary)};}return type==="FOOD"?service.foods(query):service.restaurants(query);},!onlyFavorites||session?.user.role==="CUSTOMER",false,JSON.stringify({type,onlyFavorites,...query}));
 const refresh=()=>{void (async()=>{if(onlyFavorites){await result.reload();return;}if(type==="FOOD")await service.foods(query,true);else await service.restaurants(query,true);await result.reload();})().catch(()=>{void result.reload();});};
 return <Screen title="Khám phá quán và món" back scroll={false}>
  <Field label="Tìm tên quán hoặc món" value={text} onChangeText={setText} onSubmitEditing={()=>{setQ(text.trim());setPage(0);}} /><Button title="Tìm kiếm" onPress={()=>{setQ(text.trim());setPage(0);}} />
  <ScrollView horizontal style={{maxHeight:60,flexGrow:0}} contentContainerStyle={{flexDirection:"row",gap:8,alignItems:"center"}}>{["FOOD","RESTAURANT"].map(t=><Chip key={t} title={t==="FOOD"?"Món":"Quán"} selected={type===t} onPress={()=>{setType(t);setPage(0);}} />)}<Chip title="Tất cả danh mục" selected={!category} onPress={()=>{setOnlyFavorites(false);setCategory("");setPage(0);}} />{categories.data?.map(c=><Chip key={c.id} title={c.name} selected={category===c.id} onPress={()=>{setOnlyFavorites(false);setCategory(c.id);setPage(0);}} />)}</ScrollView>
  <View style={{flexDirection:"row",gap:8,flexWrap:"wrap"}}>{[["rating","Điểm mẫu"],["distance","Gần điểm mẫu"],["price","Giá tăng dần"]].map(([id,label])=><Chip key={id} title={label} selected={sort===id} onPress={()=>{setSort(id);setPage(0);}} />)}</View>
  <Label muted>Điểm đánh giá, khoảng cách và ETA là dữ liệu mẫu. Giá/khả dụng được kiểm tra lại khi ghi giỏ.</Label>
  <Chip title="Chỉ yêu thích" selected={onlyFavorites} onPress={()=>{if(!session){router.push(loginHref(returnContext));return;}if(session.user.role!=="CUSTOMER"){router.replace("/");return;}setOnlyFavorites(v=>!v);setCategory("");setPage(0);}} />
  {onlyFavorites&&!session&&<Button title="Đăng nhập để lọc yêu thích" onPress={()=>router.push(loginHref(returnContext))} />}
  <Button title="Yêu thích của tôi" variant="ghost" onPress={()=>router.push("/(customer)/(tabs)/favorites")} />
  <LoadState loading={result.loading} error={result.error} retry={refresh} />
  <FlatList<Food|Restaurant> data={result.data?.content??[]} keyExtractor={item=>item.id} refreshing={result.loading} onRefresh={refresh} contentContainerStyle={{gap:12,paddingBottom:20}} ListEmptyComponent={!result.loading&&!result.error?<Empty title="Không có kết quả" detail="Đổi từ khóa hoặc danh mục rồi thử lại." />:undefined} renderItem={({item})=><Card><Heading>{item.name}</Heading>{"basePrice" in item?<Label>{money(item.basePrice)} · {item.kind==="COMBO"?"Combo":"Món lẻ"}</Label>:<Label>{item.sampleRating}★ · {item.sampleDistanceM}m · {item.sampleEtaMinutes} phút (mẫu)</Label>}<Button title="Xem chi tiết" onPress={()=>router.push(("basePrice" in item?`/food/${item.id}`:`/restaurants/${item.id}`) as Href)} /></Card>} />
  <View style={{flexDirection:"row",gap:10}}><Button title="Trang trước" disabled={page===0} onPress={()=>setPage(n=>n-1)} /><Label>Trang {page+1}</Label><Button title="Trang sau" disabled={!result.data?.hasNext} onPress={()=>setPage(n=>n+1)} /></View>
 </Screen>;
}
