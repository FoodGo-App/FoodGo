package fit.iuh.foodgobackend.bootstrap;

import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.common.JpaSql;
import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.cart.CartService;
import fit.iuh.foodgobackend.ordering.*;
import fit.iuh.foodgobackend.fulfillment.FulfillmentService;
import fit.iuh.foodgobackend.communication.CommunicationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.*;
import java.time.Instant;
import java.sql.Timestamp;
import java.nio.charset.StandardCharsets;

/** Opt-in, versioned synthetic fixtures. Uses normal business transitions, never replaces user data. */
@Service
public class RichDemoSeedService {
 private final JpaSql db;private final CartService carts;private final CheckoutService checkout;
 private final FulfillmentService delivery;private final CommunicationService chat;private final OrderService orders;
 private final String password;
 private static final String VERSION="foodgo-rich-v1";
 private static final String[] RESTAURANTS={"Bếp Tre Xanh","Phở Sáng Mai","Bún Bò Gió Nội","Bánh Mì Góc Nhỏ","Cơm Tấm Hạt Nắng","Mì Nhà Mây","Bếp Chay An Nhiên","Trà Sữa Mộc Miên","Ăn Vặt Góc Phố","Bún Đậu Mẹt Tre"};
 private static final String[] CATEGORIES={"Cơm","Bún – Phở","Bún – Phở","Bánh mì","Cơm","Mì – Hủ tiếu","Món chay","Trà sữa – Đồ uống","Ăn vặt","Bún đậu"};
 private static final String[] MENUS={
  "Cơm gà nướng mật ong:45000|Cơm gà xối mỡ:42000|Cơm bò lúc lắc:59000|Cơm sườn rim:47000|Cơm cá kho tộ:45000|Cơm tôm sốt me:55000|Cơm trứng thịt bằm:35000|Cơm gà sốt tiêu:48000|Combo cơm gà và canh:65000|Canh rong biển thịt bằm:18000",
  "Phở bò tái:50000|Phở bò chín:50000|Phở tái nạm:55000|Phở đặc biệt:69000|Phở gà xé:45000|Phở bò viên:48000|Phở gầu:59000|Phở cuốn thịt bò:55000|Combo phở và chả giò:79000|Quẩy giòn:10000",
  "Bún bò Huế truyền thống:50000|Bún bò giò heo:59000|Bún bò đặc biệt:69000|Bún bò chả cua:55000|Bún bò gân:60000|Bún riêu cua:45000|Bún măng vịt:50000|Bún thịt nướng:45000|Combo bún và nước sâm:65000|Chả Huế phần thêm:20000",
  "Bánh mì thịt nướng:28000|Bánh mì xíu mại:25000|Bánh mì chả lụa:25000|Bánh mì gà xé:28000|Bánh mì bò sốt tiêu:39000|Bánh mì trứng ốp la:22000|Bánh mì pate đặc biệt:35000|Bánh mì chay nấm:25000|Combo bánh mì và sữa đậu:42000|Sữa đậu nành:15000",
  "Cơm tấm sườn nướng:45000|Cơm tấm sườn bì chả:59000|Cơm tấm sườn trứng:55000|Cơm tấm ba rọi:49000|Cơm tấm gà nướng:45000|Cơm tấm cá chiên:45000|Cơm tấm chả trứng:35000|Cơm tấm sườn que:65000|Combo sườn bì chả và canh:75000|Canh khổ qua nhồi thịt:25000",
  "Mì hoành thánh:48000|Mì xá xíu:50000|Mì vịt tiềm:79000|Hủ tiếu Nam Vang:55000|Hủ tiếu bò viên:45000|Mì hải sản:65000|Mì xào bò rau cải:59000|Hủ tiếu chay:40000|Combo mì xá xíu và há cảo:75000|Há cảo hấp:30000",
  "Cơm nấm kho tiêu:40000|Cơm đậu hũ sốt nấm:38000|Bún chay rau củ:40000|Phở nấm chay:45000|Mì xào chay:42000|Cơm cà ri rau củ:45000|Gỏi cuốn chay:30000|Đậu hũ chiên sả:35000|Combo cơm chay và canh:55000|Canh nấm hạt sen:25000",
  "Trà sữa trân châu:30000|Trà sữa ô long:35000|Trà sữa matcha:38000|Trà đào cam sả:35000|Trà vải lài:35000|Trà tắc mật ong:25000|Sữa tươi đường đen:40000|Cacao sữa:35000|Combo hai ly trà sữa:55000|Trà chanh nha đam:28000",
  "Khoai tây chiên:25000|Gà viên chiên:35000|Cá viên sốt me:30000|Bánh tráng trộn:25000|Bánh tráng cuốn:30000|Chả giò chiên:35000|Xúc xích nướng:25000|Bắp xào tôm khô:25000|Combo ăn vặt hai người:79000|Rong biển cháy tỏi:22000",
  "Bún đậu phần nhỏ:45000|Bún đậu đầy đủ:65000|Bún đậu chả cốm:59000|Bún đậu thịt luộc:55000|Bún đậu đậu hũ nấm:45000|Bún đậu nem rán:59000|Bún đậu hai người:119000|Bún đậu ba người:169000|Combo bún đậu và trà tắc:75000|Chả cốm chiên thêm:25000"};
 private static final String[] PEOPLE={"Nguyễn Minh Anh","Trần Quốc Bảo","Lê Thu Hà","Phạm Gia Huy","Hoàng Ngọc Linh","Võ Đức Minh","Đặng Hải Yến","Bùi Tuấn Kiệt","Đỗ Thảo Nguyên","Ngô Quang Vinh","Dương Phương Thảo","Lý Thành Đạt","Trịnh Mai Chi","Đinh Hoài Nam","Hồ Khánh Vy","Nguyễn Bảo Trân","Trần Nhật Khang","Lê Diễm My","Phạm Thanh Tùng","Vũ Ngọc Hân","Đoàn Anh Thư","Tạ Minh Khoa","Đặng Trúc Mai","Bùi Việt Hoàng","Đỗ Gia Nhi","Ngô Tiến Dũng","Dương Kim Ngân","Lý Đức Phúc","Trịnh Hà My","Đinh Quốc An"};
 private static final String[] STREETS={"Lê Văn Việt","Võ Văn Ngân","Đặng Văn Bi","Hoàng Diệu 2","Tô Vĩnh Diện","Linh Đông","Kha Vạn Cân","Chương Dương","Đường số 8","Đường số 12"};
 private record Dish(long id,List<Long> options){}
 public RichDemoSeedService(JpaSql db,CartService carts,CheckoutService checkout,FulfillmentService delivery,CommunicationService chat,OrderService orders,@Value("${foodgo.seed-password:FoodGo@123}") String password){this.db=db;this.carts=carts;this.checkout=checkout;this.delivery=delivery;this.chat=chat;this.orders=orders;this.password=password;}
 private static String key(String suffix){return UUID.nameUUIDFromBytes((VERSION+":"+suffix).getBytes(StandardCharsets.UTF_8)).toString();}
 private long ensure(String table,String lookup,Map<String,Object> values,Object... args){var row=db.one(lookup,args);return row==null?db.insert(table,values):n(row,"id");}
 private UserPrincipal user(String username,String name,String role,Long restaurant,String hash){
  var old=db.one("SELECT * FROM users WHERE username=?",username);
  if(old!=null){require(s(old,"role").equals(role)&&Objects.equals(old.get("restaurant_id")==null?null:n(old,"restaurant_id"),restaurant),409,"SAMPLE_ACCOUNT_CONFLICT","Tài khoản trùng tên nhưng khác vai trò/quán; không ghi đè.");return new UserPrincipal(n(old,"id"),s(old,"display_name"),role,restaurant,null);}
  long id=db.insert("users",m("username",username,"display_name",name,"password_hash",hash,"role",role,"restaurant_id",restaurant,"driver_area_code",role.equals("DRIVER")?"AREA_A":null));return new UserPrincipal(id,name,role,restaurant,null);
 }
 @Transactional
 public void seed(){
  if(db.one("SELECT id FROM order_events WHERE event_type='SAMPLE_DATA_READY' AND client_request_key=?",key("ready"))!=null)return;
  var restaurantIds=new ArrayList<Long>();var managers=new ArrayList<UserPrincipal>();var menu=new ArrayList<List<Dish>>();
  String encoded=new BCryptPasswordEncoder().encode(password);
  for(int r=0;r<10;r++){
   long category=ensure("categories","SELECT id FROM categories WHERE name=?",m("name",CATEGORIES[r],"sort_order",r+10),CATEGORIES[r]);
   String name="[Mẫu] "+RESTAURANTS[r];
   long restaurant=ensure("restaurants","SELECT id FROM restaurants WHERE name=? ORDER BY id LIMIT 1",m("name",name,"area_code","AREA_A","address_text",(21+r*9)+" "+STREETS[r]+", TP. Thủ Đức (địa chỉ minh họa)","map_point_code","RESTAURANT_A","image_code","SAMPLE_RESTAURANT","sample_rating",4.4+(r%6)*0.1,"sample_distance_m",600+r*230,"sample_eta_minutes",18+r*2,"sample_reviews_json","[]"),name);
   restaurantIds.add(restaurant);managers.add(user(String.format("sample.restaurant%02d",r+1),RESTAURANTS[r],"RESTAURANT",restaurant,encoded));
   var dishes=new ArrayList<Dish>();int f=0;
   for(String spec:MENUS[r].split("\\|")){
    String[] parts=spec.split(":");String foodName=parts[0];long price=Long.parseLong(parts[1]);String image=foodName.startsWith("Cơm gà")?"CHICKEN_RICE":r==6?"MUSHROOM_RICE":"SAMPLE_FOOD";
    long food=ensure("foods","SELECT id FROM foods WHERE restaurant_id=? AND name=? ORDER BY id LIMIT 1",m("restaurant_id",restaurant,"category_id",category,"name",foodName,"description",foodName+" được chuẩn bị khi nhận đơn. Giá đã gồm hộp, có thể chọn khẩu phần và ghi chú. Dữ liệu minh họa để demo FoodGo.","base_price",price,"kind",foodName.startsWith("Combo")?"COMBO":"SINGLE","image_code",image),restaurant,foodName);
    long size=ensure("option_groups","SELECT id FROM option_groups WHERE food_id=? AND name=? ORDER BY id LIMIT 1",m("food_id",food,"name","Khẩu phần","min_select",1,"max_select",1,"sort_order",1),food,"Khẩu phần");
    long normal=option(size,r==7?"Size M":"Phần tiêu chuẩn",0);option(size,r==7?"Size L":"Phần lớn",10000);option(size,r==7?"Size XL":"Phần đặc biệt",20000);
    long add=ensure("option_groups","SELECT id FROM option_groups WHERE food_id=? AND name=? ORDER BY id LIMIT 1",m("food_id",food,"name",r==7?"Topping":"Món thêm","min_select",0,"max_select",2,"sort_order",2),food,r==7?"Topping":"Món thêm");
    long topping=option(add,r==7?"Trân châu đen":r==6?"Nấm thêm":"Trứng thêm",5000);option(add,r==7?"Thạch trái cây":"Rau thêm",5000);option(add,r==7?"Pudding trứng":"Phần đạm thêm",15000);
    dishes.add(new Dish(food,f++%3==0?List.of(normal,topping):List.of(normal)));
   }menu.add(dishes);
  }
  long discount=ensure("offers","SELECT id FROM offers WHERE code=?",m("code","MAUALL10","name","Ưu đãi minh họa giảm 10%","kind","PERCENT","percent",10,"cap",30000,"min_subtotal",0,"starts_at",Timestamp.from(Instant.parse("2026-01-01T00:00:00Z")),"ends_at",Timestamp.from(Instant.parse("2031-01-01T00:00:00Z"))),"MAUALL10");
  for(int i=0;i<20;i++){
   String code=String.format("MAU%02d",i+1);boolean percentage=i%2==0;
   ensure("offers","SELECT id FROM offers WHERE code=?",m("code",code,"name",percentage?"Giảm "+(10+i%3*5)+"% tại "+RESTAURANTS[i%10]:"Hỗ trợ phí giao "+RESTAURANTS[i%10],"restaurant_id",restaurantIds.get(i%10),"kind",percentage?"PERCENT":"DELIVERY_DISCOUNT","percent",percentage?10+i%3*5:null,"cap",percentage?40000:null,"amount",percentage?null:5000+i%3*5000,"min_subtotal",50000,"required_method",i%5==0?"MOCK_WALLET":null,"starts_at",Timestamp.from(Instant.parse("2026-01-01T00:00:00Z")),"ends_at",Timestamp.from(Instant.parse("2031-01-01T00:00:00Z"))),code);
  }
  var customers=new ArrayList<UserPrincipal>();var drivers=new ArrayList<UserPrincipal>();var addresses=new ArrayList<Long>();
  for(int i=0;i<30;i++){
   var customer=user(String.format("sample.customer%02d",i+1),PEOPLE[i],"CUSTOMER",null,encoded);customers.add(customer);
   for(int a=0;a<2;a++){
    String text=(35+i*3+a)+" "+STREETS[i%10]+", TP. Thủ Đức (minh họa)";
    long address=ensure("addresses","SELECT id FROM addresses WHERE customer_id=? AND address_text=? ORDER BY id LIMIT 1",m("customer_id",customer.id(),"recipient_name",customer.displayName(),"recipient_phone",String.format("090%07d",1000000+i),"area_code","AREA_A","address_text",text,"label",a==0?"Nhà":"Văn phòng","map_point_code",a==0?"CUSTOMER_A":"CUSTOMER_B"),customer.id(),text);if(a==0)addresses.add(address);
   }
   for(int j=0;j<3;j++){long food=menu.get((i+j)%10).get((i+j)%10).id();ensure("favorites","SELECT id FROM favorites WHERE customer_id=? AND food_id=?",m("customer_id",customer.id(),"food_id",food),customer.id(),food);}
   long rest=restaurantIds.get(i%10);ensure("favorites","SELECT id FROM favorites WHERE customer_id=? AND restaurant_id=?",m("customer_id",customer.id(),"restaurant_id",rest),customer.id(),rest);
  }
  for(int i=0;i<20;i++)drivers.add(user(String.format("sample.driver%02d",i+1),"Tài xế "+PEOPLE[(i+6)%30],"DRIVER",null,encoded));
  long firstOrder=0;
  for(int i=1;i<=120;i++){
   UserPrincipal customer=customers.get((i-1)%30);int r=(i-1)%10;UserPrincipal manager=managers.get(r);String orderKey=key("order-"+i);
   var existing=db.one("SELECT order_id FROM order_events WHERE event_type='SAMPLE_ORDER_CREATED' AND actor_id=? AND client_request_key=?",customer.id(),orderKey);if(existing!=null){if(firstOrder==0)firstOrder=n(existing,"order_id");continue;}
   var cart=carts.lock(customer);require(db.one("SELECT id FROM cart_items WHERE cart_id=? LIMIT 1",cart.get("id"))==null,409,"SAMPLE_CART_NOT_EMPTY","Giỏ tài khoản sample đã có dữ liệu; không tự xóa.");
   fill(customer,menu.get(r),i);cart=carts.lock(customer);String method=i%2==0?"MOCK_WALLET":"COD";
   var q=checkout.quote(customer,new CheckoutService.QuoteInput(addresses.get((i-1)%30),i%3==0?discount:null,method,n(cart,"version")));
   var attempt=checkout.begin(customer,new CheckoutService.AttemptInput(n(q,"id"),n(q,"cartVersion")),key("attempt-"+i));
   if(method.equals("MOCK_WALLET"))attempt=checkout.resolve(customer,n(attempt,"id"));
   require(s(attempt,"result").equals("SUCCEEDED"),409,"SAMPLE_WALLET_SCENARIO","Nạp bộ mẫu cần FOODGO_WALLET_SCENARIO=SUCCEEDED.");long oid=n(attempt,"orderId");if(firstOrder==0)firstOrder=oid;
   db.insert("order_events",m("order_id",oid,"actor_id",customer.id(),"event_type","SAMPLE_ORDER_CREATED","client_request_key",orderKey,"reason","Đơn minh họa "+String.format("FG-MAU-%03d",i)+"; không phải giao dịch thật."));
   if(i>=85&&i<=96)orders.cancel(customer,oid,"Khách thay đổi lịch nhận món (dữ liệu minh họa).");
   else if(i>=97&&i<=108)delivery.restaurantAction(manager,oid,"reject","Quán tạm hết nguyên liệu của món đã chọn (minh họa).");
   else if(i<109||i>111){
    delivery.restaurantAction(manager,oid,"accept",null);
    if(i>=112&&i<=114){db.update("UPDATE driver_offers SET expires_at=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 1 MINUTE) WHERE order_id=? AND status='OFFERED'",oid);delivery.expire(oid);}
    else{
     var driver=drivers.get(i<=84?(i-1)%20:i-115);var incoming=db.required("SELECT id FROM driver_offers WHERE order_id=? AND driver_id=? AND status='OFFERED'",oid,driver.id());delivery.offerAction(driver,n(incoming,"id"),"accept");
     conversations(customer,driver,oid,i,i<=2?32:4);
     delivery.restaurantAction(manager,oid,"prepare",null);
     if(i<=84||i>=117)delivery.restaurantAction(manager,oid,"ready",null);
     if(i<=84||i>=119){delivery.pickup(driver,oid);if(i%10==0)delivery.issue(driver,oid,"Khách nhờ chờ thêm vài phút tại sảnh (minh họa).",key("issue-"+i));}
     if(i<=84){delivery.deliver(driver,oid,method.equals("COD"));if(i%3!=0)chat.sendReview(customer,oid,new CommunicationService.ReviewInput(i%5==0?4:5,List.of(i%2==0?"FRIENDLY":"DELIVERY"),i%2==0?"Tài xế thân thiện, giao món còn nóng. Đánh giá mẫu.":"Giao đúng địa chỉ, đóng gói gọn gàng. Đánh giá mẫu."));}
    }
   }
   backdate(oid,n(q,"id"),n(attempt,"id"),i);
   if(i%20==0)org.slf4j.LoggerFactory.getLogger(getClass()).info("Prepared {} / 120 synthetic sample orders.",i);
  }
  for(int i=0;i<30;i++)fill(customers.get(i),menu.get(i%10),i+500);
  db.insert("order_events",m("order_id",firstOrder,"actor_id",customers.getFirst().id(),"event_type","SAMPLE_DATA_READY","client_request_key",key("ready"),"reason","Bộ dữ liệu minh họa mở rộng v1 đã nạp; không tự nhân đôi khi chạy lại."));
 }
 private long option(long group,String name,long price){return ensure("option_values","SELECT id FROM option_values WHERE group_id=? AND name=?",m("group_id",group,"name",name,"extra_price",price),group,name);}
 private void fill(UserPrincipal customer,List<Dish> dishes,int i){
  long version=n(carts.lock(customer),"version");Dish first=dishes.get(i%10),second=dishes.get((i+3)%10);
  carts.add(customer,new CartService.ItemInput(first.id(),first.options(),i%2==0?"Ít cay, để riêng nước chấm":"Không hành, cảm ơn quán",1+i%2,version,false),null);
  carts.add(customer,new CartService.ItemInput(second.id(),second.options(),"Đóng gói cẩn thận",1,version+1,false),null);
 }
 private void conversations(UserPrincipal customer,UserPrincipal driver,long order,int i,int count){
  String[] texts={"Chào anh/chị, mình đã nhận đơn và đang tới quán ạ.","Mình nhận ở sảnh, anh/chị tới thì nhắn giúp nhé.","Quán đang chuẩn bị, mình sẽ giao ngay khi nhận món.","Cảm ơn, nhờ anh/chị giữ món giúp mình.","Mình đã kiểm tra đủ món và số lượng.","Mình đã lưu ghi chú giao hàng, cảm ơn anh/chị."};
  for(int j=0;j<count;j++){var sender=j%2==0?driver:customer;chat.send(sender,order,new CommunicationService.MessageInput(key("message-"+i+"-"+j),"TEXT",texts[j%texts.length],null));}
 }
 private void backdate(long order,long quote,long attempt,int index){
  Instant start=Instant.now().minusSeconds(index<=108?(1+index%45)*86400L+index*71L:3600L+index*5L);
  var o=db.required("SELECT * FROM orders WHERE id=?",order);String status=s(o,"status");long finalMinute=switch(status){case "DELIVERED"->45;case "CANCELLED","REJECTED"->4;case "CONFIRMED"->6;case "PREPARING"->10;case "READY_FOR_PICKUP"->23;case "OUT_FOR_DELIVERY"->28;default->0;};
  Timestamp end=Timestamp.from(start.plusSeconds(finalMinute*60));
  db.update("UPDATE orders SET created_at=?,updated_at=?,assigned_at=CASE WHEN assigned_at IS NULL THEN NULL ELSE ? END,picked_up_at=CASE WHEN picked_up_at IS NULL THEN NULL ELSE ? END,delivered_at=CASE WHEN delivered_at IS NULL THEN NULL ELSE ? END,paid_at=CASE WHEN paid_at IS NULL THEN NULL ELSE ? END,refunded_at=CASE WHEN refunded_at IS NULL THEN NULL ELSE ? END WHERE id=?",Timestamp.from(start),end,Timestamp.from(start.plusSeconds(5*60+20)),Timestamp.from(start.plusSeconds(25*60)),end,s(o,"payment_method").equals("COD")?end:Timestamp.from(start),end,order);
  db.update("UPDATE checkout_quotes SET created_at=?,expires_at=? WHERE id=?",Timestamp.from(start.minusSeconds(30)),Timestamp.from(start.plusSeconds(90)),quote);
  db.update("UPDATE checkout_attempts SET created_at=?,updated_at=? WHERE id=?",Timestamp.from(start),end,attempt);
  var events=db.rows("SELECT id,event_type FROM order_events WHERE order_id=? ORDER BY id",order);for(var e:events){long minute=switch(s(e,"event_type")){case "RESTAURANT_ACCEPTED","DISPATCH_STARTED"->5;case "DRIVER_ASSIGNED"->5;case "PREPARING"->10;case "READY_FOR_PICKUP"->23;case "PICKED_UP"->25;case "DELIVERY_ISSUE"->27;case "DELIVERED","ISSUE_RESOLVED"->45;case "ORDER_CANCELLED","RESTAURANT_REJECTED"->4;case "NO_DRIVER"->6;default->0;};db.update("UPDATE order_events SET created_at=? WHERE id=?",Timestamp.from(start.plusSeconds(minute*60+(s(e,"event_type").equals("DRIVER_ASSIGNED")?20:0))),e.get("id"));}
  var messages=db.rows("SELECT id FROM messages WHERE order_id=? ORDER BY id",order);for(int j=0;j<messages.size();j++)db.update("UPDATE messages SET created_at=? WHERE id=?",Timestamp.from(start.plusSeconds(8*60+j*20L)),messages.get(j).get("id"));
  db.update("UPDATE driver_reviews SET created_at=? WHERE order_id=?",Timestamp.from(start.plusSeconds(55*60)),order);
  db.update("UPDATE driver_offers SET created_at=?,expires_at=?,responded_at=CASE WHEN responded_at IS NULL THEN NULL WHEN status='EXPIRED' THEN ? ELSE ? END WHERE order_id=?",Timestamp.from(start.plusSeconds(5*60)),Timestamp.from(start.plusSeconds(5*60+30)),Timestamp.from(start.plusSeconds(6*60)),Timestamp.from(start.plusSeconds(5*60+20)),order);
 }
}
