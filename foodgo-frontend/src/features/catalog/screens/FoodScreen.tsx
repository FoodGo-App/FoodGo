import {ApiFeature} from "../../../shared/components/ApiFeature";
import {FoodPurchase} from "../../cart/FoodPurchase";
import React,{useState} from "react";
import {router,useLocalSearchParams,type Href} from "expo-router";
import {useApp} from "../../../providers/AppProvider";
import {useResource} from "../../../shared/hooks/useResource";
import {useWriteAction} from "../../../shared/hooks/useWriteAction";
import {Banner,Button,Label,LoadState,Screen} from "../../../shared/components/ui";
import {money} from "../../../shared/theme/theme";
import {catalogService} from "../catalogService";
import {captureReturnTo,loginHref} from "../../account/loginReturn";
export default function FoodScreen(){return <ApiFeature><Content /></ApiFeature>;}
function Content(){const params=useLocalSearchParams<{id:string;options?:string;quantity?:string;note?:string}>(),{id}=params,{request,session}=useApp(),service=catalogService(request),write=useWriteAction();const data=useResource(()=>service.food(id),true,false,`food:${id}`);
 const [selectedContext,setSelectedContext]=useState<{id:string;path:string|null}|null>(null);
 const favorite=(saved:boolean)=>{if(!session){router.push(loginHref(selectedContext?.id===id?selectedContext.path:captureReturnTo(`/food/${id}`,params)));return;}if(session.user.role!=="CUSTOMER"){router.replace("/");return;}void write.run(()=>service.favorite("FOOD",id,saved));};
 return <Screen title={data.data?.name??"Chi tiết món"} back><LoadState loading={data.loading} error={data.error} retry={()=>{void data.reload();}} />{data.data&&<><Label>{data.data.description}</Label><Label>{money(data.data.basePrice)} · Giá cơ bản</Label><Label>{data.data.available&&data.data.restaurantAvailable!==false?"Đang phục vụ":"Món hoặc quán tạm ngừng"}</Label><Button title="Xem quán" onPress={()=>router.push(`/restaurants/${data.data!.restaurantId}` as Href)} /><FoodPurchase key={`${id}:${JSON.stringify(params)}`} food={data.data} onContextChange={path=>setSelectedContext({id,path})} initial={{optionValueIds:typeof params.options==="string"?params.options.split(",").filter(Boolean):[],quantity:Number(params.quantity??1),note:typeof params.note==="string"?params.note:""}} /><Button title="Lưu món yêu thích" busy={write.busy} disabled={write.uncertain} onPress={()=>favorite(true)} /><Button title="Bỏ yêu thích món" variant="ghost" busy={write.busy} disabled={write.uncertain} onPress={()=>favorite(false)} />{write.error&&<Banner error>{write.error}</Banner>}{write.uncertain&&<Button title="Đọc lại yêu thích món" onPress={()=>{void service.favorites("FOOD").then(write.reconciled).catch(()=>{});}} />}</>}</Screen>;
}
