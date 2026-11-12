import type { Order } from '../../../shared/types/domain.ts';
type State=Pick<Order,'status'|'deliveryStatus'|'allowedActions'|'driverId'>;
export function customerPresentation(order:State){
 const terminal=['DELIVERED','CANCELLED','REJECTED'].includes(order.status),delivered=order.status==='DELIVERED';
 const accepted=!['PENDING_CONFIRMATION','CANCELLED','REJECTED'].includes(order.status);
 const preparing=['PREPARING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED'].includes(order.status);
 const ready=['READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED'].includes(order.status);
 const heading=delivered?'Giao món thành công':order.status==='CANCELLED'?'Đơn đã được hủy':order.status==='REJECTED'?'Quán chưa thể nhận đơn':order.status==='PENDING_CONFIRMATION'?'Chờ quán xác nhận':order.deliveryStatus==='NO_DRIVER'?'Chưa tìm được tài xế':!order.driverId?'Đang tìm tài xế':order.status==='OUT_FOR_DELIVERY'?'Đang giao đến bạn':order.status==='READY_FOR_PICKUP'?'Món đã sẵn sàng':'Quán đang chuẩn bị món';
 return {terminal,tracking:!!order.driverId&&!terminal,heading,canCancel:!terminal&&order.allowedActions.includes('cancel'),canRetry:!terminal&&order.allowedActions.includes('retryDispatch'),canReview:delivered,
  steps:[{label:'Nhận đơn',done:accepted,active:!terminal&&!accepted},{label:'Tìm tài xế',done:!!order.driverId||delivered,active:accepted&&!order.driverId&&!terminal},{label:'Chuẩn bị',done:ready,active:preparing&&!ready&&!terminal},{label:'Đang giao',done:delivered,active:order.status==='OUT_FOR_DELIVERY'},{label:'Hoàn tất',done:delivered,active:false}]};
}
