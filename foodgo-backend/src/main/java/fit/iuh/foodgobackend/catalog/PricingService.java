package fit.iuh.foodgobackend.catalog;
import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.common.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service public class PricingService {
 private final JpaSql db;private final CatalogService catalog;
 public PricingService(JpaSql db,CatalogService catalog){this.db=db;this.catalog=catalog;}
 public Map<String,Object> line(long foodId,int quantity,String note,List<Long> optionIds){
  return line(foodId,quantity,note,optionIds,true);
 }
 private Map<String,Object> line(long foodId,int quantity,String note,List<Long> optionIds,boolean validate){
  require(!validate||quantity>=1&&quantity<=99,400,"INVALID_QUANTITY","Số lượng phải từ 1 đến 99.");
  require(!validate||new HashSet<>(optionIds).size()==optionIds.size(),400,"INVALID_OPTIONS","Tùy chọn không được lặp.");
  var food=db.required("SELECT * FROM foods WHERE id=? FOR UPDATE",foodId);require(!validate||bool(food.get("available")),409,"ITEM_UNAVAILABLE","Món hiện ngừng phục vụ. Bạn có thể bỏ món hoặc chọn món khác.");
  var selected=new ArrayList<Map<String,Object>>();var seen=new HashSet<Long>();long price=n(food,"base_price");
  for(var g:db.rows("SELECT * FROM option_groups WHERE food_id=? ORDER BY sort_order,id FOR UPDATE",foodId)){
   int count=0;for(var v:db.rows("SELECT * FROM option_values WHERE group_id=? ORDER BY id FOR UPDATE",g.get("id"))){long vid=n(v,"id");if(optionIds.contains(vid)){require(!validate||bool(v.get("available")),409,"ITEM_UNAVAILABLE","Lựa chọn này hiện ngừng phục vụ. Hãy chọn lại hoặc bỏ món.");seen.add(vid);count++;price=Math.addExact(price,n(v,"extra_price"));selected.add(m("optionValueId",id(v.get("id")),"groupName",g.get("name"),"valueName",v.get("name"),"extraPrice",n(v,"extra_price")));}}
   require(!validate||count>=n(g,"min_select")&&count<=n(g,"max_select"),400,"INVALID_OPTIONS","Lựa chọn của món đã thay đổi. Hãy chọn lại trước khi đặt.");
  }
  require(!validate||seen.size()==optionIds.size(),400,"INVALID_OPTIONS","Lựa chọn này không còn áp dụng cho món. Hãy chọn lại.");
  return m("foodId",id(food.get("id")),"restaurantId",id(food.get("restaurant_id")),"foodName",food.get("name"),"imageCode",food.get("image_code"),"basePrice",n(food,"base_price"),"unitPrice",price,"quantity",quantity,"lineTotal",Math.multiplyExact(price,quantity),"note",note,"optionsSnapshot",selected,"options",selected.stream().map(v->s(v,"valueName")).reduce((a,b)->a+" · "+b).orElse(""),"optionValueIds",optionIds.stream().sorted().map(Object::toString).toList());
 }
 public List<Map<String,Object>> lines(long cartId){var result=new ArrayList<Map<String,Object>>();for(var item:db.rows("SELECT * FROM cart_items WHERE cart_id=? ORDER BY food_id,id",cartId)){var options=db.rows("SELECT option_value_id FROM cart_item_options WHERE cart_item_id=? ORDER BY option_value_id",item.get("id")).stream().map(v->n(v,"option_value_id")).toList();var line=line(n(item,"food_id"),(int)n(item,"quantity"),s(item,"note"),options);line.put("id",id(item.get("id")));result.add(line);}return result;}
 /** Readable recovery view; checkout continues to use the strict lines() method. */
 public List<Map<String,Object>> cartLines(long cartId){
  var result=new ArrayList<Map<String,Object>>();var restaurant=db.one("SELECT r.available FROM restaurants r JOIN carts c ON c.restaurant_id=r.id WHERE c.id=?",cartId);
  for(var item:db.rows("SELECT * FROM cart_items WHERE cart_id=? ORDER BY food_id,id",cartId)){
   var options=db.rows("SELECT option_value_id FROM cart_item_options WHERE cart_item_id=? ORDER BY option_value_id",item.get("id")).stream().map(v->n(v,"option_value_id")).toList();Map<String,Object> line;String message=null;
   try{line=line(n(item,"food_id"),(int)n(item,"quantity"),s(item,"note"),options);}catch(ApiException e){
    if(!Set.of("ITEM_UNAVAILABLE","INVALID_OPTIONS","INVALID_QUANTITY").contains(e.code))throw e;
    line=line(n(item,"food_id"),(int)n(item,"quantity"),s(item,"note"),options,false);message=e.getMessage();
   }
   if(restaurant!=null&&!bool(restaurant.get("available")))message="Quán hiện ngừng phục vụ. Bạn có thể bỏ món hoặc chọn quán khác.";
   line.put("id",id(item.get("id")));line.put("available",message==null);line.put("validationMessage",message);result.add(line);
  }
  return result;
 }
 public Map<String,Object> quote(long customerId,Map<String,Object> cart,long addressId,Long offerId,String method){
  require(Set.of("COD","MOCK_WALLET").contains(method),400,"INVALID_PAYMENT","Phương thức thanh toán không hợp lệ.");
  require(cart.get("restaurant_id")!=null,400,"EMPTY_CART","Giỏ đang trống.");
  var restaurant=db.required("SELECT * FROM restaurants WHERE id=? FOR UPDATE",cart.get("restaurant_id"));require(bool(restaurant.get("available")),409,"ITEM_UNAVAILABLE","Quán hiện ngừng phục vụ.");
  var lines=lines(n(cart,"id"));require(!lines.isEmpty(),400,"EMPTY_CART","Giỏ đang trống.");
  var address=db.one("SELECT * FROM addresses WHERE id=? AND customer_id=? FOR UPDATE",addressId,customerId);require(address!=null,400,"INVALID_ADDRESS","Địa chỉ không thuộc tài khoản.");
  long subtotal=0;for(var l:lines)subtotal=Math.addExact(subtotal,n(l,"lineTotal"));long foodDiscount=0,deliveryDiscount=0,fee=15000;Map<String,Object> offer=null;
  if(offerId!=null){var o=db.one("SELECT * FROM offers WHERE id=? AND enabled=TRUE AND starts_at<=UTC_TIMESTAMP(3) AND ends_at>UTC_TIMESTAMP(3) FOR UPDATE",offerId);require(o!=null&&subtotal>=n(o,"min_subtotal")&&(o.get("restaurant_id")==null||n(o,"restaurant_id")==n(cart,"restaurant_id"))&&(o.get("required_method")==null||s(o,"required_method").equals(method)),400,"INVALID_OFFER","Ưu đãi chưa đủ điều kiện hoặc đã hết hiệu lực.");switch(s(o,"kind")){case "PERCENT"->foodDiscount=Math.min(subtotal*n(o,"percent")/100,n(o,"cap"));case "DELIVERY_DISCOUNT"->deliveryDiscount=Math.min(fee,n(o,"amount"));case "FREE_DELIVERY"->deliveryDiscount=fee;default->throw new IllegalStateException("Unknown offer kind");}offer=catalog.offer(o);}
  var addr=m("id",id(address.get("id")),"label",address.get("label"),"recipientName",address.get("recipient_name"),"recipientPhone",address.get("recipient_phone"),"areaCode",address.get("area_code"),"addressText",address.get("address_text"),"mapPointCode",address.get("map_point_code"));
  return m("customerId",Long.toString(customerId),"cartVersion",n(cart,"version"),"restaurantId",id(restaurant.get("id")),"restaurantName",restaurant.get("name"),"lines",lines,"address",addr,"offer",offer,"paymentMethod",method,"subtotal",subtotal,"deliveryFee",fee,"foodDiscount",foodDiscount,"deliveryDiscount",deliveryDiscount,"total",Math.max(0,subtotal+fee-foodDiscount-deliveryDiscount));
 }
}
