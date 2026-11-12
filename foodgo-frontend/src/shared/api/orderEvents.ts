const labels:Record<string,string>={ORDER_CREATED:'Đơn hàng đã được đặt',ORDER_CANCELLED:'Đơn hàng đã được hủy',RESTAURANT_ACCEPTED:'Quán đã nhận đơn',RESTAURANT_REJECTED:'Quán không thể nhận đơn',PREPARING:'Quán đang chuẩn bị món',READY_FOR_PICKUP:'Món đã sẵn sàng',DISPATCH_STARTED:'Đang tìm tài xế',NO_DRIVER:'Chưa tìm được tài xế',DRIVER_ASSIGNED:'Tài xế đã nhận chuyến',PICKED_UP:'Tài xế đã lấy món',DELIVERED:'Đã giao món thành công',DELIVERY_ISSUE:'Tài xế báo khó khăn khi giao',ISSUE_RESOLVED:'Khó khăn khi giao đã được xử lý'};
export const visibleOrderEvent=(type:string)=>!['SAMPLE_ORDER_CREATED','SAMPLE_DATA_READY'].includes(type);
export function orderEventText(type:string,text:string){
 const code=type||text.split(' · ')[0];const reason=text.startsWith(code+' · ')?text.slice(code.length+3):'';
 if(labels[code])return labels[code]+(reason?' · '+reason:'');
 return /[a-zà-ỹ]/i.test(text)&&!/^\s*[A-Z0-9_]+\s*$/.test(text)?text:'Thông tin đơn hàng đã được cập nhật';
}
