import React from "react";
import {router} from "expo-router";
import {useApp} from "../../providers/AppProvider";
import {Banner,Button,Screen} from "./ui";
export function ApiFeature({children}:{children:React.ReactNode}){const {mode}=useApp();return mode==="api"?<>{children}</>:<Screen title="Chưa có trong bản dùng thử" back><Banner>Khám phá món, địa chỉ và giỏ hàng có trong bản FoodGo kết nối dịch vụ. Bạn vẫn có thể thử hành trình đặt và giao món mẫu ở trang chủ.</Banner><Button title="Về trang chủ" onPress={()=>router.replace("/")} /></Screen>;}
