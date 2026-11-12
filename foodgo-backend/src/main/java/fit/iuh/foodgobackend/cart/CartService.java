package fit.iuh.foodgobackend.cart;
import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.account.UserPrincipal;
import fit.iuh.foodgobackend.common.*;
import fit.iuh.foodgobackend.catalog.PricingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.constraints.*;
import java.util.*;
@Service @Transactional public class CartService {
 public final JpaSql db;private final PricingService pricing;
 public CartService(JpaSql db,PricingService pricing){this.db=db;this.pricing=pricing;}
 public record ItemInput(Long foodId,@NotNull List<@NotNull Long> optionValueIds,@Size(max=200) String note,@Min(1) @Max(99) int quantity,@Min(0) long expectedVersion,boolean replaceRestaurant){}
 public Map<String,Object> lock(UserPrincipal u){u.requireRole("CUSTOMER");db.required("SELECT id FROM users WHERE id=? FOR UPDATE",u.id());var c=db.one("SELECT * FROM carts WHERE customer_id=? FOR UPDATE",u.id());if(c==null){db.insert("carts",m("customer_id",u.id()));c=db.required("SELECT * FROM carts WHERE customer_id=? FOR UPDATE",u.id());}return c;}
 public Map<String,Object> view(UserPrincipal u){var c=lock(u);var items=pricing.displayLines(n(c,"id"));return m("id",id(c.get("id")),"restaurantId",id(c.get("restaurant_id")),"restaurantName",c.get("restaurant_id")==null?null:db.required("SELECT name FROM restaurants WHERE id=?",c.get("restaurant_id")).get("name"),"version",n(c,"version"),"items",items,"estimatedSubtotal",items.stream().mapToLong(l->n(l,"lineTotal")).sum());}
 public void version(Map<String,Object> c,long expected){require(n(c,"version")==expected,409,"CART_VERSION_CONFLICT","Giỏ đã thay đổi. Hãy tải lại.");}
 public void clear(Map<String,Object> c){db.update("DELETE FROM cart_items WHERE cart_id=?",c.get("id"));db.update("UPDATE carts SET restaurant_id=NULL,version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",c.get("id"));}
 public Object add(UserPrincipal u,ItemInput input,Long itemId){var c=lock(u);version(c,input.expectedVersion());String note=input.note()==null?"":input.note().trim();var opts=input.optionValueIds();Long foodId=input.foodId();if(itemId!=null){var original=db.required("SELECT * FROM cart_items WHERE id=? AND cart_id=?",itemId,c.get("id"));long originalFood=n(original,"food_id");require(foodId==null||foodId==originalFood,400,"INVALID_CART_ITEM","Không được đổi món của dòng giỏ.");foodId=originalFood;}require(foodId!=null,400,"INVALID_INPUT","Thiếu mã món.");var priced=pricing.line(foodId,input.quantity(),note,opts);long restaurant=n(priced,"restaurantId");if(c.get("restaurant_id")!=null&&n(c,"restaurant_id")!=restaurant){require(input.replaceRestaurant()&&itemId==null,409,"RESTAURANT_REPLACE_REQUIRED","Giỏ thuộc quán khác. Cần xác nhận thay giỏ.");db.update("DELETE FROM cart_items WHERE cart_id=?",c.get("id"));}
  if(itemId!=null)db.required("SELECT id FROM cart_items WHERE id=? AND cart_id=?",itemId,c.get("id"));
  String signature=hash(foodId+"|"+opts.stream().sorted().toList()+"|"+note);var existing=db.one("SELECT * FROM cart_items WHERE cart_id=? AND signature_hash=?",c.get("id"),signature);long lineId;
  if(existing!=null){int quantity=input.quantity();if(itemId==null||n(existing,"id")!=itemId)quantity+=n(existing,"quantity");require(quantity<=99,409,"QUANTITY_LIMIT","Tổng số lượng không vượt 99.");lineId=n(existing,"id");db.update("UPDATE cart_items SET quantity=? WHERE id=?",quantity,lineId);if(itemId!=null&&lineId!=itemId)db.update("DELETE FROM cart_items WHERE id=?",itemId);}
  else{if(itemId!=null)db.update("DELETE FROM cart_items WHERE id=?",itemId);lineId=db.insert("cart_items",m("cart_id",c.get("id"),"food_id",foodId,"quantity",input.quantity(),"note",note,"signature_hash",signature));for(long option:opts)db.insert("cart_item_options",m("cart_item_id",lineId,"option_value_id",option));}
  db.update("UPDATE carts SET restaurant_id=?,version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",restaurant,c.get("id"));return view(u);
 }
 public Object remove(UserPrincipal u,Long itemId,long expected){var c=lock(u);version(c,expected);if(itemId==null)clear(c);else{db.required("SELECT id FROM cart_items WHERE id=? AND cart_id=?",itemId,c.get("id"));db.update("DELETE FROM cart_items WHERE id=?",itemId);db.update("UPDATE carts SET restaurant_id=IF(EXISTS(SELECT 1 FROM cart_items WHERE cart_id=?),restaurant_id,NULL),version=version+1,updated_at=UTC_TIMESTAMP(3) WHERE id=?",c.get("id"),c.get("id"));}return view(u);}
}
