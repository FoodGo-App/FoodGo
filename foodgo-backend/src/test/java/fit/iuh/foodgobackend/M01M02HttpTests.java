package fit.iuh.foodgobackend;
import fit.iuh.foodgobackend.support.*;
import fit.iuh.foodgobackend.common.*;
import static fit.iuh.foodgobackend.common.Data.*;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;
import java.net.*;import java.net.http.*;import java.util.*;
@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties="spring.config.location=classpath:/application-m01-test.properties")
@ActiveProfiles("m01-test") @ContextConfiguration(initializers=M01TestDatabaseInitializer.class)
class M01M02HttpTests {
 @LocalServerPort int port;@Autowired JpaSql db;@Autowired TransactionTemplate tx;
 final HttpClient client=HttpClient.newHttpClient();M01M02TestData.Fixture f;String token,other;
 @BeforeEach void setup(){f=tx.execute(t->M01M02TestData.create(db));token=login(f.username());other=login(f.otherUsername());}
 HttpResponse<String> call(String path,String method,Object body,String bearer){try{var b=HttpRequest.newBuilder(URI.create("http://127.0.0.1:"+port+"/api/v1"+path)).header("Content-Type","application/json");if(bearer!=null)b.header("Authorization","Bearer "+bearer);b.method(method,body==null?HttpRequest.BodyPublishers.noBody():HttpRequest.BodyPublishers.ofString(json(body)));return client.send(b.build(),HttpResponse.BodyHandlers.ofString());}catch(Exception e){throw new IllegalStateException("Test HTTP request failed",e);}}
 Map<String,Object> data(HttpResponse<String> r){return (Map<String,Object>)object(r.body()).get("data");}
 String login(String name){var r=call("/auth/login","POST",m("username",name,"password",M01M02TestData.PASSWORD),null);assertEquals(200,r.statusCode());return s(data(r),"token");}
 Map<String,Object> address(){return m("recipientName","Test","recipientPhone","0900000000","addressText","Before","label","Nhà","areaCode","AREA_A","mapPointCode","CUSTOMER_A");}
 Map<String,Object> line(long food,long option,long version,boolean replace){return m("foodId",food,"optionValueIds",option==0?List.of():List.of(option),"quantity",2,"note","test","expectedVersion",version,"replaceRestaurant",replace);}
 @Test void addressCrudValidationLimitAndOwnership(){String id="";for(int i=0;i<10;i++){var r=call("/addresses","POST",address(),token);assertEquals(201,r.statusCode());id=s(data(r),"id");}assertEquals(409,call("/addresses","POST",address(),token).statusCode());assertEquals(404,call("/addresses/"+id,"PUT",address(),other).statusCode());assertEquals(404,call("/addresses/"+id,"DELETE",null,other).statusCode());var invalid=address();invalid.put("recipientPhone","123");var bad=call("/addresses/"+id,"PUT",invalid,token);assertEquals(400,bad.statusCode());assertEquals("VALIDATION_ERROR",((Map<?,?>)object(bad.body()).get("error")).get("code"));assertEquals(200,call("/addresses/"+id,"PUT",address(),token).statusCode());assertEquals(200,call("/addresses/"+id,"DELETE",null,token).statusCode());}
 @Test void catalogFiltersPaginationAndDetails(){assertEquals(200,call("/catalog/home?areaCode=AREA_A","GET",null,null).statusCode());assertEquals(200,call("/catalog/categories","GET",null,null).statusCode());assertEquals(200,call("/catalog/restaurants/"+f.restaurant(),"GET",null,null).statusCode());var r=call("/catalog/foods?restaurantId="+f.restaurant()+"&size=1&sort=price","GET",null,null);assertEquals(200,r.statusCode());assertEquals(1,((List<?>)object(r.body()).get("data")).size());assertEquals(400,call("/catalog/foods?sort=evil","GET",null,null).statusCode());assertEquals(200,call("/catalog/foods/"+f.food(),"GET",null,null).statusCode());assertEquals(200,call("/catalog/offers?restaurantId="+f.restaurant(),"GET",null,null).statusCode());}
 @Test void favoriteIsIdempotentPrivateAndRoleChecked(){String path="/favorites/FOOD/"+f.food();assertEquals(200,call(path,"PUT",Map.of(),token).statusCode());assertEquals(200,call(path,"PUT",Map.of(),token).statusCode());String q="/favorites?type=FOOD";assertEquals(1,((List<?>)object(call(q,"GET",null,token).body()).get("data")).size());assertEquals(0,((List<?>)object(call(q,"GET",null,other).body()).get("data")).size());assertEquals(403,call(path,"PUT",Map.of(),login(f.driverUsername())).statusCode());assertEquals(200,call(path,"DELETE",null,token).statusCode());assertEquals(200,call(path,"DELETE",null,token).statusCode());}
 @Test void cartPriceAbsoluteEditConflictReplaceAndIsolation(){assertEquals(400,call("/cart/items","POST",line(f.food(),0,0,false),token).statusCode());var added=call("/cart/items","POST",line(f.food(),f.large(),0,false),token);assertEquals(200,added.statusCode());var cart=data(added);var row=(Map<String,Object>)((List<?>)cart.get("items")).getFirst();assertEquals(45000,n(row,"unitPrice"));String id=s(row,"id");var edit=line(f.food(),f.small(),1,false);edit.remove("foodId");edit.put("quantity",3);var edited=call("/cart/items/"+id,"PUT",edit,token);assertEquals(200,edited.statusCode());assertEquals(3,n((Map<String,Object>)((List<?>)data(edited).get("items")).getFirst(),"quantity"));assertEquals(409,call("/cart/items","POST",line(f.food(),f.small(),0,false),token).statusCode());assertEquals(409,call("/cart/items","POST",line(f.secondFood(),0,2,false),token).statusCode());var replaced=call("/cart/items","POST",line(f.secondFood(),0,2,true),token);assertEquals(200,replaced.statusCode());assertEquals(Long.toString(f.secondRestaurant()),s(data(replaced),"restaurantId"));assertEquals(0,((List<?>)data(call("/cart","GET",null,other)).get("items")).size());assertEquals(200,call("/cart?expectedVersion=3","DELETE",null,token).statusCode());}
 @Test void cartReadKeepsUnavailableLineRemovable(){var r=call("/cart/items","POST",line(f.food(),f.small(),0,false),token);assertEquals(200,r.statusCode());String id=s((Map<String,Object>)((List<?>)data(r).get("items")).getFirst(),"id");tx.execute(t->{db.update("UPDATE foods SET available=FALSE WHERE id=?",f.food());return null;});var read=call("/cart","GET",null,token);assertEquals(200,read.statusCode());assertEquals(false,((Map<?,?>)((List<?>)data(read).get("items")).getFirst()).get("valid"));assertEquals(200,call("/cart/items/"+id+"?expectedVersion=1","DELETE",null,token).statusCode());}

 @Test void addressEditAndDeletePreserveCreatedOrderSnapshot(){
  var created=call("/addresses","POST",address(),token);
  assertEquals(201,created.statusCode());
  String id=s(data(created),"id");
  long order=tx.execute(t->db.insert("orders",snapshotOrderFixture(f.customer(),f.restaurant())));
  var input=address();input.put("addressText","After");
  assertEquals(200,call("/addresses/"+id,"PUT",input,token).statusCode());
  assertEquals("Before",db.required("SELECT address_text FROM orders WHERE id=?",order).get("address_text"));
  assertEquals(200,call("/addresses/"+id,"DELETE",null,token).statusCode());
  assertEquals("Before",db.required("SELECT address_text FROM orders WHERE id=?",order).get("address_text"));
 }
 // Test-only INSERT payload. NOT_STARTED is the V1 state before driver dispatch;
 // UNASSIGNED is not a permitted delivery_status in FoodGo's schema.
 static Map<String,Object> snapshotOrderFixture(long customer,long restaurant){
  return m("customer_id",customer,"restaurant_id",restaurant,"restaurant_name","Test",
   "recipient_name","Test","recipient_phone","0900000000","area_code","AREA_A",
   "address_text","Before","map_point_code","CUSTOMER_A","status","PENDING_CONFIRMATION",
   "payment_method","COD","payment_status","UNPAID","subtotal",0,"delivery_fee",15000,
   "food_discount",0,"delivery_discount",0,"total",15000,"delivery_status","NOT_STARTED");
 }
 @Test void concurrentSameVersionOnlyAppliesOnce(){assertEquals(200,call("/cart","GET",null,token).statusCode());var a=java.util.concurrent.CompletableFuture.supplyAsync(()->call("/cart/items","POST",line(f.food(),f.small(),0,false),token));var b=java.util.concurrent.CompletableFuture.supplyAsync(()->call("/cart/items","POST",line(f.food(),f.small(),0,false),token));assertEquals(List.of(200,409),List.of(a.join().statusCode(),b.join().statusCode()).stream().sorted().toList());var c=data(call("/cart","GET",null,token));assertEquals(1,n(c,"version"));assertEquals(2,n((Map<String,Object>)((List<?>)c.get("items")).getFirst(),"quantity"));}
 @Test void duplicateAndForeignOptionsAndClosedRestaurantRejected(){var input=line(f.food(),f.large(),0,false);input.put("optionValueIds",List.of(f.large(),f.large()));assertEquals(400,call("/cart/items","POST",input,token).statusCode());assertEquals(400,call("/cart/items","POST",line(f.secondFood(),f.small(),0,false),token).statusCode());tx.execute(t->{db.update("UPDATE restaurants SET available=FALSE WHERE id=?",f.restaurant());return null;});assertEquals(409,call("/cart/items","POST",line(f.food(),f.small(),0,false),token).statusCode());}
}
