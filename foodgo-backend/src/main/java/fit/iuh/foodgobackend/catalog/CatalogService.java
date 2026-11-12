package fit.iuh.foodgobackend.catalog;
import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.common.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @Transactional public class CatalogService {
 public final JpaSql db;public CatalogService(JpaSql db){this.db=db;}
 public Map<String,Object> food(long id){var f=db.required("SELECT * FROM foods WHERE id=?",id);var groups=new ArrayList<Map<String,Object>>();for(var g:db.rows("SELECT * FROM option_groups WHERE food_id=? ORDER BY sort_order,id",id)){groups.add(m("id",id(g.get("id")),"name",g.get("name"),"minSelect",g.get("min_select"),"maxSelect",g.get("max_select"),"values",db.rows("SELECT * FROM option_values WHERE group_id=? ORDER BY id",g.get("id")).stream().map(v->m("id",id(v.get("id")),"name",v.get("name"),"extraPrice",v.get("extra_price"),"available",bool(v.get("available")))).toList()));}return m("id",id(f.get("id")),"restaurantId",id(f.get("restaurant_id")),"name",f.get("name"),"description",f.get("description"),"basePrice",f.get("base_price"),"imageCode",f.get("image_code"),"available",bool(f.get("available")),"restaurantAvailable",bool(db.required("SELECT available FROM restaurants WHERE id=?",f.get("restaurant_id")).get("available")),"categoryId",id(f.get("category_id")),"kind",f.get("kind"),"optionGroups",groups);}
 public Map<String,Object> offer(Map<String,Object> o){return m("id",id(o.get("id")),"code",o.get("code"),"name",o.get("name"),"kind",o.get("kind"),"percent",o.get("percent"),"cap",o.get("cap"),"amount",o.get("amount"),"minSubtotal",o.get("min_subtotal"),"restaurantId",id(o.get("restaurant_id")),"requiredMethod",o.get("required_method"),"startsAt",iso(o.get("starts_at")),"endsAt",iso(o.get("ends_at")));}
 public List<Map<String,Object>> offers(){return db.rows("SELECT * FROM offers WHERE enabled=TRUE AND starts_at<=UTC_TIMESTAMP(3) AND ends_at>UTC_TIMESTAMP(3) ORDER BY id").stream().map(this::offer).toList();}
 public List<Map<String,Object>> foods(){return db.rows("SELECT id FROM foods WHERE available=TRUE ORDER BY id").stream().map(f->food(n(f,"id"))).toList();}
 public List<Map<String,Object>> restaurants(){return db.rows("SELECT * FROM restaurants WHERE available=TRUE ORDER BY id").stream().map(r->m("id",id(r.get("id")),"name",r.get("name"),"areaCode",r.get("area_code"),"imageCode",r.get("image_code"),"available",true,"sampleRating",r.get("sample_rating"),"sampleEtaMinutes",r.get("sample_eta_minutes"),"simulatedFields",List.of("sampleRating","sampleEtaMinutes"))).toList();}

 public Map<String,Object> restaurantSummary(Map<String,Object> r){return m("id",id(r.get("id")),"name",r.get("name"),"areaCode",r.get("area_code"),"addressText",r.get("address_text"),"imageCode",r.get("image_code"),"available",bool(r.get("available")),"sampleRating",r.get("sample_rating"),"sampleDistanceM",r.get("sample_distance_m"),"sampleEtaMinutes",r.get("sample_eta_minutes"),"simulatedFields",List.of("sampleRating","sampleDistanceM","sampleEtaMinutes"));}
 public Map<String,Object> foodSummary(Map<String,Object> f){return m("id",id(f.get("id")),"name",f.get("name"),"description",f.get("description"),"basePrice",f.get("base_price"),"categoryId",id(f.get("category_id")),"restaurantId",id(f.get("restaurant_id")),"imageCode",f.get("image_code"),"kind",f.get("kind"),"restaurantAvailable",!f.containsKey("restaurant_available")||bool(f.get("restaurant_available")),"available",bool(f.get("available")));}
 public List<Map<String,Object>> categories(){return db.rows("SELECT * FROM categories ORDER BY sort_order,id").stream().map(c->m("id",id(c.get("id")),"name",c.get("name"))).toList();}
 public Map<String,Object> restaurant(long id){var r=db.required("SELECT * FROM restaurants WHERE id=?",id);var out=restaurantSummary(r);out.put("sampleReviews",objects(r.get("sample_reviews_json")));return out;}
 public Map<String,Object> searchFoods(Map<String,String> filters){var q=CatalogQuery.parse(filters);var args=new ArrayList<Object>();String where=" WHERE f.available=TRUE AND r.available=TRUE";
  if(!q.q().isEmpty()){where+=" AND (f.name LIKE ? ESCAPE '=' OR r.name LIKE ? ESCAPE '=')";args.add(q.like());args.add(q.like());}
  if(q.categoryId()!=null){where+=" AND f.category_id=?";args.add(q.categoryId());}
  if(q.restaurantId()!=null){where+=" AND f.restaurant_id=?";args.add(q.restaurantId());}
  if(!q.areaCode().isEmpty()){where+=" AND r.area_code=?";args.add(q.areaCode());}
  String sort=switch(q.sort()){case "price"->"f.base_price ASC";case "distance"->"r.sample_distance_m ASC";default->"r.sample_rating DESC";};args.add(q.size()+1);args.add(q.offset());
  return q.envelope(db.rows("SELECT f.*,r.available AS restaurant_available FROM foods f JOIN restaurants r ON r.id=f.restaurant_id"+where+" ORDER BY "+sort+",f.id LIMIT ? OFFSET ?",args.toArray()).stream().map(this::foodSummary).toList());
 }
 public Map<String,Object> searchRestaurants(Map<String,String> filters){var q=CatalogQuery.parse(filters);var args=new ArrayList<Object>();String where=" WHERE r.available=TRUE";
  if(!q.q().isEmpty()){where+=" AND r.name LIKE ? ESCAPE '='";args.add(q.like());}
  if(q.categoryId()!=null){where+=" AND EXISTS (SELECT 1 FROM foods f WHERE f.restaurant_id=r.id AND f.category_id=? AND f.available=TRUE)";args.add(q.categoryId());}
  if(!q.areaCode().isEmpty()){where+=" AND r.area_code=?";args.add(q.areaCode());}
  String sort=switch(q.sort()){case "price"->"COALESCE((SELECT MIN(f.base_price) FROM foods f WHERE f.restaurant_id=r.id AND f.available=TRUE),0) ASC";case "distance"->"r.sample_distance_m ASC";default->"r.sample_rating DESC";};args.add(q.size()+1);args.add(q.offset());
  return q.envelope(db.rows("SELECT r.* FROM restaurants r"+where+" ORDER BY "+sort+",r.id LIMIT ? OFFSET ?",args.toArray()).stream().map(this::restaurantSummary).toList());
 }
 public Map<String,Object> searchOffers(Map<String,String> filters){var q=CatalogQuery.parse(filters);var args=new ArrayList<Object>();String where=" WHERE enabled=TRUE AND starts_at<=UTC_TIMESTAMP(3) AND ends_at>UTC_TIMESTAMP(3)";if(q.restaurantId()!=null){where+=" AND (restaurant_id IS NULL OR restaurant_id=?)";args.add(q.restaurantId());}args.add(q.size()+1);args.add(q.offset());return q.envelope(db.rows("SELECT * FROM offers"+where+" ORDER BY id LIMIT ? OFFSET ?",args.toArray()).stream().map(this::offer).toList());}
 public Map<String,Object> home(String area){var filters=new HashMap<String,String>();if(area!=null)filters.put("areaCode",area);filters.put("size","10");return m("banners",List.of(m("id","panda","title","Bữa ngon gần bạn")),"collections",List.of(m("id","suggested","name","Gợi ý hôm nay")),"categories",categories(),"suggestedFoods",searchFoods(filters).get("data"),"offers",searchOffers(Map.of("size","10")).get("data"));}
}
