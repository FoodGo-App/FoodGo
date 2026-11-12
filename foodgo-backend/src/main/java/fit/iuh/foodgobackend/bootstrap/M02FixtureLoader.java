package fit.iuh.foodgobackend.bootstrap;
import fit.iuh.foodgobackend.common.*;
import static fit.iuh.foodgobackend.common.Data.*;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.annotation.Order;
import java.util.*;
/** Explicit local-only demo data; inserts missing rows and never replaces user data. */
@Component @Order(20) @Profile("local & !prod & !test & !m01-test & !flow-test")
@ConditionalOnProperty(name="foodgo.seed-enabled",havingValue="true",matchIfMissing=false)
public class M02FixtureLoader implements CommandLineRunner {
 private final JpaSql db;public M02FixtureLoader(JpaSql db){this.db=db;}
 @Override @Transactional public void run(String... args){
  var first=db.one("SELECT id FROM restaurants WHERE map_point_code=?","REST_01");var second=db.one("SELECT id FROM restaurants WHERE map_point_code=?","REST_02");if(first==null||second==null)return;
  long rice=category("Cơm",1),drink=category("Đồ uống",2),r1=n(first,"id"),r2=n(second,"id");
  long chicken=food(r1,rice,"Cơm gà nướng",40000,"CHICKEN_RICE","SINGLE");
  long size=group(chicken,"Phần ăn",1,1,0);option(size,"Vừa",0);option(size,"Lớn",5000);
  long toppings=group(chicken,"Thêm món",0,2,1);option(toppings,"Trứng",5000);option(toppings,"Rau",0);
  food(r1,rice,"Cơm nấm kho",40000,"MUSHROOM_RICE","SINGLE");
  long combo=food(r1,rice,"Combo Panda",90000,"CHICKEN_RICE","COMBO");long drinks=group(combo,"Nước trong combo",1,1,0);option(drinks,"Trà",0);option(drinks,"Nước cam",5000);
  long tea=food(r2,drink,"Trà sữa Panda",30000,"","SINGLE");long cup=group(tea,"Cỡ ly",1,1,0);option(cup,"M",0);option(cup,"L",5000);
  offer("TRUA10","Giảm 10% tiền món","PERCENT",10L,null,30000L,100000L,null);
  offer("SHIP5","Giảm 5.000đ phí giao","DELIVERY_DISCOUNT",null,5000L,null,0L,null);
  offer("FREESHIP","Miễn phí giao mẫu","FREE_DELIVERY",null,null,null,100000L,null);
  offer("VI10","Giảm 10% với ví mô phỏng","PERCENT",10L,null,30000L,100000L,"MOCK_WALLET");
 }
 private long category(String name,int order){var old=db.one("SELECT id FROM categories WHERE name=?",name);return old==null?db.insert("categories",m("name",name,"sort_order",order)):n(old,"id");}
 private long food(long r,long c,String name,long price,String image,String kind){var old=db.one("SELECT id FROM foods WHERE restaurant_id=? AND name=?",r,name);return old==null?db.insert("foods",m("restaurant_id",r,"category_id",c,"name",name,"description","Món minh họa FoodGo, hình và thông tin mẫu.","base_price",price,"kind",kind,"image_code",image,"available",true)):n(old,"id");}
 private long group(long food,String name,int min,int max,int order){var old=db.one("SELECT id FROM option_groups WHERE food_id=? AND name=?",food,name);return old==null?db.insert("option_groups",m("food_id",food,"name",name,"min_select",min,"max_select",max,"sort_order",order)):n(old,"id");}
 private void option(long group,String name,long price){if(db.one("SELECT id FROM option_values WHERE group_id=? AND name=?",group,name)==null)db.insert("option_values",m("group_id",group,"name",name,"extra_price",price,"available",true));}
 private void offer(String code,String name,String kind,Long percent,Long amount,Long cap,long min,String method){if(db.one("SELECT id FROM offers WHERE code=?",code)==null)db.insert("offers",m("code",code,"name",name,"kind",kind,"percent",percent,"amount",amount,"cap",cap,"min_subtotal",min,"required_method",method,"starts_at",java.sql.Timestamp.from(java.time.Instant.parse("2026-01-01T00:00:00Z")),"ends_at",java.sql.Timestamp.from(java.time.Instant.parse("2027-12-31T00:00:00Z")),"enabled",true));}
}
