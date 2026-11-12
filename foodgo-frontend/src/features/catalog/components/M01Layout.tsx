import React from 'react';
import {KeyboardAvoidingView,Platform,RefreshControl,ScrollView,StyleSheet,Text,TextInput,View,type TextInputProps} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router} from 'expo-router';
import {SymbolView} from 'expo-symbols';
import {Icon,IconButton,type GuiIconName} from '../../../shared/components/Gui';
import {MotionPressable} from '../../../shared/components/Motion';
import {colors} from '../../../shared/theme/theme';

/** M01/M02 only. The M03–M05 screen frames intentionally stay unchanged. */
export function M01Screen({title,subtitle,children,back=false,onBack,scroll=true,footer,right,onRefresh,header}: {title:string;subtitle?:string;children:React.ReactNode;back?:boolean;onBack?:()=>void;scroll?:boolean;footer?:React.ReactNode;right?:React.ReactNode;onRefresh?:()=>void;header?:React.ReactNode}) {
 return <SafeAreaView style={m.page} edges={back?['top','left','right','bottom']:['top','left','right']}><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
  {header??<View style={m.header}>{back&&<IconButton name="back" label="Quay lại" variant="plain" onPress={onBack??(()=>router.canGoBack()?router.back():router.replace('/'))}/>}<View style={{flex:1,gap:3}}><Text accessibilityRole="header" style={m.title}>{title}</Text>{subtitle&&<Text style={m.meta}>{subtitle}</Text>}</View>{right}</View>}
  {scroll?<ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={m.content} refreshControl={onRefresh?<RefreshControl refreshing={false} onRefresh={onRefresh}/>:undefined}>{children}</ScrollView>:<View style={{flex:1,minHeight:0}}>{children}</View>}
  {footer&&<View style={m.footer}>{footer}</View>}
 </KeyboardAvoidingView></SafeAreaView>;
}
export function SearchBar({value,onChangeText,onSubmitEditing,placeholder='Tìm món hoặc nhà hàng…',label='Tìm món hoặc nhà hàng'}:Pick<TextInputProps,'value'|'onChangeText'|'onSubmitEditing'|'placeholder'>&{label?:string}) {
 return <View style={m.search}><SymbolView name={{ios:'magnifyingglass',android:'search',web:'search'}} size={18} tintColor={colors.brand} style={{width:18,height:18}}/><TextInput accessibilityLabel={label} placeholder={placeholder} placeholderTextColor={colors.muted} value={value} onChangeText={onChangeText} onSubmitEditing={onSubmitEditing} returnKeyType="search" style={{flex:1,minWidth:0,fontSize:14,color:colors.ink,paddingVertical:11}}/>{!!value&&<IconButton name="close" label="Xóa từ khóa" variant="plain" onPress={()=>onChangeText?.('')}/>}</View>;
}
export function MenuRow({icon,title,detail,onPress}: {icon:GuiIconName;title:string;detail?:string;onPress:()=>void}) {
 return <MotionPressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={m.menu}><View style={m.icon}><Icon name={icon}/></View><View style={{flex:1,gap:4}}><Text style={m.heading}>{title}</Text>{detail&&<Text style={m.meta}>{detail}</Text>}</View><Icon name="chevron" size={18}/></MotionPressable>;
}
export function CartShortcut({onPress}: {onPress:()=>void}) {
 return <MotionPressable accessibilityRole="button" accessibilityLabel="Giỏ hàng của tôi" onPress={onPress} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><SymbolView name={{ios:'bag',android:'shopping_bag',web:'shopping_bag'}} size={23} tintColor={colors.brand} style={{width:23,height:23}}/></MotionPressable>;
}
export function TinyAction({title,onPress,disabled=false,danger=false}: {title:string;onPress:()=>void;disabled?:boolean;danger?:boolean}) {
 return <MotionPressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={{minHeight:44,paddingHorizontal:8,justifyContent:'center',opacity:disabled?0.4:1}}><Text style={{fontSize:13,fontWeight:'600',color:danger?colors.danger:colors.brand}}>{title}</Text></MotionPressable>;
}
export const m=StyleSheet.create({
 page:{flex:1,backgroundColor:colors.paper},header:{minHeight:58,paddingHorizontal:16,paddingVertical:9,flexDirection:'row',alignItems:'center',gap:4},title:{fontSize:21,lineHeight:27,fontWeight:'700',color:colors.ink},heading:{fontSize:16,lineHeight:22,fontWeight:'700',color:colors.ink},meta:{fontSize:12,lineHeight:18,color:colors.muted},text:{fontSize:14,lineHeight:21,color:colors.ink},price:{fontSize:16,fontWeight:'700',color:colors.orange},content:{padding:16,gap:16,paddingBottom:24},footer:{padding:16,paddingTop:12,gap:10,borderTopWidth:StyleSheet.hairlineWidth,borderColor:colors.line,backgroundColor:colors.paper},row:{flexDirection:'row',alignItems:'center',gap:10},between:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},card:{borderWidth:1,borderColor:colors.line,borderRadius:16,padding:14,gap:10,backgroundColor:colors.white},search:{minHeight:46,borderRadius:12,borderWidth:1,borderColor:colors.line,backgroundColor:colors.white,paddingLeft:12,paddingRight:4,flexDirection:'row',alignItems:'center',gap:8},menu:{minHeight:82,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line,borderRadius:17,padding:14,flexDirection:'row',alignItems:'center',gap:12},icon:{width:42,height:42,borderRadius:21,backgroundColor:colors.mint,alignItems:'center',justifyContent:'center'},divider:{height:StyleSheet.hairlineWidth,backgroundColor:colors.line},
});
