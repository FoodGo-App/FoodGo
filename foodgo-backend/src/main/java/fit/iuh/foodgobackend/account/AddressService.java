package fit.iuh.foodgobackend.account;
import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.common.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.constraints.*;
import java.util.*;
@Service @Transactional public class AddressService {
 private final AccountRepository repo;public AddressService(AccountRepository repo){this.repo=repo;}
 public record Input(@NotBlank @Size(max=100) String recipientName,@Pattern(regexp="0[0-9]{9}") @NotNull String recipientPhone,@NotBlank @Size(max=255) String addressText,@NotBlank @Size(max=40) String label,@NotBlank String areaCode,@NotBlank String mapPointCode){}
 public List<Map<String,Object>> list(UserPrincipal u){u.requireRole("CUSTOMER");return repo.db().rows("SELECT * FROM addresses WHERE customer_id=? ORDER BY id",u.id()).stream().map(a->m("id",id(a.get("id")),"recipientName",a.get("recipient_name"),"recipientPhone",a.get("recipient_phone"),"addressText",a.get("address_text"),"label",a.get("label"),"areaCode",a.get("area_code"),"mapPointCode",a.get("map_point_code"))).toList();}
 public Object save(UserPrincipal u,Long id,Input in){u.requireRole("CUSTOMER");repo.user(u.id(),true);require(in.areaCode().equals("AREA_A")&&Set.of("CUSTOMER_A","CUSTOMER_B").contains(in.mapPointCode()),400,"INVALID_ADDRESS","Khu vực hoặc điểm mẫu chưa được hỗ trợ.");if(id==null){require(list(u).size()<10,409,"ADDRESS_LIMIT","Tối đa 10 địa chỉ.");id=repo.db().insert("addresses",m("customer_id",u.id(),"recipient_name",in.recipientName(),"recipient_phone",in.recipientPhone(),"address_text",in.addressText(),"label",in.label(),"area_code",in.areaCode(),"map_point_code",in.mapPointCode()));}else{repo.db().required("SELECT id FROM addresses WHERE id=? AND customer_id=?",id,u.id());repo.db().update("UPDATE addresses SET recipient_name=?,recipient_phone=?,address_text=?,label=?,area_code=?,map_point_code=?,updated_at=UTC_TIMESTAMP(3) WHERE id=?",in.recipientName(),in.recipientPhone(),in.addressText(),in.label(),in.areaCode(),in.mapPointCode(),id);}long result=id;return list(u).stream().filter(a->n(a,"id")==result).findFirst().orElseThrow();}
 public void delete(UserPrincipal u,long id){u.requireRole("CUSTOMER");repo.user(u.id(),true);repo.db().required("SELECT id FROM addresses WHERE id=? AND customer_id=?",id,u.id());repo.db().update("DELETE FROM addresses WHERE id=?",id);}
}
