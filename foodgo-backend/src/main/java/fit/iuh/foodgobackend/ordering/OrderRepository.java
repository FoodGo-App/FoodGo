package fit.iuh.foodgobackend.ordering;

import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.common.*;
import fit.iuh.foodgobackend.account.UserPrincipal;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public class OrderRepository {
 private final JpaSql db;
 public OrderRepository(JpaSql db){this.db=db;}
 public JpaSql db(){return db;}
 public Map<String,Object> lock(long id){return db.required("SELECT * FROM orders WHERE id=? FOR UPDATE",id);}
 public Map<String,Object> visible(UserPrincipal u,long id,boolean locking){
  String scope=switch(u.role()){case "CUSTOMER"->"customer_id";case "RESTAURANT"->"restaurant_id";case "DRIVER"->"driver_id";default->throw new ApiException(403,"FORBIDDEN","Không có quyền.");};
  Object owner=u.role().equals("RESTAURANT")?u.restaurantId():u.id();
  return db.required("SELECT * FROM orders WHERE id=? AND "+scope+"=?"+(locking?" FOR UPDATE":""),id,owner);
 }
 public long event(long order,Long actor,String type,String from,String to,String reason){return db.insert("order_events",m("order_id",order,"actor_id",actor,"event_type",type,"from_status",from,"to_status",to,"reason",reason));}
 public void refund(Map<String,Object> order){
  if(s(order,"payment_method").equals("MOCK_WALLET")&&s(order,"payment_status").equals("PAID")){
   db.update("UPDATE orders SET payment_status='REFUNDED',refunded_at=UTC_TIMESTAMP(3) WHERE id=?",order.get("id"));
   db.update("UPDATE checkout_attempts SET result='REFUNDED',updated_at=UTC_TIMESTAMP(3) WHERE order_id=?",order.get("id"));
  }
 }
 public Map<String,Object> dto(Map<String,Object> o,UserPrincipal actor){
  long oid=n(o,"id");var actions=new ArrayList<String>();String status=s(o,"status");boolean terminal=OrderPolicy.terminal(status);
  if(actor.role().equals("CUSTOMER")){
   if(status.equals("PENDING_CONFIRMATION"))actions.add("cancel");
   if(s(o,"delivery_status").equals("NO_DRIVER")&&!terminal)actions.add("retryDispatch");
   if(o.get("driver_id")!=null){actions.add("chat");if(!terminal)actions.add("call");if(status.equals("DELIVERED")&&db.one("SELECT id FROM driver_reviews WHERE order_id=?",oid)==null)actions.add("review");}
  }else if(actor.role().equals("RESTAURANT")){switch(status){case "PENDING_CONFIRMATION"->actions.addAll(List.of("accept","reject"));case "CONFIRMED"->actions.add("prepare");case "PREPARING"->actions.add("ready");default->{}}}
  else if(actor.role().equals("DRIVER")&&n(o,"driver_id")==actor.id()){
   actions.add("chat");if(!terminal){actions.add("call");if(status.equals("READY_FOR_PICKUP"))actions.add("pickup");if(status.equals("OUT_FOR_DELIVERY"))actions.addAll(List.of("deliver","issue"));}
  }
  var lines=db.rows("SELECT * FROM order_items WHERE order_id=? ORDER BY id",oid).stream().map(l->m("id",id(l.get("id")),"foodId",id(l.get("food_id")),"foodName",l.get("food_name"),"imageCode",l.get("image_code"),"basePrice",n(l,"base_price"),"unitPrice",n(l,"unit_price"),"quantity",n(l,"quantity"),"lineTotal",n(l,"line_total"),"note",l.get("note"),"optionsSnapshot",objects(l.get("options_snapshot")))).toList();
  var events=db.rows("SELECT * FROM order_events WHERE order_id=? ORDER BY id",oid).stream().map(e->m("id",id(e.get("id")),"eventType",e.get("event_type"),"text",s(e,"event_type")+(s(e,"reason").isEmpty()?"":" · "+s(e,"reason")),"createdAt",iso(e.get("created_at")))).toList();
  var driver=o.get("driver_id")==null?null:db.one("SELECT display_name FROM users WHERE id=?",o.get("driver_id"));
  var issue=bool(o.get("has_delivery_issue"))?db.one("SELECT reason FROM order_events WHERE order_id=? AND event_type='DELIVERY_ISSUE' ORDER BY id DESC LIMIT 1",oid):null;
  return m("id",id(o.get("id")),"customerId",id(o.get("customer_id")),"restaurantId",id(o.get("restaurant_id")),"restaurantName",o.get("restaurant_name"),"recipientName",o.get("recipient_name"),"recipientPhone",o.get("recipient_phone"),"addressText",o.get("address_text"),"areaCode",o.get("area_code"),"driverId",id(o.get("driver_id")),"driverName",driver==null?null:driver.get("display_name"),"status",status,"deliveryStatus",o.get("delivery_status"),"paymentMethod",o.get("payment_method"),"paymentStatus",o.get("payment_status"),"subtotal",n(o,"subtotal"),"deliveryFee",n(o,"delivery_fee"),"foodDiscount",n(o,"food_discount"),"deliveryDiscount",n(o,"delivery_discount"),"total",n(o,"total"),"items",lines,"events",events,"issue",issue==null?null:issue.get("reason"),"dispatchRound",n(o,"dispatch_round"),"createdAt",iso(o.get("created_at")),"updatedAt",iso(o.get("updated_at")),"allowedActions",actions);
 }
}
