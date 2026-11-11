package fit.iuh.foodgobackend.catalog;
import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.common.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @Transactional public class CatalogService {
 public final JpaSql db;public CatalogService(JpaSql db){this.db=db;}
 public Map<String,Object> food(long id){var f=db.required("SELECT * FROM foods WHERE id=?",id);var groups=new ArrayList<Map<String,Object>>();for(var g:db.rows("SELECT * FROM option_groups WHERE food_id=? ORDER BY sort_order,id",id)){groups.add(m("id",id(g.get("id")),"name",g.get("name"),"minSelect",g.get("min_select"),"maxSelect",g.get("max_select"),"values",db.rows("SELECT * FROM option_values WHERE group_id=? ORDER BY id",g.get("id")).stream().map(v->m("id",id(v.get("id")),"name",v.get("name"),"extraPrice",v.get("extra_price"),"available",bool(v.get("available")))).toList()));}return m("id",id(f.get("id")),"restaurantId",id(f.get("restaurant_id")),"name",f.get("name"),"description",f.get("description"),"basePrice",f.get("base_price"),"imageCode",f.get("image_code"),"available",bool(f.get("available")),"kind",f.get("kind"),"optionGroups",groups);}
 public Map<String,Object> offer(Map<String,Object> o){return m("id",id(o.get("id")),"code",o.get("code"),"name",o.get("name"),"kind",o.get("kind"),"percent",o.get("percent"),"cap",o.get("cap"),"amount",o.get("amount"),"minSubtotal",o.get("min_subtotal"),"requiredMethod",o.get("required_method"),"startsAt",iso(o.get("starts_at")),"endsAt",iso(o.get("ends_at")));}
 public List<Map<String,Object>> offers(){return db.rows("SELECT * FROM offers WHERE enabled=TRUE AND starts_at<=UTC_TIMESTAMP(3) AND ends_at>UTC_TIMESTAMP(3) ORDER BY id").stream().map(this::offer).toList();}
 public List<Map<String,Object>> foods(){return db.rows("SELECT id FROM foods WHERE available=TRUE ORDER BY id").stream().map(f->food(n(f,"id"))).toList();}
 public List<Map<String,Object>> restaurants(){return db.rows("SELECT * FROM restaurants WHERE available=TRUE ORDER BY id").stream().map(r->m("id",id(r.get("id")),"name",r.get("name"),"areaCode",r.get("area_code"),"imageCode",r.get("image_code"),"available",true,"sampleRating",r.get("sample_rating"),"sampleEtaMinutes",r.get("sample_eta_minutes"),"simulatedFields",List.of("sampleRating","sampleEtaMinutes"))).toList();}
}
