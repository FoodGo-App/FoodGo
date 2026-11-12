package fit.iuh.foodgobackend.ordering;

import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.common.*;
import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.cart.CartService;
import fit.iuh.foodgobackend.catalog.PricingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import jakarta.validation.constraints.*;
import java.util.*;
import java.time.Instant;
import java.sql.Timestamp;

@Service @Transactional
public class CheckoutService {
 private final JpaSql db;private final CartService carts;private final PricingService pricing;private final OrderRepository orders;
 private final String walletScenario;private final int quoteSeconds;
 public CheckoutService(JpaSql db,CartService carts,PricingService pricing,OrderRepository orders,@Value("${foodgo.wallet-scenario:SUCCEEDED}") String scenario,@Value("${foodgo.quote-seconds:120}") int seconds){this.db=db;this.carts=carts;this.pricing=pricing;this.orders=orders;require(Set.of("SUCCEEDED","FAILED","CANCELLED","PENDING").contains(scenario),500,"INVALID_CONFIGURATION","Kịch bản ví không hợp lệ.");this.walletScenario=scenario;this.quoteSeconds=seconds;}
 public record QuoteInput(@NotNull @Positive Long addressId,Long offerId,@NotBlank String paymentMethod,@Min(0) long expectedCartVersion){}
 public record AttemptInput(@NotNull @Positive Long quoteId,@Min(0) long expectedCartVersion){}
 public Map<String,Object> quote(UserPrincipal u,QuoteInput in){
  var cart=carts.lock(u);carts.version(cart,in.expectedCartVersion());var payload=pricing.quote(u.id(),cart,in.addressId(),in.offerId(),in.paymentMethod());
  var expiry=Timestamp.from(Instant.now().plusSeconds(quoteSeconds));long id=db.insert("checkout_quotes",m("customer_id",u.id(),"cart_id",cart.get("id"),"cart_version",n(cart,"version"),"payload_json",json(payload),"payload_hash",hash(json(payload)),"expires_at",expiry));
  var dto=new LinkedHashMap<>(payload);dto.put("id",Long.toString(id));dto.put("expiresAt",iso(expiry));return dto;
 }
 public Map<String,Object> get(UserPrincipal u,long id){u.requireRole("CUSTOMER");return dto(db.required("SELECT * FROM checkout_attempts WHERE id=? AND customer_id=?",id,u.id()));}
 public Map<String,Object> byKey(UserPrincipal u,String key){u.requireRole("CUSTOMER");return dto(db.required("SELECT * FROM checkout_attempts WHERE customer_id=? AND request_key=?",u.id(),uuid(key)));}
 @Transactional(readOnly=true)
 public Map<String,Object> current(UserPrincipal u){u.requireRole("CUSTOMER");var attempt=db.one("SELECT * FROM checkout_attempts WHERE customer_id=? AND result='PENDING' ORDER BY id DESC LIMIT 1",u.id());return attempt==null?null:dto(attempt);}
 public Map<String,Object> begin(UserPrincipal u,AttemptInput in,String key){
  u.requireRole("CUSTOMER");key=uuid(key);String requestHash=hash(in.quoteId()+"|"+in.expectedCartVersion());
  var old=db.one("SELECT * FROM checkout_attempts WHERE customer_id=? AND request_key=?",u.id(),key);if(old!=null)return repeat(old,requestHash);
  var quote=db.required("SELECT * FROM checkout_quotes WHERE id=? AND customer_id=? FOR UPDATE",in.quoteId(),u.id());
  var cart=carts.lock(u);
  old=db.one("SELECT * FROM checkout_attempts WHERE customer_id=? AND request_key=? FOR UPDATE",u.id(),key);if(old!=null)return repeat(old,requestHash);
  require(instant(quote.get("expires_at")).isAfter(Instant.now()),409,"QUOTE_EXPIRED","Báo giá đã hết hạn.");
  require(n(quote,"cart_version")==in.expectedCartVersion(),409,"CART_VERSION_CONFLICT","Giỏ đã thay đổi. Hãy kiểm tra lại trước khi đặt.");
  var payload=revalidate(u,quote,cart);
  var pending=db.one("SELECT a.id FROM checkout_attempts a JOIN checkout_quotes q ON q.id=a.quote_id WHERE a.customer_id=? AND q.cart_id=? AND q.cart_version=? AND a.result='PENDING' FOR UPDATE",u.id(),cart.get("id"),cart.get("version"));
  require(pending==null,409,"CHECKOUT_PENDING","Giỏ có một thanh toán đang chờ xử lý.");
  boolean cod=s(payload,"paymentMethod").equals("COD");long id=db.insert("checkout_attempts",m("customer_id",u.id(),"quote_id",in.quoteId(),"request_key",key,"request_hash",requestHash,"method",payload.get("paymentMethod"),"result","PENDING","scenario_code",cod?"SUCCEEDED":walletScenario));
  if(cod)createOrder(u,id,payload,cart);
  return get(u,id);
 }
 private Map<String,Object> repeat(Map<String,Object> old,String hash){require(s(old,"request_hash").equals(hash),409,"IDEMPOTENCY_CONFLICT","Yêu cầu này đã được gửi với nội dung khác. Hãy kiểm tra kết quả trước khi thử lại.");return dto(old);}
 @SuppressWarnings("unchecked") private Map<String,Object> map(Object value){return (Map<String,Object>)value;}
 private Map<String,Object> revalidate(UserPrincipal u,Map<String,Object> q,Map<String,Object> cart){
  require(n(cart,"version")==n(q,"cart_version"),409,"CART_VERSION_CONFLICT","Giỏ đã thay đổi. Hãy tải lại.");var original=object(q.get("payload_json"));var address=map(original.get("address"));var offer=original.get("offer")==null?null:map(original.get("offer"));
  var fresh=pricing.quote(u.id(),cart,n(address,"id"),offer==null?null:n(offer,"id"),s(original,"paymentMethod"));
  require(hash(json(fresh)).equals(s(q,"payload_hash")),409,"QUOTE_CHANGED","Giá, tùy chọn hoặc thông tin nhận hàng đã thay đổi. Hãy lấy báo giá mới.");return original;
 }
 public Map<String,Object> resolve(UserPrincipal u,long id){
  u.requireRole("CUSTOMER");var initial=db.required("SELECT * FROM checkout_attempts WHERE id=? AND customer_id=?",id,u.id());
  var cart=carts.lock(u);var attempt=db.required("SELECT * FROM checkout_attempts WHERE id=? AND customer_id=? FOR UPDATE",id,u.id());if(!s(attempt,"result").equals("PENDING"))return dto(attempt);
  var q=db.required("SELECT * FROM checkout_quotes WHERE id=?",initial.get("quote_id"));Map<String,Object> payload;
  try{payload=revalidate(u,q,cart);}catch(ApiException e){db.update("UPDATE checkout_attempts SET result='CANCELLED',reason_code=?,updated_at=UTC_TIMESTAMP(3) WHERE id=?",e.code,id);var result=get(u,id);result.put("_error",e.code);return result;}
  String scenario=s(attempt,"scenario_code");if(scenario.equals("SUCCEEDED"))createOrder(u,id,payload,cart);
  else if(!scenario.equals("PENDING"))db.update("UPDATE checkout_attempts SET result=?,reason_code=?,updated_at=UTC_TIMESTAMP(3) WHERE id=?",scenario,"WALLET_"+scenario,id);
  return get(u,id);
 }
 public Map<String,Object> cancel(UserPrincipal u,long id){
  u.requireRole("CUSTOMER");db.required("SELECT id FROM checkout_attempts WHERE id=? AND customer_id=?",id,u.id());carts.lock(u);
  var a=db.required("SELECT * FROM checkout_attempts WHERE id=? AND customer_id=? FOR UPDATE",id,u.id());
  if(s(a,"result").equals("PENDING"))db.update("UPDATE checkout_attempts SET result='CANCELLED',reason_code='USER_CANCELLED',updated_at=UTC_TIMESTAMP(3) WHERE id=?",id);
  else require(s(a,"result").equals("CANCELLED"),409,"ATTEMPT_STATE_CONFLICT","Thanh toán không còn chờ để hủy.");return get(u,id);
 }
 private void createOrder(UserPrincipal u,long attemptId,Map<String,Object> p,Map<String,Object> cart){
  var a=map(p.get("address"));boolean wallet=s(p,"paymentMethod").equals("MOCK_WALLET");
  long oid=db.insert("orders",m("customer_id",u.id(),"restaurant_id",p.get("restaurantId"),"restaurant_name",p.get("restaurantName"),"recipient_name",a.get("recipientName"),"recipient_phone",a.get("recipientPhone"),"area_code",a.get("areaCode"),"address_text",a.get("addressText"),"map_point_code",a.get("mapPointCode"),"status","PENDING_CONFIRMATION","payment_method",p.get("paymentMethod"),"payment_status",wallet?"PAID":"UNPAID","paid_at",wallet?now():null,"subtotal",p.get("subtotal"),"delivery_fee",p.get("deliveryFee"),"food_discount",p.get("foodDiscount"),"delivery_discount",p.get("deliveryDiscount"),"total",p.get("total"),"offer_snapshot_json",p.get("offer")==null?null:json(p.get("offer")),"delivery_status","NOT_STARTED"));
  for(var value:(List<?>)p.get("lines")){var l=map(value);db.insert("order_items",m("order_id",oid,"food_id",l.get("foodId"),"food_name",l.get("foodName"),"image_code",l.get("imageCode"),"base_price",l.get("basePrice"),"unit_price",l.get("unitPrice"),"quantity",l.get("quantity"),"line_total",l.get("lineTotal"),"note",l.get("note"),"options_snapshot",json(l.get("optionsSnapshot"))));}
  db.update("UPDATE checkout_attempts SET result='SUCCEEDED',order_id=?,updated_at=UTC_TIMESTAMP(3) WHERE id=?",oid,attemptId);orders.event(oid,u.id(),"ORDER_CREATED",null,"PENDING_CONFIRMATION",null);carts.clear(cart);
 }
 private Map<String,Object> dto(Map<String,Object> a){var quote=db.required("SELECT cart_version FROM checkout_quotes WHERE id=?",a.get("quote_id"));return m("id",id(a.get("id")),"requestKey",a.get("request_key"),"quoteId",id(a.get("quote_id")),"cartVersion",n(quote,"cart_version"),"paymentMethod",a.get("method"),"result",a.get("result"),"orderId",id(a.get("order_id")),"reasonCode",a.get("reason_code"));}
}
