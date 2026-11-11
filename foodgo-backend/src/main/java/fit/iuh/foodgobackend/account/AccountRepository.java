package fit.iuh.foodgobackend.account;
import fit.iuh.foodgobackend.common.JpaSql;
import org.springframework.stereotype.Repository;
import java.util.*;
@Repository public class AccountRepository {
 public final JpaSql db;public AccountRepository(JpaSql db){this.db=db;}
 public Map<String,Object> user(long id,boolean lock){return db.required("SELECT * FROM users WHERE id=?"+(lock?" FOR UPDATE":""),id);}
}
