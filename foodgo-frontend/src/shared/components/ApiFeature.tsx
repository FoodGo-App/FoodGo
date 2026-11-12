import React from "react";
import {router} from "expo-router";
import {useApp} from "../../providers/AppProvider";
import {Banner,Button,Screen} from "./ui";
export function ApiFeature({children}:{children:React.ReactNode}){const {mode}=useApp();return mode==="api"?<>{children}</>:<Screen title="Kết nối máy chủ" back><Banner>Chức năng này dùng API thật. Bản demo hiện không lưu địa chỉ, yêu thích hoặc giỏ qua các màn mới; hãy dùng bản ứng dụng đã kết nối máy chủ để thao tác.</Banner><Button title="Về trang chủ" onPress={()=>router.replace("/")} /></Screen>;}
