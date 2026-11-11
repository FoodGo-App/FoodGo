package fit.iuh.foodgobackend.account;
import java.util.Map;
import fit.iuh.foodgobackend.common.Data;
public record UserPrincipal(long id,String displayName,String role,Long restaurantId,String tokenHash){
 public void requireRole(String expected){Data.require(role.equals(expected),403,"FORBIDDEN","Vai trò không được phép thực hiện thao tác.");}
 public Map<String,Object> dto(){return Data.m("id",Long.toString(id),"displayName",displayName,"role",role,"restaurantId",restaurantId==null?null:restaurantId.toString());}
}
