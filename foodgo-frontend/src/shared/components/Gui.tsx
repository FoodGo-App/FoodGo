import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { colors } from "../theme/theme";
import { MotionPressable, useReducedMotion } from "./Motion";

const symbols = {
  back: ["chevron.left", "arrow_back"], close: ["xmark", "close"], chevron: ["chevron.right", "chevron_right"], down: ["chevron.down", "expand_more"],
  store: ["storefront", "storefront"], ticket: ["ticket", "local_offer"], pin: ["mappin.and.ellipse", "location_on"], clock: ["clock", "schedule"],
  call: ["phone", "call"], chat: ["bubble.left", "chat_bubble_outline"], send: ["paperplane.fill", "send"], add: ["plus", "add"], remove: ["minus", "remove"],
  check: ["checkmark", "check"], edit: ["pencil", "edit"], locate: ["location.viewfinder", "my_location"], wallet: ["wallet.bifold", "account_balance_wallet"],
  help: ["questionmark.circle", "help_outline"], volume: ["speaker.wave.2", "volume_up"], mic: ["mic", "mic"], micOff: ["mic.slash", "mic_off"],
  smile: ["face.smiling", "sentiment_satisfied"], image: ["photo", "image"], star: ["star.fill", "star"], heart: ["heart.fill", "favorite"], person: ["person.fill", "person"], refresh: ["arrow.clockwise", "refresh"],
} as const;
export type GuiIconName = keyof typeof symbols;
export function Icon({ name, size = 22, color = colors.brand }: { name: GuiIconName; size?: number; color?: string }) {
  const [ios, other] = symbols[name];
  return <SymbolView name={{ios,android:other,web:other} as SymbolViewProps["name"]} size={size} tintColor={color} style={{width:size,height:size}} />;
}
export function IconButton({ name, label, onPress, disabled = false, variant = "mint", size = 44 }: { name: GuiIconName; label: string; onPress: () => void; disabled?: boolean; variant?: "mint" | "danger" | "plain"; size?: number }) {
  return <MotionPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={{minWidth:44,minHeight:44,width:size,height:size,borderRadius:variant === "danger" ? size/2 : 13,alignItems:"center",justifyContent:"center",backgroundColor:variant === "mint" ? colors.mint : variant === "danger" ? "#E43C42" : "transparent",opacity:disabled?0.4:1}}><Icon name={name} color={variant === "danger" ? "white" : colors.brand} size={Math.min(26,size*0.48)} /></MotionPressable>;
}
type FrameProps = { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode; scroll?: boolean; right?: React.ReactNode; onBack?: () => void; onRefresh?: () => void; contentStyle?: StyleProp<ViewStyle> };
export function GuiScreen({title,subtitle,children,footer,scroll=true,right,onBack,onRefresh,contentStyle}:FrameProps) {
  return <SafeAreaView edges={["top","bottom","left","right"]} style={guiStyles.page}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === "ios" ? "padding" : "height"}>
    <View style={guiStyles.header}><IconButton name="back" label="Quay lại" variant="plain" onPress={onBack ?? (()=>router.canGoBack()?router.back():router.replace("/"))} /><View style={{flex:1,alignItems:"center"}}><Text accessibilityRole="header" style={guiStyles.title}>{title}</Text>{subtitle&&<Text style={guiStyles.caption}>{subtitle}</Text>}</View><View style={{minWidth:44,alignItems:"flex-end"}}>{right}</View></View>
    {scroll?<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[guiStyles.content,contentStyle]} refreshControl={onRefresh?<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.brand}/>:undefined}>{children}</ScrollView>:<View style={[{flex:1},contentStyle]}>{children}</View>}
    {footer&&<View style={guiStyles.footer}>{footer}</View>}
  </KeyboardAvoidingView></SafeAreaView>;
}
export function GuiModal({visible,title,onClose,children,footer,scroll=true}: {visible:boolean;title:string;onClose:()=>void;children:React.ReactNode;footer?:React.ReactNode;scroll?:boolean}) {
  const reduced=useReducedMotion();
  return <Modal visible={visible} animationType={reduced?"none":"slide"} onRequestClose={onClose} presentationStyle="fullScreen"><View style={{flex:1}} accessibilityViewIsModal><GuiScreen title={title} onBack={onClose} footer={footer} scroll={scroll}>{children}</GuiScreen></View></Modal>;
}
export function DriverAvatar({name,uri,size=72}: {name:string;uri?:string;size?:number}) {
  const [failed,setFailed]=useState<string|null>(null);
  const available=!!uri&&failed!==uri;
  const initial=name.trim().split(/\s+/).pop()?.charAt(0).toLocaleUpperCase()||"?";
  return <View style={{alignItems:"center",gap:4}}><View style={{width:size,height:size,borderRadius:size/2,overflow:"hidden",backgroundColor:colors.mint,borderWidth:2,borderColor:colors.brand,alignItems:"center",justifyContent:"center"}}>
    {available?<Image accessibilityLabel={`Ảnh đại diện ${name}`} source={{uri}} onError={()=>setFailed(uri!)} style={{width:"100%",height:"100%"}}/>:<Text accessibilityLabel={`Ảnh mặc định của ${name}`} style={{fontSize:size*0.4,fontWeight:"700",color:colors.brand}}>{initial}</Text>}
  </View></View>;
}
export const guiStyles=StyleSheet.create({
  page:{flex:1,backgroundColor:colors.paper},header:{flexDirection:"row",alignItems:"center",paddingHorizontal:12,paddingVertical:10,gap:6,borderBottomWidth:StyleSheet.hairlineWidth,borderColor:colors.line},
  title:{fontSize:21,lineHeight:28,fontWeight:"800",color:colors.ink,textAlign:"center"},caption:{fontSize:12,lineHeight:18,color:colors.muted},content:{padding:20,gap:18,paddingBottom:28},footer:{paddingHorizontal:20,paddingTop:12,paddingBottom:12,gap:10,borderTopWidth:StyleSheet.hairlineWidth,borderColor:colors.line,backgroundColor:colors.paper},
  text:{fontSize:15,lineHeight:22,color:colors.ink},muted:{fontSize:13,lineHeight:20,color:colors.muted},heading:{fontSize:19,lineHeight:25,fontWeight:"800",color:colors.ink},row:{flexDirection:"row",alignItems:"center",gap:12},between:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},divider:{height:StyleSheet.hairlineWidth,backgroundColor:colors.line},
});
