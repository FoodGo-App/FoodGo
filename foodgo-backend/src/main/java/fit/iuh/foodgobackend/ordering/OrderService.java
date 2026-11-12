package fit.iuh.foodgobackend.ordering;
import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.common.*;
import fit.iuh.foodgobackend.account.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @Transactional
public class OrderService {
 private final OrderRepository orders;public OrderService(OrderRepository orders){this.orders=orders;}
 public Object detail(UserPrincipal u,long id){return orders.dto(orders.visible(u,id,false),u);}
 public Object list(UserPrincipal u,String status,int page,int size){
  u.requireRole("CUSTOMER");String sql="SELECT * FROM orders WHERE customer_id=?";var args=new ArrayList<Object>();args.add(u.id());
  if(status!=null&&!status.isBlank()){require(Set.of("PENDING_CONFIRMATION","CONFIRMED","PREPARING","READY_FOR_PICKUP","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","REJECTED").contains(status),400,"INVALID_STATUS","Trạng thái không hợp lệ.");sql+=" AND status=?";args.add(status);}sql+=" ORDER BY id DESC";
  return Api.page(orders.db().rows(sql,args.toArray()).stream().map(o->orders.dto(o,u)).toList(),page,size);
 }
 public Object cancel(UserPrincipal u,long id,String reason){u.requireRole("CUSTOMER");var o=orders.visible(u,id,true);if(s(o,"status").equals("CANCELLED"))return orders.dto(o,u);
  OrderPolicy.state(s(o,"status").equals("PENDING_CONFIRMATION"));require(reason!=null&&!reason.isBlank()&&reason.length()<=300,400,"INVALID_REASON","Cần lý do hủy từ 1 đến 300 ký tự.");
  orders.refund(o);orders.db().update("UPDATE orders SET status='CANCELLED',version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",id);orders.event(id,u.id(),"ORDER_CANCELLED",s(o,"status"),"CANCELLED",reason.trim());return orders.dto(orders.lock(id),u);
 }
 public Object tracking(UserPrincipal u,long id){require(!u.role().equals("RESTAURANT"),403,"FORBIDDEN","Chỉ người tham gia giao hàng được xem.");var o=orders.visible(u,id,false);return m("orderId",Long.toString(id),"simulated",true,"updatedAt",iso(o.get("updated_at")),"etaMinutes",s(o,"status").equals("DELIVERED")?0:20,"mapAssetCode","AREA_A","routeCode","RESTAURANT_A_"+s(o,"map_point_code"));}
}
