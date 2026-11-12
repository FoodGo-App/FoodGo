import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/theme";
import { Icon, IconButton } from "./Gui";
import { Panda } from "./Panda";

/** Native illustration only: stored sample points, no GPS or external map service. */
export function IllustratedMap({restaurantName="Nhà hàng",addressText,etaMinutes,tracking=false,pointCode,height}: {restaurantName?:string;addressText?:string;etaMinutes?:number;tracking?:boolean;pointCode?:string;height?:number}) {
  const [showPoint,setShowPoint]=useState(false);
  return <View accessibilityLabel={`Bản đồ minh họa${tracking?` từ ${restaurantName}`:""}${addressText?` đến ${addressText}`:""}. Không định vị GPS.`} style={[{flex:height?undefined:1,minHeight:220,overflow:"hidden",backgroundColor:"#EAF1E8"},height?{height}:null]}>
    <View style={{position:"absolute",right:"-5%",top:"6%",width:"40%",height:"35%",borderRadius:45,backgroundColor:"#D1E6BD",transform:[{rotate:"-28deg"}]}}/>
    {[0,1,2,3,4,5].map(i=><View key={`block${i}`} style={{position:"absolute",left:`${(i%3)*36-7}%`,top:`${Math.floor(i/3)*58+8}%`,width:"25%",height:"28%",borderWidth:1,borderColor:"#D1D9D1",backgroundColor:i%2?"#DDECE0":"#F0F1E8",transform:[{rotate:"-28deg"}]}}/>)}
    {[0,1,2,3].map(i=><View key={`road${i}`} style={{position:"absolute",left:"-25%",top:`${i*30-5}%`,width:"160%",height:21,backgroundColor:"#FEFEFB",borderTopWidth:1,borderBottomWidth:1,borderColor:"#D4DAD4",transform:[{rotate:"26deg"}]}}/>)}
    {[0,1,2].map(i=><View key={`cross${i}`} style={{position:"absolute",left:`${i*47-18}%`,top:"-40%",height:"190%",width:19,backgroundColor:"#FEFEFB",borderLeftWidth:1,borderRightWidth:1,borderColor:"#D4DAD4",transform:[{rotate:"28deg"}]}}/>)}
    {tracking&&<>
      <View style={[map.route,{left:"22%",top:"34%",width:"22%",transform:[{rotate:"32deg"}]}]}/><View style={[map.route,{left:"41%",top:"46%",width:"27%",transform:[{rotate:"10deg"}]}]}/><View style={[map.route,{left:"64%",top:"56%",width:"17%",transform:[{rotate:"48deg"}]}]}/>
      <View style={{position:"absolute",left:"7%",top:"16%",alignItems:"center",gap:4,maxWidth:150}}><View style={map.tag}><Icon name="store" size={18} color={colors.orange}/><Text numberOfLines={2} style={map.tagText}>{restaurantName}</Text></View><Icon name="pin" color={colors.orange} size={38}/></View>
      <View style={{position:"absolute",left:"43%",top:"40%"}}><Panda size={58} pose="hello"/></View>
    </>}
    <View style={{position:"absolute",left:tracking?"70%":pointCode==="CUSTOMER_B"?"56%":"44%",top:tracking?"64%":"44%",alignItems:"center",gap:3}}>
      {tracking&&<View style={map.tag}><Text style={map.tagText}>Điểm nhận</Text></View>}<View style={{backgroundColor:showPoint?colors.mint:"white",borderRadius:24,padding:5}}><Icon name="pin" size={38}/></View>
    </View>
    {showPoint&&addressText&&<View style={{position:"absolute",left:16,right:16,top:12,...map.tag}}><Text style={map.tagText}>{addressText}</Text></View>}
    <View style={{position:"absolute",left:14,bottom:14,...map.tag}}><Icon name="help" size={15} color={colors.muted}/><Text style={{fontSize:11,color:colors.muted}}>Bản đồ minh họa</Text></View>
    <View style={{position:"absolute",right:14,bottom:14}}><IconButton name="locate" label="Hiện điểm nhận minh họa" onPress={()=>setShowPoint(v=>!v)} variant="mint"/></View>
    {etaMinutes!==undefined&&!showPoint&&<View style={{position:"absolute",right:12,top:12,...map.tag}}><Icon name="clock" size={14}/><Text style={{fontSize:11,color:colors.brand}}>{Math.max(0,etaMinutes)} phút · dự kiến mẫu</Text></View>}
  </View>;
}
const map=StyleSheet.create({route:{position:"absolute",height:7,backgroundColor:colors.brand,borderWidth:1,borderColor:"white",borderRadius:4},tag:{backgroundColor:"rgba(255,255,255,0.94)",borderRadius:16,paddingHorizontal:10,paddingVertical:6,flexDirection:"row",alignItems:"center",gap:6},tagText:{fontSize:12,fontWeight:"700",color:colors.ink,flexShrink:1}});
