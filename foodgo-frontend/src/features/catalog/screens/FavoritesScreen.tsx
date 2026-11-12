import {ApiFeature} from "../../../shared/components/ApiFeature";
import React,{useState} from "react";
import {FlatList,View} from "react-native";
import {router,type Href} from "expo-router";
import {useApp} from "../../../providers/AppProvider";
import {useResource} from "../../../shared/hooks/useResource";
import {useWriteAction} from "../../../shared/hooks/useWriteAction";
import {Banner,Button,Card,Chip,Empty,Field,Heading,Label,LoadState,RequireRole,Screen} from "../../../shared/components/ui";
import {catalogService} from "../catalogService";
export default function FavoritesScreen(){return <ApiFeature><RequireRole roles={["CUSTOMER"]}><Content /></RequireRole></ApiFeature>;}
function Content(){const {request}=useApp(),service=catalogService(request),write=useWriteAction();const [type,setType]=useState<"FOOD"|"RESTAURANT">("FOOD"),[text,setText]=useState(""),[q,setQ]=useState(""),[page,setPage]=useState(0),[sort,setSort]=useState("rating");const data=useResource(()=>service.favorites(type,q,sort,page),true,false,`favorites:${type}:${q}:${sort}:${page}`);
 const refresh=async()=>{if(await data.reload())write.reconciled();};
 return <Screen title="Yêu thích của tôi" scroll={false}><View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>{(["FOOD","RESTAURANT"] as const).map(t=><Chip key={t} title={t==="FOOD"?"Món":"Quán"} selected={type===t} onPress={()=>{setType(t);setPage(0);}} />)}{["price","rating","distance"].map(s=><Chip key={s} title={s==="price"?"Giá":s==="distance"?"Khoảng cách mẫu":"Điểm mẫu"} selected={sort===s} onPress={()=>{setSort(s);setPage(0);}} />)}</View><Field label="Tìm trong yêu thích" value={text} onChangeText={setText} /><Button title="Tìm yêu thích" onPress={()=>{setQ(text.trim());setPage(0);}} /><LoadState loading={data.loading} error={data.error} retry={()=>{void refresh();}} />{write.error&&<Banner error>{write.error}</Banner>}{write.uncertain&&<Button title="Đọc lại yêu thích" onPress={()=>{void refresh();}} />}
 <FlatList data={data.data?.content??[]} keyExtractor={f=>`${f.type}:${f.targetId}`} refreshing={data.loading} onRefresh={()=>{void refresh();}} contentContainerStyle={{gap:12}} ListEmptyComponent={!data.loading&&!data.error?<Empty title="Chưa có yêu thích phù hợp" detail="Mở quán hoặc món và xác nhận lưu yêu thích." />:undefined} renderItem={({item})=><Card><Heading>{item.summary.name}</Heading>{(!item.summary.available||("restaurantAvailable" in item.summary&&item.summary.restaurantAvailable===false))&&<Label>Tạm ngừng phục vụ; mở chi tiết để kiểm tra.</Label>}<Button title="Xem chi tiết" onPress={()=>router.push((item.type==="FOOD"?`/food/${item.targetId}`:`/restaurants/${item.targetId}`) as Href)} /><Button title="Bỏ yêu thích" variant="ghost" busy={write.busy} disabled={write.uncertain} onPress={()=>{void write.run(()=>service.favorite(item.type,item.targetId,false),()=>{void refresh();});}} /></Card>} />
 <View style={{flexDirection:"row",gap:8}}><Button title="Trang trước" disabled={page===0} onPress={()=>setPage(n=>n-1)} /><Button title="Trang sau" disabled={!data.data?.hasNext} onPress={()=>setPage(n=>n+1)} /></View></Screen>;
}
