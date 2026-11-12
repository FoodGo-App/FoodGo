package fit.iuh.foodgobackend;

import static org.junit.jupiter.api.Assertions.*;
import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.common.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.beans.factory.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.net.*;
import java.net.http.*;
import java.util.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT, properties="foodgo.seed-enabled=false")
@EnabledIfSystemProperty(named="foodgo.integration", matches="true")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class FlowIntegrationTests {
 @Value("${local.server.port}") int port;
 @Autowired JdbcTemplate db;
 @Autowired fit.iuh.foodgobackend.fulfillment.FulfillmentService fulfillment;
 @Autowired fit.iuh.foodgobackend.ordering.CheckoutService checkout;
 final HttpClient http=HttpClient.newHttpClient();
 String customer,other,restaurant,driver,driver2; long address,food,offer; String suffix=UUID.randomUUID().toString().substring(0,8);
 record Reply(int status,Map<String,Object> body){Map<String,Object> data(){return (Map<String,Object>)body.get("data");}}
 Reply request(String token,String method,String path,Object body,String key)throws Exception{
  var b=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1"+path));
  if(token!=null)b.header("Authorization","Bearer "+token);if(key!=null)b.header("Idempotency-Key",key);
  b.header("Content-Type","application/json").method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json(body)));
  var response=http.send(b.build(),HttpResponse.BodyHandlers.ofString());return new Reply(response.statusCode(),object(response.body()));
 }
 long insert(String table,Map<String,Object> values){db.update("INSERT INTO "+table+" ("+String.join(",",values.keySet())+") VALUES ("+String.join(",",Collections.nCopies(values.size(),"?"))+")",values.values().toArray());return db.queryForObject("SELECT MAX(id) FROM "+table,Long.class);}
 long user(String name,String role,Long rest){return insert("users",m("username",name+suffix,"display_name",name,"role",role,"restaurant_id",rest,"driver_area_code",role.equals("DRIVER")?"IT_"+suffix:null,"password_hash",new BCryptPasswordEncoder().encode("TestOnly@123")));}
 String login(String name)throws Exception{var r=request(null,"POST","/auth/login",m("username",name+suffix,"password","TestOnly@123"),null);assertEquals(200,r.status(),r.body().toString());return s(r.data(),"token");}
 @BeforeAll void fixtures()throws Exception{
  assertTrue(db.queryForObject("SELECT DATABASE()",String.class).startsWith("fooddriver_it_"),"Integration tests require a dedicated fooddriver_it_* database");
  long cat=insert("categories",m("name","IT-"+suffix));long rest=insert("restaurants",m("name","IT Panda","area_code","IT_"+suffix,"address_text","Quán mẫu","map_point_code","RESTAURANT_A","image_code","COM_GA","sample_reviews_json","[]"));
  long c=user("customer","CUSTOMER",null);user("other","CUSTOMER",null);user("restaurant","RESTAURANT",rest);user("driver","DRIVER",null);user("driver2","DRIVER",null);
  address=insert("addresses",m("customer_id",c,"recipient_name","Khách","recipient_phone","0900000000","area_code","IT_"+suffix,"address_text","Nhà mẫu","label","Nhà","map_point_code","CUSTOMER_A"));
  food=insert("foods",m("restaurant_id",rest,"category_id",cat,"name","Cơm mẫu","description","Test","base_price",70000,"image_code","COM_GA"));
  offer=insert("offers",m("code","IT10-"+suffix,"name","Giảm 10%","kind","PERCENT","percent",10,"cap",30000,"min_subtotal",100000,"starts_at",java.sql.Timestamp.valueOf("2020-01-01 00:00:00"),"ends_at",java.sql.Timestamp.valueOf("2035-01-01 00:00:00")));
  customer=login("customer");other=login("other");restaurant=login("restaurant");driver=login("driver");driver2=login("driver2");
 }
 Map<String,Object> quote(String method)throws Exception{
  var cart=request(customer,"GET","/cart",null,null);assertEquals(200,cart.status(),cart.body().toString());
  long version=n(cart.data(),"version");request(customer,"DELETE","/cart?expectedVersion="+version,null,null);
  cart=request(customer,"GET","/cart",null,null);version=n(cart.data(),"version");
  var add=request(customer,"POST","/cart/items",m("foodId",food,"quantity",2,"optionValueIds",List.of(),"replaceRestaurant",false,"expectedVersion",version),null);assertEquals(200,add.status(),add.body().toString());
  var q=request(customer,"POST","/checkout/quotes",m("addressId",address,"offerId",offer,"paymentMethod",method,"expectedCartVersion",n(add.data(),"version")),null);assertEquals(200,q.status(),q.body().toString());assertEquals(141000,n(q.data(),"total"));return q.data();
 }
 Map<String,Object> attempt(Map<String,Object> q,String key)throws Exception{var r=request(customer,"POST","/checkout/attempts",m("quoteId",q.get("id"),"expectedCartVersion",q.get("cartVersion")),key);assertTrue(r.status()==200||r.status()==201||r.status()==202,r.body().toString());return r.data();}
 String codOrder()throws Exception{return s(attempt(quote("COD"),UUID.randomUUID().toString()),"orderId");}
 @Test void codFullLifecycleChatReviewAndOwnership()throws Exception{
  var q=quote("COD");String key=UUID.randomUUID().toString();var a=attempt(q,key);assertEquals("SUCCEEDED",s(a,"result"));assertEquals(a.get("id"),attempt(q,key).get("id"));String id=s(a,"orderId");
  assertEquals(404,request(other,"GET","/orders/"+id,null,null).status());
  assertEquals(200,request(restaurant,"POST","/restaurant/orders/"+id+"/accept",m(),null).status());
  var offers=request(driver,"GET","/driver/offers",null,null);var rows=(List<Map<String,Object>>)offers.body().get("data");assertFalse(rows.isEmpty());var incoming=rows.stream().filter(x->s(x,"orderId").equals(id)).findFirst().orElseThrow();assertFalse(incoming.containsKey("recipientPhone"));
  assertEquals(200,request(driver,"POST","/driver/offers/"+incoming.get("id")+"/accept",m(),null).status());
  assertEquals(409,request(customer,"POST","/orders/"+id+"/cancel",m("reason","Hủy trễ"),null).status());
  String msgKey=UUID.randomUUID().toString();var msg=m("clientMessageId",msgKey,"kind","TEXT","text","Giao giúp mình nhé");var sent=request(customer,"POST","/orders/"+id+"/messages",msg,null);assertEquals(200,sent.status(),sent.body().toString());
  assertEquals(sent.data().get("id"),request(customer,"POST","/orders/"+id+"/messages",msg,null).data().get("id"));
  assertEquals(200,request(customer,"GET","/orders/"+id+"/messages?afterId=0",null,null).status());
  assertEquals(409,request(customer,"POST","/orders/"+id+"/messages",m("clientMessageId",msgKey,"kind","TEXT","text","Khác nội dung"),null).status());
  assertEquals(200,request(customer,"POST","/orders/"+id+"/call-access",m(),null).status());
  assertEquals(409,request(driver,"POST","/driver/orders/"+id+"/pickup",m(),null).status());
  assertEquals(200,request(restaurant,"POST","/restaurant/orders/"+id+"/prepare",m(),null).status());assertEquals(200,request(restaurant,"POST","/restaurant/orders/"+id+"/ready",m(),null).status());
  assertEquals(200,request(driver,"POST","/driver/orders/"+id+"/pickup",m(),null).status());
  assertEquals(400,request(driver,"POST","/driver/orders/"+id+"/deliver",m("codCollected",false),null).status());
  String issueKey=UUID.randomUUID().toString();assertEquals(200,request(driver,"POST","/driver/orders/"+id+"/issues",m("reason","Khách chưa nghe máy"),issueKey).status());
  assertEquals(200,request(driver,"POST","/driver/orders/"+id+"/deliver",m("codCollected",true),null).status());
  var finished=request(customer,"GET","/orders/"+id,null,null);assertEquals("DELIVERED",finished.data().get("status"));assertEquals("PAID",finished.data().get("paymentStatus"));
  assertEquals(200,request(customer,"POST","/orders/"+id+"/messages",msg,null).status());assertEquals(409,request(customer,"POST","/orders/"+id+"/messages",m("clientMessageId",UUID.randomUUID().toString(),"kind","TEXT","text","Tin mới"),null).status());
  var review=m("stars",5,"tags",List.of("FRIENDLY"),"note","Tốt");assertEquals(200,request(customer,"POST","/orders/"+id+"/driver-review",review,null).status());assertEquals(200,request(customer,"POST","/orders/"+id+"/driver-review",review,null).status());assertEquals(409,request(customer,"POST","/orders/"+id+"/driver-review",m("stars",4,"tags",List.of(),"note","Đổi"),null).status());
 }
 @Test void walletPendingResolveAndRefund()throws Exception{
  var a=attempt(quote("MOCK_WALLET"),UUID.randomUUID().toString());assertEquals("PENDING",a.get("result"));String aid=s(a,"id");var resolved=request(customer,"POST","/checkout/attempts/"+aid+"/resolve",m(),null);assertEquals(200,resolved.status(),resolved.body().toString());String id=s(resolved.data(),"orderId");assertFalse(id.isEmpty());assertEquals(200,request(customer,"POST","/orders/"+id+"/cancel",m("reason","Đổi ý"),null).status());assertEquals("REFUNDED",request(customer,"GET","/checkout/attempts/"+aid,null,null).data().get("result"));
 }
 @Test void changedCartRejectsQuoteAndPendingCancelPreservesCart()throws Exception{
  var q=quote("COD");long version=n(q,"cartVersion");request(customer,"POST","/cart/items",m("foodId",food,"quantity",1,"optionValueIds",List.of(),"replaceRestaurant",false,"expectedVersion",version),null);
  assertEquals(409,request(customer,"POST","/checkout/attempts",m("quoteId",q.get("id"),"expectedCartVersion",version),UUID.randomUUID().toString()).status());
  var a=attempt(quote("MOCK_WALLET"),UUID.randomUUID().toString());assertEquals(200,request(customer,"POST","/checkout/attempts/"+a.get("id")+"/cancel",m(),null).status());assertFalse(((List<?>)request(customer,"GET","/cart",null,null).data().get("items")).isEmpty());
 }
 @Test void pendingRevalidationCancelsPersistentlyAndOldQuoteExpiryIsIgnored()throws Exception{
  var q=quote("MOCK_WALLET");var a=attempt(q,UUID.randomUUID().toString());
  db.update("UPDATE checkout_quotes SET expires_at=DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 MINUTE) WHERE id=?",q.get("id"));
  var success=request(customer,"POST","/checkout/attempts/"+a.get("id")+"/resolve",m(),null);assertEquals(200,success.status(),success.body().toString());assertEquals("SUCCEEDED",success.data().get("result"));
  request(customer,"POST","/orders/"+success.data().get("orderId")+"/cancel",m("reason","Kiểm thử"),null);
  q=quote("MOCK_WALLET");a=attempt(q,UUID.randomUUID().toString());
  var changed=request(customer,"POST","/cart/items",m("foodId",food,"quantity",1,"optionValueIds",List.of(),"replaceRestaurant",false,"expectedVersion",q.get("cartVersion")),null);assertEquals(200,changed.status());
  var refused=request(customer,"POST","/checkout/attempts/"+a.get("id")+"/resolve",m(),null);assertEquals(409,refused.status(),refused.body().toString());assertEquals("CANCELLED",request(customer,"GET","/checkout/attempts/"+a.get("id"),null,null).data().get("result"));
 }
 @Test void walletFailurePreservesCartAndIsStable()throws Exception{
  var a=attempt(quote("MOCK_WALLET"),UUID.randomUUID().toString());db.update("UPDATE checkout_attempts SET scenario_code='FAILED' WHERE id=?",a.get("id"));
  for(int i=0;i<2;i++)assertEquals("FAILED",request(customer,"POST","/checkout/attempts/"+a.get("id")+"/resolve",m(),null).data().get("result"));assertFalse(((List<?>)request(customer,"GET","/cart",null,null).data().get("items")).isEmpty());
 }
 @Test void expiredDispatchRetriesSameOrderAndRejectsOldRound()throws Exception{
  String id=codOrder();assertEquals(200,request(restaurant,"POST","/restaurant/orders/"+id+"/accept",m(),null).status());
  long old=db.queryForObject("SELECT MIN(id) FROM driver_offers WHERE order_id=?",Long.class,id);
  db.update("UPDATE driver_offers SET expires_at=DATE_SUB(UTC_TIMESTAMP(3), INTERVAL 1 MINUTE) WHERE order_id=?",id);fulfillment.expire(Long.parseLong(id));
  assertEquals("NO_DRIVER",request(customer,"GET","/orders/"+id,null,null).data().get("deliveryStatus"));
  var retry=request(customer,"POST","/orders/"+id+"/dispatch-retries",m(),null);assertEquals(200,retry.status(),retry.body().toString());assertEquals(id,retry.data().get("id"));assertEquals(2,n(retry.data(),"dispatchRound"));
  assertEquals(409,request(driver,"POST","/driver/offers/"+old+"/accept",m(),null).status());
 }
 @Test void concurrentCheckoutAndDriverAcceptanceCreateSingleWinners()throws Exception{
  var q=quote("COD");String key=UUID.randomUUID().toString();var body=m("quoteId",q.get("id"),"expectedCartVersion",q.get("cartVersion"));
  try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){
   var me=request(customer,"GET","/auth/me",null,null).data();var principal=new fit.iuh.foodgobackend.account.UserPrincipal(n(me,"id"),"Khách","CUSTOMER",null,null);var input=new fit.iuh.foodgobackend.ordering.CheckoutService.AttemptInput(n(q,"id"),n(q,"cartVersion"));
   var first=pool.submit(()->checkout.begin(principal,input,key));var second=pool.submit(()->checkout.begin(principal,input,key));var r1=first.get();var r2=second.get();assertEquals(r1.get("orderId"),r2.get("orderId"));String id=s(r1,"orderId");
   assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM checkout_attempts WHERE request_key=?",Integer.class,key));
   request(restaurant,"POST","/restaurant/orders/"+id+"/accept",m(),null);
   var offers1=(List<Map<String,Object>>)request(driver,"GET","/driver/offers",null,null).body().get("data");var offers2=(List<Map<String,Object>>)request(driver2,"GET","/driver/offers",null,null).body().get("data");
   String f1=s(offers1.stream().filter(x->s(x,"orderId").equals(id)).findFirst().orElseThrow(),"id");String f2=s(offers2.stream().filter(x->s(x,"orderId").equals(id)).findFirst().orElseThrow(),"id");
   var p1=pool.submit(()->request(driver,"POST","/driver/offers/"+f1+"/accept",m(),null));var p2=pool.submit(()->request(driver2,"POST","/driver/offers/"+f2+"/accept",m(),null));var a1=p1.get();var a2=p2.get();assertEquals(Set.of(200,409),new HashSet<>(List.of(a1.status(),a2.status())));String winner=a1.status()==200?driver:driver2;
   request(restaurant,"POST","/restaurant/orders/"+id+"/prepare",m(),null);request(restaurant,"POST","/restaurant/orders/"+id+"/ready",m(),null);assertEquals(200,request(winner,"POST","/driver/orders/"+id+"/pickup",m(),null).status());assertEquals(200,request(winner,"POST","/driver/orders/"+id+"/deliver",m("codCollected",true),null).status());
  }
 }
 @Test void concurrentDeclinesEndDispatch()throws Exception{
  String id=codOrder();assertEquals(200,request(restaurant,"POST","/restaurant/orders/"+id+"/accept",m(),null).status());
  var offerRows=db.queryForList("SELECT f.id,u.username FROM driver_offers f JOIN users u ON u.id=f.driver_id WHERE order_id=? ORDER BY id",id);assertEquals(2,offerRows.size());
  String f1=offerRows.stream().filter(x->s(x,"username").equals("driver"+suffix)).map(x->s(x,"id")).findFirst().orElseThrow();String f2=offerRows.stream().filter(x->s(x,"username").equals("driver2"+suffix)).map(x->s(x,"id")).findFirst().orElseThrow();
  try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){var a=pool.submit(()->request(driver,"POST","/driver/offers/"+f1+"/decline",m(),null));var b=pool.submit(()->request(driver2,"POST","/driver/offers/"+f2+"/decline",m(),null));assertEquals(200,a.get().status());assertEquals(200,b.get().status());}
  assertEquals("NO_DRIVER",request(customer,"GET","/orders/"+id,null,null).data().get("deliveryStatus"));
 }
 @Test void invalidCartRemainsReadableAndOtherLinesCanBeMutated()throws Exception{
  var q=quote("COD");long rest=db.queryForObject("SELECT restaurant_id FROM foods WHERE id=?",Long.class,food);long cat=db.queryForObject("SELECT category_id FROM foods WHERE id=?",Long.class,food);
  long second=insert("foods",m("restaurant_id",rest,"category_id",cat,"name","Món sửa được","description","Món kiểm thử","base_price",10000,"image_code","COM_GA"));
  db.update("UPDATE foods SET available=FALSE WHERE id=?",food);
  try{
   var cart=request(customer,"GET","/cart",null,null);assertEquals(200,cart.status(),cart.body().toString());assertEquals(n(q,"cartVersion"),n(cart.data(),"version"));
   var invalid=((List<Map<String,Object>>)cart.data().get("items")).getFirst();assertEquals(false,invalid.get("available"));assertFalse(s(invalid,"validationMessage").isBlank());assertEquals(2,n(invalid,"quantity"));
   var add=request(customer,"POST","/cart/items",m("foodId",second,"quantity",1,"optionValueIds",List.of(),"expectedVersion",cart.data().get("version")),null);assertEquals(200,add.status(),add.body().toString());
   var rows=(List<Map<String,Object>>)add.data().get("items");var valid=rows.stream().filter(x->n(x,"foodId")==second).findFirst().orElseThrow();assertEquals(true,valid.get("available"));
   var removed=request(customer,"DELETE","/cart/items/"+valid.get("id")+"?expectedVersion="+add.data().get("version"),null,null);assertEquals(200,removed.status(),removed.body().toString());
   assertEquals(409,request(customer,"POST","/checkout/quotes",m("addressId",address,"paymentMethod","COD","expectedCartVersion",removed.data().get("version")),null).status());
   assertEquals(200,request(customer,"DELETE","/cart/items/"+invalid.get("id")+"?expectedVersion="+removed.data().get("version"),null,null).status());
  }finally{db.update("UPDATE foods SET available=TRUE WHERE id=?",food);}
 }
 @Test void strictIntegralJsonRejectsFractionsOverflowAndAcceptsStringIds()throws Exception{
  var q=quote("COD");
  for(Object bad:List.of(1.5,1e30,new java.math.BigInteger("9223372036854775808"))){
   for(String field:List.of("quantity","foodId","expectedVersion")){
    var body=m("foodId",Long.toString(food),"quantity",1,"optionValueIds",List.of(),"expectedVersion",q.get("cartVersion"));body.put(field,bad);
    assertEquals(400,request(customer,"POST","/cart/items",body,null).status(),field+"="+bad);
   }
   for(String field:List.of("quoteId","expectedCartVersion")){var body=m("quoteId",q.get("id"),"expectedCartVersion",q.get("cartVersion"));body.put(field,bad);assertEquals(400,request(customer,"POST","/checkout/attempts",body,UUID.randomUUID().toString()).status());}
   assertEquals(400,request(customer,"POST","/cart/items",m("foodId",food,"quantity",1,"optionValueIds",List.of(bad),"expectedVersion",q.get("cartVersion")),null).status());
  }
  var valid=request(customer,"POST","/cart/items",m("foodId",Long.toString(food),"quantity",1,"optionValueIds",List.of(),"expectedVersion",q.get("cartVersion")),null);assertEquals(200,valid.status(),valid.body().toString());
 }
 @Test void currentPendingIsCustomerScopedLatestAndReadOnly()throws Exception{
  var q=quote("MOCK_WALLET");String key=UUID.randomUUID().toString();var response=request(customer,"POST","/checkout/attempts",m("quoteId",q.get("id"),"expectedCartVersion",q.get("cartVersion")),key);assertTrue(response.status()>=200&&response.status()<300,response.body().toString());var a=response.data();
  var current=request(customer,"GET","/checkout/attempts/current",null,null);assertEquals(200,current.status(),current.body().toString());assertEquals(a.get("id"),current.data().get("id"));assertEquals(q.get("id"),current.data().get("quoteId"));assertEquals(n(q,"cartVersion"),n(current.data(),"cartVersion"));assertEquals("MOCK_WALLET",current.data().get("paymentMethod"));
  assertNull(request(other,"GET","/checkout/attempts/current",null,null).body().get("data"));assertEquals(403,request(driver,"GET","/checkout/attempts/current",null,null).status());assertEquals("PENDING",request(customer,"GET","/checkout/attempts/"+a.get("id"),null,null).data().get("result"));
  assertEquals(404,request(other,"POST","/checkout/attempts/"+a.get("id")+"/resolve",m(),null).status());assertEquals(404,request(other,"POST","/checkout/attempts/"+a.get("id")+"/cancel",m(),null).status());
  var duplicate=request(customer,"POST","/checkout/attempts",m("quoteId",q.get("id"),"expectedCartVersion",q.get("cartVersion")),UUID.randomUUID().toString());assertEquals(409,duplicate.status());assertEquals("CHECKOUT_PENDING",((Map<?,?>)duplicate.body().get("error")).get("code"));
  var newer=attempt(quote("MOCK_WALLET"),UUID.randomUUID().toString());assertEquals(newer.get("id"),request(customer,"GET","/checkout/attempts/current",null,null).data().get("id"));
  request(customer,"POST","/checkout/attempts/"+newer.get("id")+"/cancel",m(),null);assertEquals(a.get("id"),request(customer,"GET","/checkout/attempts/current",null,null).data().get("id"));request(customer,"POST","/checkout/attempts/"+a.get("id")+"/cancel",m(),null);
 }
 @Test void pendingWalletActionsReturnAccepted202()throws Exception{
  var q=quote("MOCK_WALLET");var r=request(customer,"POST","/checkout/attempts",m("quoteId",q.get("id"),"expectedCartVersion",q.get("cartVersion")),UUID.randomUUID().toString());
  try{assertEquals(202,r.status());db.update("UPDATE checkout_attempts SET scenario_code='PENDING' WHERE id=?",r.data().get("id"));assertEquals(202,request(customer,"POST","/checkout/attempts/"+r.data().get("id")+"/resolve",m(),null).status());}
  finally{request(customer,"POST","/checkout/attempts/"+r.data().get("id")+"/cancel",m(),null);}
 }
 @Test void differentCheckoutKeysOnSameCartHaveOneHttpWinner()throws Exception{
  var q=quote("COD");var body=m("quoteId",q.get("id"),"expectedCartVersion",q.get("cartVersion"));
  try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){
   var a=pool.submit(()->request(customer,"POST","/checkout/attempts",body,UUID.randomUUID().toString()));var b=pool.submit(()->request(customer,"POST","/checkout/attempts",body,UUID.randomUUID().toString()));
   var ra=a.get();var rb=b.get();assertTrue((ra.status()==200||ra.status()==201)&&rb.status()==409||(rb.status()==200||rb.status()==201)&&ra.status()==409,ra+" / "+rb);
  }
  assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM checkout_attempts WHERE quote_id=? AND result='SUCCEEDED'",Integer.class,q.get("id")));
 }
 @Test void pendingChangesCancelWithoutCreatingOrderAndKeepCart()throws Exception{
  for(String change:List.of("price","option","address","offer")){
   var q=quote("MOCK_WALLET");var a=attempt(q,UUID.randomUUID().toString());
   Long group=null;
   switch(change){
    case "price"->db.update("UPDATE foods SET base_price=base_price+1 WHERE id=?",food);
    case "option"->group=insert("option_groups",m("food_id",food,"name","Bắt buộc mới","min_select",1,"max_select",1));
    case "address"->db.update("UPDATE addresses SET address_text='Địa chỉ mới' WHERE id=?",address);
    case "offer"->db.update("UPDATE offers SET enabled=FALSE WHERE id=?",offer);
   }
   try{
    var r=request(customer,"POST","/checkout/attempts/"+a.get("id")+"/resolve",m(),null);assertEquals(409,r.status(),change+": "+r.body());
    var stored=request(customer,"GET","/checkout/attempts/"+a.get("id"),null,null).data();assertEquals("CANCELLED",stored.get("result"));assertNull(stored.get("orderId"));
    var cart=request(customer,"GET","/cart",null,null);assertEquals(200,cart.status());assertEquals(n(q,"cartVersion"),n(cart.data(),"version"));assertFalse(((List<?>)cart.data().get("items")).isEmpty());
   }finally{
    switch(change){case "price"->db.update("UPDATE foods SET base_price=70000 WHERE id=?",food);case "option"->db.update("DELETE FROM option_groups WHERE id=?",group);case "address"->db.update("UPDATE addresses SET address_text='Nhà mẫu' WHERE id=?",address);case "offer"->db.update("UPDATE offers SET enabled=TRUE WHERE id=?",offer);}
   }
  }
 }
 @Test void unavailableOptionAndChangedSelectionLimitsAreReadable()throws Exception{
  var q=quote("COD");long group=insert("option_groups",m("food_id",food,"name","Thêm","min_select",0,"max_select",1));long value=insert("option_values",m("group_id",group,"name","Trứng","extra_price",5000));
  var cart=request(customer,"GET","/cart",null,null).data();var added=request(customer,"POST","/cart/items",m("foodId",food,"quantity",1,"optionValueIds",List.of(Long.toString(value)),"expectedVersion",cart.get("version")),null);assertEquals(200,added.status(),added.body().toString());
  try{
   db.update("UPDATE option_values SET available=FALSE WHERE id=?",value);var r=request(customer,"GET","/cart",null,null);assertEquals(200,r.status());var rows=(List<Map<String,Object>>)r.data().get("items");assertEquals(2,rows.size());assertEquals(false,rows.stream().filter(x->((List<?>)x.get("optionValueIds")).contains(Long.toString(value))).findFirst().orElseThrow().get("available"));
   db.update("UPDATE option_values SET available=TRUE WHERE id=?",value);db.update("UPDATE option_groups SET min_select=1 WHERE id=?",group);r=request(customer,"GET","/cart",null,null);assertEquals(200,r.status());rows=(List<Map<String,Object>>)r.data().get("items");assertEquals(false,rows.stream().filter(x->((List<?>)x.get("optionValueIds")).isEmpty()).findFirst().orElseThrow().get("available"));assertEquals(true,rows.stream().filter(x->!((List<?>)x.get("optionValueIds")).isEmpty()).findFirst().orElseThrow().get("available"));
  }finally{cart=request(customer,"GET","/cart",null,null).data();request(customer,"DELETE","/cart?expectedVersion="+cart.get("version"),null,null);db.update("DELETE FROM option_values WHERE id=?",value);db.update("DELETE FROM option_groups WHERE id=?",group);}
 }
 @Test void orderItemWriteFailureRollsBackWholeCheckout()throws Exception{
  var q=quote("COD");String key=UUID.randomUUID().toString();String trigger="it_fail_items_"+suffix;long count=db.queryForObject("SELECT COUNT(*) FROM orders",Long.class);
  db.execute("CREATE TRIGGER "+trigger+" BEFORE INSERT ON order_items FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='forced integration failure'");
  try{
   var r=request(customer,"POST","/checkout/attempts",m("quoteId",q.get("id"),"expectedCartVersion",q.get("cartVersion")),key);assertTrue(r.status()>=400,r.body().toString());
   assertEquals(count,db.queryForObject("SELECT COUNT(*) FROM orders",Long.class));assertEquals(0,db.queryForObject("SELECT COUNT(*) FROM checkout_attempts WHERE request_key=?",Integer.class,key));assertEquals(n(q,"cartVersion"),n(request(customer,"GET","/cart",null,null).data(),"version"));
  }finally{db.execute("DROP TRIGGER "+trigger);}
  assertEquals("SUCCEEDED",attempt(q,key).get("result"));
 }
 @Test void cancelVersusRestaurantAcceptHasOneLegalTransition()throws Exception{
  String id=codOrder();
  try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){
   var a=pool.submit(()->request(customer,"POST","/orders/"+id+"/cancel",m("reason","Đổi ý"),null));var b=pool.submit(()->request(restaurant,"POST","/restaurant/orders/"+id+"/accept",m(),null));var ra=a.get();var rb=b.get();assertEquals(Set.of(200,409),new HashSet<>(List.of(ra.status(),rb.status())));
   assertEquals(ra.status()==200?"CANCELLED":"CONFIRMED",request(customer,"GET","/orders/"+id,null,null).data().get("status"));
  }
 }
 @Test void oneDriverCannotAcceptTwoOrdersConcurrently()throws Exception{
  String first=codOrder(),second=codOrder();request(restaurant,"POST","/restaurant/orders/"+first+"/accept",m(),null);request(restaurant,"POST","/restaurant/orders/"+second+"/accept",m(),null);
  long d=db.queryForObject("SELECT id FROM users WHERE username=?",Long.class,"driver"+suffix);long f1=db.queryForObject("SELECT id FROM driver_offers WHERE order_id=? AND driver_id=?",Long.class,first,d),f2=db.queryForObject("SELECT id FROM driver_offers WHERE order_id=? AND driver_id=?",Long.class,second,d);
  try(var pool=java.util.concurrent.Executors.newFixedThreadPool(2)){
   var a=pool.submit(()->request(driver,"POST","/driver/offers/"+f1+"/accept",m(),null));var b=pool.submit(()->request(driver,"POST","/driver/offers/"+f2+"/accept",m(),null));var ra=a.get();var rb=b.get();assertEquals(Set.of(200,409),new HashSet<>(List.of(ra.status(),rb.status())));
   String winner=ra.status()==200?first:second;assertEquals(Long.parseLong(winner),db.queryForObject("SELECT active_order_id FROM users WHERE id=?",Long.class,d));assertEquals(1,db.queryForObject("SELECT COUNT(*) FROM orders WHERE id IN (?,?) AND driver_id=?",Integer.class,first,second,d));
   request(restaurant,"POST","/restaurant/orders/"+winner+"/prepare",m(),null);request(restaurant,"POST","/restaurant/orders/"+winner+"/ready",m(),null);request(driver,"POST","/driver/orders/"+winner+"/pickup",m(),null);assertEquals(200,request(driver,"POST","/driver/orders/"+winner+"/deliver",m("codCollected",true),null).status());
  }
 }
 @Test void emptyCartAndMissingKeyAreClientErrors()throws Exception{
  var c=request(customer,"GET","/cart",null,null).data();assertEquals(200,request(customer,"DELETE","/cart?expectedVersion="+c.get("version"),null,null).status());c=request(customer,"GET","/cart",null,null).data();
  var q=request(customer,"POST","/checkout/quotes",m("addressId",address,"paymentMethod","COD","expectedCartVersion",c.get("version")),null);assertEquals(400,q.status());assertEquals("EMPTY_CART",((Map<?,?>)q.body().get("error")).get("code"));
  assertEquals(400,request(customer,"POST","/checkout/attempts",m("quoteId",1,"expectedCartVersion",0),null).status());
 }
 @Test void justExpiredQuoteCannotCreateOrder()throws Exception{var q=quote("COD");db.update("UPDATE checkout_quotes SET expires_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 SECOND) WHERE id=?",q.get("id"));var r=request(customer,"POST","/checkout/attempts",m("quoteId",q.get("id"),"expectedCartVersion",q.get("cartVersion")),UUID.randomUUID().toString());assertEquals(409,r.status(),r.body().toString());assertEquals("QUOTE_EXPIRED",((Map<?,?>)r.body().get("error")).get("code"));}
}
