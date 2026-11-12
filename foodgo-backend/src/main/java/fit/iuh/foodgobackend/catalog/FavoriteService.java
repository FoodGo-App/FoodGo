package fit.iuh.foodgobackend.catalog;
import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.common.*;
import fit.iuh.foodgobackend.account.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@Service @Transactional public class FavoriteService {
 private final JpaSql db;private final CatalogService catalog;
 public FavoriteService(JpaSql db,CatalogService catalog){this.db=db;this.catalog=catalog;}
 private String column(String type){require(Set.of("FOOD","RESTAURANT").contains(type),400,"INVALID_FAVORITE_TYPE","Loại yêu thích không hợp lệ.");return type.equals("FOOD")?"food_id":"restaurant_id";}
 public Map<String,Object> list(UserPrincipal u,String type,Map<String,String> filters){u.requireRole("CUSTOMER");String col=column(type);var q=CatalogQuery.parse(filters);String table=type.equals("FOOD")?"foods":"restaurants";var args=new ArrayList<Object>(List.of(u.id()));String where=" WHERE fav.customer_id=? AND fav."+col+" IS NOT NULL";if(!q.q().isEmpty()){where+=" AND t.name LIKE ? ESCAPE '='";args.add(q.like());}String alias=type.equals("FOOD")?"r":"t";String sort=q.sort().equals("price")?(type.equals("FOOD")?"t.base_price ASC":"COALESCE((SELECT MIN(f.base_price) FROM foods f WHERE f.restaurant_id=t.id AND f.available=TRUE),0) ASC"):q.sort().equals("distance")?alias+".sample_distance_m ASC":alias+".sample_rating DESC";args.add(q.size()+1);args.add(q.offset());
  var rows=db.rows("SELECT t.*,fav.created_at AS saved_at"+(type.equals("FOOD")?",r.available AS restaurant_available":"")+" FROM favorites fav JOIN "+table+" t ON t.id=fav."+col+(type.equals("FOOD")?" JOIN restaurants r ON r.id=t.restaurant_id":"")+where+" ORDER BY "+sort+",t.id LIMIT ? OFFSET ?",args.toArray());return q.envelope(rows.stream().map(r->m("type",type,"targetId",id(r.get("id")),"summary",type.equals("FOOD")?catalog.foodSummary(r):catalog.restaurantSummary(r),"savedAt",iso(r.get("saved_at")))).toList());}
 public Object save(UserPrincipal u,String type,long targetId,boolean save){u.requireRole("CUSTOMER");String col=column(type);require(targetId>0,400,"INVALID_TARGET","ID không hợp lệ.");db.required("SELECT id FROM users WHERE id=? FOR UPDATE",u.id());if(save){db.required("SELECT id FROM "+(type.equals("FOOD")?"foods":"restaurants")+" WHERE id=?",targetId);if(db.one("SELECT id FROM favorites WHERE customer_id=? AND "+col+"=?",u.id(),targetId)==null)db.insert("favorites",m("customer_id",u.id(),col,targetId));}else db.update("DELETE FROM favorites WHERE customer_id=? AND "+col+"=?",u.id(),targetId);return m("saved",save);}
}
