package fit.iuh.foodgobackend.common;
import java.util.*;
import org.springframework.http.ResponseEntity;
public final class Api {
 private Api(){}
 public static Map<String,Object> ok(Object value){return Data.m("data",value);}
 public static Map<String,Object> error(String code,String message){return Data.m("error",Data.m("code",code,"message",message));}
 public static Map<String,Object> page(List<?> items,int page,int size){Data.require(page>=0&&size>=1&&size<=50,400,"INVALID_PAGE","Trang không hợp lệ.");return Data.m("data",items.stream().skip((long)page*size).limit(size).toList(),"meta",Data.m("page",page,"size",size,"hasNext",items.size()>(long)(page+1)*size));}
 public static ResponseEntity<Object> response(int status,Object value){return ResponseEntity.status(status).body(ok(value));}
}
