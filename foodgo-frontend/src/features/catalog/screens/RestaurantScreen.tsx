import {ApiFeature} from "../../../shared/components/ApiFeature";
import React from "react";
import {router,useLocalSearchParams,type Href} from "expo-router";
import {useApp} from "../../../providers/AppProvider";
import {useResource} from "../../../shared/hooks/useResource";
import {useWriteAction} from "../../../shared/hooks/useWriteAction";
import {Banner,Button,Card,Heading,Label,LoadState,Screen} from "../../../shared/components/ui";
import {catalogService} from "../catalogService";
import {loginHref} from "../../account/loginReturn";
export default function RestaurantScreen(){return <ApiFeature><Content /></ApiFeature>;}
function Content(){const {id}=useLocalSearchParams<{id:string}>(),{request,session}=useApp(),service=catalogService(request),write=useWriteAction();const data=useResource(()=>service.restaurant(id),true,false,`restaurant:${id}`);
 const save=(saved:boolean)=>{if(!session){router.push(loginHref(`/restaurants/${id}`));return;}if(session.user.role!=="CUSTOMER"){router.replace("/");return;}void write.run(()=>service.favorite("RESTAURANT",id,saved));};
 return <Screen title={data.data?.name??"Nhà hàng"} back onRefresh={()=>{void service.restaurant(id,true).then(()=>data.reload()).catch(()=>{});}}><LoadState loading={data.loading} error={data.error} retry={()=>{void data.reload();}} />{data.data&&<><Label>{data.data.addressText}</Label><Label>{data.data.available?"Đang phục vụ":"Tạm ngừng phục vụ"}</Label><Label muted>{data.data.sampleRating}★ · {data.data.sampleDistanceM}m · {data.data.sampleEtaMinutes} phút (mẫu)</Label><Button title="Xem thực đơn và combo" onPress={()=>router.push(`/catalog?restaurantId=${id}` as Href)} /><Button title="Lưu quán yêu thích" busy={write.busy} disabled={write.uncertain} onPress={()=>save(true)} /><Button title="Bỏ yêu thích quán" variant="ghost" busy={write.busy} disabled={write.uncertain} onPress={()=>save(false)} />{write.error&&<Banner error>{write.error}</Banner>}{write.uncertain&&<Button title="Kiểm tra lại yêu thích" onPress={()=>{void service.favorites("RESTAURANT").then(write.reconciled).catch(()=>{});}} />}{data.data.sampleReviews?.map((r,i)=><Card key={i}><Heading>{r.name??"Nhận xét mẫu"}</Heading><Label>{r.text??""}</Label><Label muted>Đánh giá mẫu</Label></Card>)}</>}</Screen>;
}
