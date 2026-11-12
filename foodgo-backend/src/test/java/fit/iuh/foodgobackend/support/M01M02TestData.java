package fit.iuh.foodgobackend.support;
import fit.iuh.foodgobackend.common.*;
import static fit.iuh.foodgobackend.common.Data.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.*;
/** Controlled test-only records; never deletes/resets existing data or uses development runners. */
public final class M01M02TestData {
 public static final String PASSWORD="Fixture-only-M01M02!";
 public record Fixture(long customer,long other,long restaurant,long secondRestaurant,long food,long secondFood,long small,long large,long category,String username,String otherUsername,String restaurantUsername,String driverUsername){}
 public static Fixture create(JpaSql db){String tag=UUID.randomUUID().toString().replace("-","");
  long r=restaurant(db,"Quán test "+tag,"T_"+tag.substring(0,22)),r2=restaurant(db,"Quán khác "+tag,"U_"+tag.substring(0,22));
  long c=db.insert("categories",m("name","Test_"+tag,"sort_order",0));
  long food=food(db,r,c,"Món test "+tag,40000),second=food(db,r2,c,"Món khác "+tag,30000);
  long group=db.insert("option_groups",m("food_id",food,"name","Cỡ","min_select",1,"max_select",1,"sort_order",0));
  long small=db.insert("option_values",m("group_id",group,"name","Vừa","extra_price",0,"available",true)),large=db.insert("option_values",m("group_id",group,"name","Lớn","extra_price",5000,"available",true));
  db.insert("offers",m("restaurant_id",r,"code","T_"+tag,"name","Ưu đãi test riêng","kind","PERCENT","percent",10,"cap",30000,"min_subtotal",100000,"starts_at",java.sql.Timestamp.from(java.time.Instant.parse("2026-01-01T00:00:00Z")),"ends_at",java.sql.Timestamp.from(java.time.Instant.parse("2027-12-31T00:00:00Z")),"enabled",true));
  String user="m01_"+tag,other="other_"+tag,rest="rest_"+tag,driver="driver_"+tag;
  return new Fixture(user(db,user,"CUSTOMER",null),user(db,other,"CUSTOMER",null),r,r2,food,second,small,large,c,user,other,rest,driverWithOwner(db,rest,driver,r));
 }
 private static String driverWithOwner(JpaSql db,String rest,String driver,long r){user(db,rest,"RESTAURANT",r);user(db,driver,"DRIVER",null);return driver;}
 private static long restaurant(JpaSql db,String name,String point){return db.insert("restaurants",m("name",name,"area_code","AREA_A","address_text","Địa chỉ test","map_point_code",point,"image_code","","available",true,"sample_rating",4.8,"sample_distance_m",1000,"sample_eta_minutes",20,"sample_reviews_json","[]"));}
 private static long food(JpaSql db,long r,long c,String name,long price){return db.insert("foods",m("restaurant_id",r,"category_id",c,"name",name,"description","Dữ liệu test riêng","base_price",price,"kind","SINGLE","image_code","CHICKEN_RICE","available",true));}
 private static long user(JpaSql db,String name,String role,Long r){return db.insert("users",m("username",name,"password_hash",new BCryptPasswordEncoder().encode(PASSWORD),"display_name","Test "+role,"role",role,"restaurant_id",r,"driver_area_code",role.equals("DRIVER")?"AREA_A":null,"enabled",true));}
}
