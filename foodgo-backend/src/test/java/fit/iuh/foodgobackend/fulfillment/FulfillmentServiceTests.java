package fit.iuh.foodgobackend.fulfillment;

import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.common.*;
import fit.iuh.foodgobackend.ordering.OrderRepository;
import org.junit.jupiter.api.*;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.*;
import static fit.iuh.foodgobackend.common.Data.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FulfillmentServiceTests {
 JpaSql db=mock(JpaSql.class);
 OrderRepository orders=mock(OrderRepository.class);
 FulfillmentService service;
 UserPrincipal driver=new UserPrincipal(7,"Driver","DRIVER",null,"");
 UserPrincipal restaurant=new UserPrincipal(4,"Restaurant","RESTAURANT",2L,"");
 Map<String,Object> order;
 @BeforeEach void setup(){service=new FulfillmentService(orders,db,30);order=m("id",5L,"status","CONFIRMED","delivery_status","FINDING_DRIVER","dispatch_round",1L,"restaurant_id",2L,"payment_method","COD","area_code","A","driver_id",null);when(db.one(anyString(),any(Object[].class))).thenReturn(null);when(orders.lock(5)).thenReturn(order);when(orders.visible(any(),eq(5L),eq(true))).thenReturn(order);when(orders.dto(any(),any())).thenAnswer(x->x.getArgument(0));}
 @Test void unauthorizedRestaurantCannotChangeOrder(){restaurant=new UserPrincipal(4,"Other","RESTAURANT",3L,"");when(orders.visible(restaurant,5,true)).thenThrow(new ApiException(404,"NOT_FOUND",""));assertThrows(ApiException.class,()->service.restaurantAction(restaurant,5,"prepare",null));verify(db,never()).update(anyString(),any(Object[].class));}
 @Test void acceptingLocksOrderThenDriverThenOfferAndAssignsBothSides(){
  var offer=m("id",10L,"order_id",5L,"driver_id",7L,"round_no",1L,"status","OFFERED","expires_at",Timestamp.from(Instant.now().plusSeconds(30)));
  when(db.required("SELECT * FROM driver_offers WHERE id=? AND driver_id=?",10L,7L)).thenReturn(offer);
  when(db.required("SELECT * FROM users WHERE id=? FOR UPDATE",7L)).thenReturn(m("active_order_id",null,"enabled",true));
  when(db.required("SELECT * FROM driver_offers WHERE id=? AND driver_id=? FOR UPDATE",10L,7L)).thenReturn(offer);
  service.offerAction(driver,10,"accept");
  var sequence=inOrder(orders,db);sequence.verify(orders).lock(5);sequence.verify(db).required("SELECT * FROM users WHERE id=? FOR UPDATE",7L);sequence.verify(db).required("SELECT * FROM driver_offers WHERE id=? AND driver_id=? FOR UPDATE",10L,7L);
  verify(db).update("UPDATE users SET active_order_id=? WHERE id=?",5L,7L);
  assertEquals(7L,order.get("driver_id"));assertEquals("DRIVER_ASSIGNED",order.get("delivery_status"));
 }
 @Test void busyDriverCannotAcceptSecondOrder(){
  var offer=m("id",10L,"order_id",5L,"driver_id",7L,"round_no",1L,"status","OFFERED","expires_at",Timestamp.from(Instant.now().plusSeconds(30)));
  when(db.required("SELECT * FROM driver_offers WHERE id=? AND driver_id=?",10L,7L)).thenReturn(offer);
  when(db.required("SELECT * FROM users WHERE id=? FOR UPDATE",7L)).thenReturn(m("active_order_id",99L,"enabled",true));
  when(db.required("SELECT * FROM driver_offers WHERE id=? AND driver_id=? FOR UPDATE",10L,7L)).thenReturn(offer);
  assertEquals("DRIVER_BUSY",assertThrows(ApiException.class,()->service.offerAction(driver,10,"accept")).code);
 }
 @Test void driverOffersContainNoCustomerFields(){
  when(db.rows(anyString(),eq(7L))).thenReturn(List.of(m("id",10L,"order_id",5L,"restaurant_name","Quán","area_code","A","payment_method","COD","total",50000L,"expires_at",Timestamp.from(Instant.now().plusSeconds(30)),"recipient_name","Secret","recipient_phone","0123456789","address_text","private")));
  var result=service.offers(driver);assertEquals(Set.of("id","orderId","restaurantName","areaCode","codAmount","expiresAt"),result.getFirst().keySet());assertEquals(50000L,result.getFirst().get("codAmount"));
 }
 @Test void deliveryRequiresCodAndReleasesDriverOnlyOnSuccess(){
  order.put("driver_id",7L);order.put("status","OUT_FOR_DELIVERY");order.put("delivery_status","PICKED_UP");
  assertThrows(ApiException.class,()->service.deliver(driver,5,false));verify(db,never()).update(anyString(),any(Object[].class));
  when(db.required("SELECT * FROM users WHERE id=? FOR UPDATE",7L)).thenReturn(m("active_order_id",5L));service.deliver(driver,5,true);
  assertEquals("DELIVERED",order.get("status"));assertEquals("PAID",order.get("payment_status"));verify(db).update("UPDATE users SET active_order_id=NULL WHERE id=? AND active_order_id=?",7L,5L);
 }
 @Test void issueRetryReturnsOriginalEvenAfterDeliveryAndConflictsOnChangedPayload(){
  order.put("status","DELIVERED");order.put("driver_id",7L);
  String key="c386ec68-36a0-4e43-8601-e5fbf997d116";String hash=hash(json(m("orderId",5L,"reason","Delay")));
  when(db.one("SELECT * FROM order_events WHERE actor_id=? AND event_type='DELIVERY_ISSUE' AND client_request_key=?",7L,key)).thenReturn(m("id",9L,"order_id",5L,"reason","Delay","payload_hash",hash,"created_at",Timestamp.from(Instant.now())));
  assertEquals("9",service.issue(driver,5,"Delay",key).get("id"));assertThrows(ApiException.class,()->service.issue(driver,5,"Changed",key));
 }
 @Test void rejectionReturnsRefundedWalletStatus(){
  order.put("status","PENDING_CONFIRMATION");order.put("payment_method","MOCK_WALLET");order.put("payment_status","PAID");
  var result=service.restaurantAction(restaurant,5,"reject","Closed");
  verify(orders).refund(order);assertEquals("REFUNDED",result.get("payment_status"));assertEquals("REJECTED",result.get("status"));
 }
 @Test void restaurantRepeatDoesNotStartAnotherDispatchRound(){
  when(db.one("SELECT id FROM order_events WHERE order_id=? AND actor_id=? AND event_type=?",5L,4L,"RESTAURANT_ACCEPTED")).thenReturn(m("id",8L));
  service.restaurantAction(restaurant,5,"accept",null);verify(db,never()).insert(anyString(),anyMap());
 }
 @Test void retryWithNoCandidatesIncrementsSameOrderRound(){
  var customer=new UserPrincipal(1,"Customer","CUSTOMER",null,"");order.put("delivery_status","NO_DRIVER");
  var result=service.retry(customer,5);assertEquals(5L,result.get("id"));assertEquals(2L,result.get("dispatch_round"));assertEquals("NO_DRIVER",result.get("delivery_status"));
 }
 @Test void expiryWithNoRemainingOffersChangesFindingToNoDriverOnce(){
  service.expire(5);assertEquals("NO_DRIVER",order.get("delivery_status"));service.expire(5);
  verify(orders,times(1)).event(5L,null,"NO_DRIVER","FINDING_DRIVER","NO_DRIVER",null);
 }
 @Test void pickupWaitsForRestaurantReadiness(){
  order.put("driver_id",7L);order.put("delivery_status","DRIVER_ASSIGNED");
  assertThrows(ApiException.class,()->service.pickup(driver,5));order.put("status","READY_FOR_PICKUP");
  service.pickup(driver,5);assertEquals("OUT_FOR_DELIVERY",order.get("status"));assertEquals("PICKED_UP",order.get("delivery_status"));
  service.pickup(driver,5);verify(orders,times(1)).event(5L,7L,"PICKED_UP","READY_FOR_PICKUP","OUT_FOR_DELIVERY",null);
 }
 @Test void expiredOfferCannotAssignEvenBeforeScheduledSweep(){
  var offer=m("id",10L,"order_id",5L,"driver_id",7L,"round_no",1L,"status","OFFERED","expires_at",Timestamp.from(Instant.now().minusSeconds(1)));
  when(db.required("SELECT * FROM driver_offers WHERE id=? AND driver_id=?",10L,7L)).thenReturn(offer);
  when(db.required("SELECT * FROM users WHERE id=? FOR UPDATE",7L)).thenReturn(m("active_order_id",null,"enabled",true));
  when(db.required("SELECT * FROM driver_offers WHERE id=? AND driver_id=? FOR UPDATE",10L,7L)).thenReturn(offer);
  assertEquals("OFFER_EXPIRED",assertThrows(ApiException.class,()->service.offerAction(driver,10,"accept")).code);verify(db,never()).update(anyString(),any(Object[].class));
 }
 @Test void deliveryResolvesEachIssueByRelatedEventWithoutErasingHistory(){
  order.put("status","OUT_FOR_DELIVERY");order.put("delivery_status","PICKED_UP");order.put("driver_id",7L);order.put("has_delivery_issue",true);
  when(db.rows(startsWith("SELECT e.id FROM order_events"),eq(5L))).thenReturn(List.of(m("id",22L),m("id",23L)));
  service.deliver(driver,5,true);
  verify(db).insert("order_events",m("order_id",5L,"actor_id",7L,"event_type","ISSUE_RESOLVED","related_event_id",22L,"from_status","OUT_FOR_DELIVERY","to_status","DELIVERED"));
  verify(db).insert("order_events",m("order_id",5L,"actor_id",7L,"event_type","ISSUE_RESOLVED","related_event_id",23L,"from_status","OUT_FOR_DELIVERY","to_status","DELIVERED"));
  assertEquals(false,order.get("has_delivery_issue"));
 }
}
