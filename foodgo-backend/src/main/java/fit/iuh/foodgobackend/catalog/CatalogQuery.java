package fit.iuh.foodgobackend.catalog;
import java.util.*;
import fit.iuh.foodgobackend.common.ApiException;
import static fit.iuh.foodgobackend.common.Data.*;
public record CatalogQuery(String q,Long categoryId,Long restaurantId,String areaCode,String sort,int page,int size) {
 public static CatalogQuery parse(Map<String,String> values){
  try {
   String q=values.getOrDefault("q","").trim();String area=values.getOrDefault("areaCode","");String sort=values.getOrDefault("sort","rating");
   require(q.length()<=100,400,"INVALID_FILTER","Từ khóa tối đa 100 ký tự.");
   require(area.isEmpty()||area.equals("AREA_A"),400,"INVALID_FILTER","Khu vực mẫu không hợp lệ.");
   require(Set.of("rating","distance","price").contains(sort),400,"INVALID_FILTER","Sắp xếp không hợp lệ.");
   int page=Integer.parseInt(values.getOrDefault("page","0")),size=Integer.parseInt(values.getOrDefault("size","20"));
   require(page>=0&&page<=10000&&size>=1&&size<=50,400,"INVALID_PAGE","Trang không hợp lệ.");
   return new CatalogQuery(q,positive(values.get("categoryId")),positive(values.get("restaurantId")),area,sort,page,size);
  }catch(NumberFormatException e){throw new ApiException(400,"INVALID_FILTER","Bộ lọc không hợp lệ.");}
 }
 private static Long positive(String v){if(v==null||v.isBlank())return null;long id=Long.parseLong(v);require(id>0,400,"INVALID_FILTER","ID không hợp lệ.");return id;}
 public String like(){return "%"+q.replace("=","==").replace("%","=%").replace("_","=_")+"%";}
 public Map<String,Object> envelope(List<?> fetched){return m("data",fetched.stream().limit(size).toList(),"meta",m("page",page,"size",size,"hasNext",fetched.size()>size));}
 public long offset(){return (long)page*size;}
}
