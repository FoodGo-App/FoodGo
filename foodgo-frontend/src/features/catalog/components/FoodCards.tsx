import React from 'react';
import {Text,View} from 'react-native';
import {MotionPressable} from '../../../shared/components/Motion';
import {FoodThumbnail} from '../../../shared/components/FoodThumbnail';
import {colors,money} from '../../../shared/theme/theme';
import {m} from './M01Layout';
import type {Food,Restaurant} from '../catalogService';
export function FoodCard({food,onPress,restaurantName,horizontal=false}: {food:Food;onPress:()=>void;restaurantName?:string;horizontal?:boolean}) {
 return <MotionPressable accessibilityRole="button" accessibilityLabel={`Xem món ${food.name}, giá từ ${money(food.basePrice)}`} onPress={onPress} style={{backgroundColor:colors.white,borderRadius:15,borderWidth:1,borderColor:colors.line,overflow:'hidden',width:horizontal?164:undefined,flexDirection:horizontal?'column':'row',alignItems:horizontal?'stretch':'center',padding:horizontal?0:10,gap:horizontal?0:12,minHeight:horizontal?undefined:108}}>
  <FoodThumbnail name={food.name} imageCode={food.imageCode} size={horizontal?162:86} radius={horizontal?0:11}/>
  <View style={{flex:horizontal?undefined:1,padding:horizontal?10:0,gap:4}}><Text numberOfLines={2} style={{...m.heading,fontSize:15}}>{food.name}</Text>{restaurantName&&<Text numberOfLines={1} style={m.meta}>{restaurantName}</Text>}<Text style={m.price}>{money(food.basePrice)}</Text>{!food.available&&<Text style={m.meta}>Tạm ngừng phục vụ</Text>}</View>
 </MotionPressable>;
}
export function RestaurantCard({restaurant,onPress,horizontal=false}: {restaurant:Restaurant;onPress:()=>void;horizontal?:boolean}) {
 return <MotionPressable accessibilityRole="button" accessibilityLabel={`Xem nhà hàng ${restaurant.name}`} onPress={onPress} style={{...m.card,width:horizontal?210:undefined,flexDirection:'row',alignItems:'center',padding:10,gap:12}}><FoodThumbnail name={restaurant.name} imageCode={restaurant.imageCode} size={horizontal?64:86} radius={11}/><View style={{flex:1,gap:5}}><Text numberOfLines={2} style={{...m.heading,fontSize:15}}>{restaurant.name}</Text><Text style={m.meta}>{restaurant.sampleRating} ★ · {restaurant.sampleEtaMinutes} phút</Text><Text style={m.meta}>Thông tin minh họa</Text></View></MotionPressable>;
}
