package fit.iuh.foodgobackend.fulfillment;

import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.common.*;
import fit.iuh.foodgobackend.ordering.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import static fit.iuh.foodgobackend.common.Data.*;

@Service
public class FulfillmentService {
 private final OrderRepository orders;
 private final JpaSql db;
 private final int offerSeconds;
 public FulfillmentService(OrderRepository orders,JpaSql db,@Value("${foodgo.offer-seconds:30}") int offerSeconds){
  this.orders=orders;this.db=db;this.offerSeconds=Math.max(1,offerSeconds);
 }

 @Transactional(readOnly=true)
 public List<Map<String,Object>> restaurantOrders(UserPrincipal u,String status){
  u.requireRole("RESTAURANT");
  require(status==null||Set.of("active","history","PENDING_CONFIRMATION","CONFIRMED","PREPARING","READY_FOR_PICKUP","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","REJECTED").contains(status),400,"INVALID_FILTER","Bộ lọc không hợp lệ.");
  return db.rows("SELECT * FROM orders WHERE restaurant_id=? ORDER BY id DESC",u.restaurantId()).stream()
   .filter(o->status==null||status.equals("active")&&!OrderPolicy.terminal(s(o,"status"))||status.equals("history")&&OrderPolicy.terminal(s(o,"status"))||s(o,"status").equals(status))
   .map(o->orders.dto(o,u)).toList();
 }

 @Transactional
 public Map<String,Object> restaurantAction(UserPrincipal u,long id,String action,String reason){
  u.requireRole("RESTAURANT");
  var o=orders.visible(u,id,true);
  String event=switch(action){case "accept"->"RESTAURANT_ACCEPTED";case "reject"->"RESTAURANT_REJECTED";case "prepare"->"PREPARING";case "ready"->"READY_FOR_PICKUP";default->"";};
  boolean repeated=!event.isEmpty() && db.one("SELECT id FROM order_events WHERE order_id=? AND actor_id=? AND event_type=?",id,u.id(),event)!=null;
  FulfillmentRules.restaurant(s(o,"status"),action,repeated);
  if(repeated)return orders.dto(o,u);
  if(action.equals("reject")){reason=reason==null?"":reason.trim();require(!reason.isEmpty()&&reason.length()<=300,400,"INVALID_REASON","Nhập lý do từ chối 1–300 ký tự.");}
  String from=s(o,"status"),to=FulfillmentRules.TARGET.get(action);
  db.update("UPDATE orders SET status=?,version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",to,id);
  o.put("status",to);orders.event(id,u.id(),event,from,to,reason);
  if(action.equals("reject")){
   orders.refund(o);
   if(s(o,"payment_method").equals("MOCK_WALLET")&&s(o,"payment_status").equals("PAID"))o.put("payment_status","REFUNDED");
   db.update("UPDATE driver_offers SET status='REVOKED',responded_at=UTC_TIMESTAMP(3) WHERE order_id=? AND status='OFFERED'",id);
  }
  if(action.equals("accept"))startRound(o,u.id());
  o.put("updated_at",now());return orders.dto(o,u);
 }

 @Transactional
 public Map<String,Object> retry(UserPrincipal u,long id){
  u.requireRole("CUSTOMER");var o=orders.visible(u,id,true);
  FulfillmentRules.retry(s(o,"status"),s(o,"delivery_status"),o.get("driver_id"));
  startRound(o,u.id());return orders.dto(o,u);
 }

 /** Caller holds the order lock; driver rows are locked in ascending id before offers are written. */
 private void startRound(Map<String,Object> o,Long actor){
  long id=n(o,"id"),round=n(o,"dispatch_round")+1;
  var candidates=db.rows("SELECT id FROM users WHERE role='DRIVER' AND enabled=TRUE AND driver_area_code=? AND active_order_id IS NULL ORDER BY id",s(o,"area_code"));
  var free=new ArrayList<Long>();
  for(var candidate:candidates){long driver=n(candidate,"id");var user=db.required("SELECT * FROM users WHERE id=? FOR UPDATE",driver);if(user.get("active_order_id")==null&&bool(user.get("enabled")))free.add(driver);}
  db.update("UPDATE driver_offers SET status='REVOKED',responded_at=UTC_TIMESTAMP(3) WHERE order_id=? AND status='OFFERED'",id);
  var expiry=Timestamp.from(Instant.now().plusSeconds(offerSeconds));
  for(long driver:free)db.insert("driver_offers",m("order_id",id,"driver_id",driver,"round_no",round,"status","OFFERED","expires_at",expiry));
  String delivery=free.isEmpty()?"NO_DRIVER":"FINDING_DRIVER";
  db.update("UPDATE orders SET delivery_status=?,dispatch_round=?,version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",delivery,round,id);
  orders.event(id,actor,"DISPATCH_STARTED",s(o,"delivery_status"),delivery,null);
  o.put("delivery_status",delivery);o.put("dispatch_round",round);o.put("updated_at",now());
 }

 @Transactional(readOnly=true)
 public List<Map<String,Object>> offers(UserPrincipal u){
  u.requireRole("DRIVER");
  return db.rows("SELECT f.id,f.order_id,f.expires_at,o.restaurant_name,o.area_code,o.payment_method,o.total FROM driver_offers f JOIN orders o ON o.id=f.order_id JOIN users u ON u.id=f.driver_id WHERE f.driver_id=? AND u.enabled=TRUE AND u.active_order_id IS NULL AND f.status='OFFERED' AND f.expires_at>UTC_TIMESTAMP(3) AND f.round_no=o.dispatch_round AND o.driver_id IS NULL AND o.status IN ('CONFIRMED','PREPARING','READY_FOR_PICKUP') ORDER BY f.id",u.id()).stream().map(this::offerDto).toList();
 }
 private Map<String,Object> offerDto(Map<String,Object> row){
  return m("id",id(row.get("id")),"orderId",id(row.get("order_id")),"restaurantName",s(row,"restaurant_name"),"areaCode",s(row,"area_code"),"codAmount",s(row,"payment_method").equals("COD")?n(row,"total"):0L,"expiresAt",iso(row.get("expires_at")));
 }

 @Transactional
 public Map<String,Object> offerAction(UserPrincipal u,long offerId,String action){
  u.requireRole("DRIVER");require(Set.of("accept","decline").contains(action),400,"INVALID_ACTION","Thao tác không hợp lệ.");
  // First lookup provides the order id only, never a lock or a private response.
  var reference=db.required("SELECT * FROM driver_offers WHERE id=? AND driver_id=?",offerId,u.id());
  long orderId=n(reference,"order_id");var o=orders.lock(orderId);
  var user=db.required("SELECT * FROM users WHERE id=? FOR UPDATE",u.id());
  var offer=db.required("SELECT * FROM driver_offers WHERE id=? AND driver_id=? FOR UPDATE",offerId,u.id());
  if(action.equals("accept")&&s(offer,"status").equals("ACCEPTED")&&n(o,"driver_id")==u.id())return orders.dto(o,u);
  if(action.equals("decline")&&s(offer,"status").equals("DECLINED"))return declined(offer);
  FulfillmentRules.offer(s(offer,"status"),n(offer,"round_no"),n(o,"dispatch_round"),instant(offer.get("expires_at")),Instant.now());
  OrderPolicy.state(FulfillmentRules.PREPARATION.contains(s(o,"status"))&&o.get("driver_id")==null);
  if(action.equals("decline")){
   db.update("UPDATE driver_offers SET status='DECLINED',responded_at=UTC_TIMESTAMP(3) WHERE id=?",offerId);
   expireOffers(o);offer.put("status","DECLINED");return declined(offer);
  }
  require(user.get("active_order_id")==null&&bool(user.get("enabled")),409,"DRIVER_BUSY","Tài xế đang thực hiện đơn khác.");
  db.update("UPDATE users SET active_order_id=? WHERE id=?",orderId,u.id());
  db.update("UPDATE orders SET driver_id=?,delivery_status='DRIVER_ASSIGNED',assigned_at=UTC_TIMESTAMP(3),version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",u.id(),orderId);
  db.update("UPDATE driver_offers SET status='ACCEPTED',responded_at=UTC_TIMESTAMP(3) WHERE id=?",offerId);
  db.update("UPDATE driver_offers SET status='REVOKED',responded_at=UTC_TIMESTAMP(3) WHERE order_id=? AND status='OFFERED'",orderId);
  orders.event(orderId,u.id(),"DRIVER_ASSIGNED",s(o,"delivery_status"),"DRIVER_ASSIGNED",null);
  o.put("driver_id",u.id());o.put("delivery_status","DRIVER_ASSIGNED");o.put("updated_at",now());return orders.dto(o,u);
 }
 private Map<String,Object> declined(Map<String,Object> offer){return m("id",id(offer.get("id")),"orderId",id(offer.get("order_id")),"status","DECLINED");}

 @Transactional(readOnly=true)
 public List<Map<String,Object>> jobs(UserPrincipal u,String scope){
  u.requireRole("DRIVER");require(Set.of("active","history","all").contains(scope),400,"INVALID_FILTER","Bộ lọc không hợp lệ.");
  return db.rows("SELECT * FROM orders WHERE driver_id=? ORDER BY id DESC",u.id()).stream().filter(o->scope.equals("all")||scope.equals("history")==OrderPolicy.terminal(s(o,"status"))).map(o->orders.dto(o,u)).toList();
 }
 @Transactional
 public Map<String,Object> pickup(UserPrincipal u,long id){
  u.requireRole("DRIVER");var o=orders.visible(u,id,true);
  if(o.get("picked_up_at")!=null)return orders.dto(o,u);
  OrderPolicy.state(s(o,"status").equals("READY_FOR_PICKUP")&&s(o,"delivery_status").equals("DRIVER_ASSIGNED"));
  db.required("SELECT * FROM users WHERE id=? FOR UPDATE",u.id());
  db.update("UPDATE orders SET status='OUT_FOR_DELIVERY',delivery_status='PICKED_UP',picked_up_at=UTC_TIMESTAMP(3),version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",id);
  orders.event(id,u.id(),"PICKED_UP",s(o,"status"),"OUT_FOR_DELIVERY",null);
  o.put("status","OUT_FOR_DELIVERY");o.put("delivery_status","PICKED_UP");o.put("picked_up_at",now());o.put("updated_at",now());return orders.dto(o,u);
 }
 @Transactional
 public Map<String,Object> deliver(UserPrincipal u,long id,boolean codCollected){
  u.requireRole("DRIVER");var o=orders.visible(u,id,true);
  OrderPolicy.cod(s(o,"payment_method"),codCollected);
  if(s(o,"status").equals("DELIVERED"))return orders.dto(o,u);
  OrderPolicy.state(s(o,"status").equals("OUT_FOR_DELIVERY")&&s(o,"delivery_status").equals("PICKED_UP"));
  db.required("SELECT * FROM users WHERE id=? FOR UPDATE",u.id());
  String payment=s(o,"payment_method").equals("COD")?"PAID":s(o,"payment_status");
  db.update("UPDATE orders SET status='DELIVERED',delivery_status='DELIVERED',delivered_at=UTC_TIMESTAMP(3),payment_status=?,paid_at=COALESCE(paid_at,UTC_TIMESTAMP(3)),has_delivery_issue=FALSE,version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",payment,id);
  db.update("UPDATE users SET active_order_id=NULL WHERE id=? AND active_order_id=?",u.id(),id);
  for(var issue:db.rows("SELECT e.id FROM order_events e WHERE e.order_id=? AND e.event_type='DELIVERY_ISSUE' AND NOT EXISTS (SELECT 1 FROM order_events r WHERE r.related_event_id=e.id AND r.event_type='ISSUE_RESOLVED') ORDER BY e.id",id)){
   db.insert("order_events",m("order_id",id,"actor_id",u.id(),"event_type","ISSUE_RESOLVED","related_event_id",n(issue,"id"),"from_status","OUT_FOR_DELIVERY","to_status","DELIVERED"));
  }
  orders.event(id,u.id(),"DELIVERED","OUT_FOR_DELIVERY","DELIVERED",null);
  o.put("status","DELIVERED");o.put("delivery_status","DELIVERED");o.put("payment_status",payment);o.put("has_delivery_issue",false);o.put("delivered_at",now());o.put("updated_at",now());return orders.dto(o,u);
 }
 @Transactional
 public Map<String,Object> issue(UserPrincipal u,long id,String reason,String key){
  u.requireRole("DRIVER");key=uuid(key);reason=reason==null?"":reason.trim();require(!reason.isEmpty()&&reason.length()<=300,400,"INVALID_REASON","Nhập trở ngại 1–300 ký tự.");
  var o=orders.visible(u,id,true);String payloadHash=hash(json(m("orderId",id,"reason",reason)));
  var previous=db.one("SELECT * FROM order_events WHERE actor_id=? AND event_type='DELIVERY_ISSUE' AND client_request_key=?",u.id(),key);
  if(previous!=null){require(payloadHash.equals(s(previous,"payload_hash")),409,"IDEMPOTENCY_CONFLICT","Mã yêu cầu đã dùng cho nội dung khác.");return issueDto(previous);}
  OrderPolicy.state(s(o,"status").equals("OUT_FOR_DELIVERY"));
  var createdAt=Timestamp.from(Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MILLIS));
  long event=db.insert("order_events",m("order_id",id,"actor_id",u.id(),"event_type","DELIVERY_ISSUE","from_status","OUT_FOR_DELIVERY","to_status","OUT_FOR_DELIVERY","reason",reason,"client_request_key",key,"payload_hash",payloadHash,"created_at",createdAt));
  db.update("UPDATE orders SET has_delivery_issue=TRUE,version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",id);
  return issueDto(m("id",event,"order_id",id,"reason",reason,"created_at",createdAt));
 }
 private Map<String,Object> issueDto(Map<String,Object> e){return m("id",id(e.get("id")),"orderId",id(e.get("order_id")),"reason",s(e,"reason"),"createdAt",iso(e.get("created_at")));}

 @Transactional
 public void expire(long id){var o=orders.lock(id);expireOffers(o);}
 private void expireOffers(Map<String,Object> o){
  long id=n(o,"id");
  db.update("UPDATE driver_offers SET status='EXPIRED',responded_at=UTC_TIMESTAMP(3) WHERE order_id=? AND status='OFFERED' AND expires_at<=UTC_TIMESTAMP(3)",id);
  if(o.get("driver_id")!=null||!FulfillmentRules.PREPARATION.contains(s(o,"status"))||!s(o,"delivery_status").equals("FINDING_DRIVER"))return;
  if(db.one("SELECT id FROM driver_offers WHERE order_id=? AND round_no=? AND status='OFFERED' AND expires_at>UTC_TIMESTAMP(3) LIMIT 1 FOR UPDATE",id,n(o,"dispatch_round"))!=null)return;
  db.update("UPDATE orders SET delivery_status='NO_DRIVER',version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",id);
  orders.event(id,null,"NO_DRIVER","FINDING_DRIVER","NO_DRIVER",null);o.put("delivery_status","NO_DRIVER");
 }
}
