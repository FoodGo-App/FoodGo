package fit.iuh.foodgobackend.account;
import static fit.iuh.foodgobackend.common.Data.*;
import fit.iuh.foodgobackend.common.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.security.SecureRandom;
import java.time.Instant;
import java.sql.Timestamp;
import java.util.*;
@Service @Transactional public class AuthService {
 private final AccountRepository repo;private final BCryptPasswordEncoder passwords=new BCryptPasswordEncoder();
 public AuthService(AccountRepository repo){this.repo=repo;}
 public Map<String,Object> login(String username,String password){var u=repo.db.one("SELECT * FROM users WHERE username=?",username);require(u!=null&&bool(u.get("enabled"))&&passwords.matches(password,s(u,"password_hash")),401,"INVALID_CREDENTIALS","Tên đăng nhập hoặc mật khẩu không đúng.");byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);var expiry=Instant.now().plusSeconds(86400);repo.db.insert("auth_sessions",m("user_id",n(u,"id"),"token_hash",hash(token),"expires_at",Timestamp.from(expiry)));return m("token",token,"expiresAt",expiry.toString(),"user",principal(u,hash(token)).dto());}
 public UserPrincipal authenticate(String token){var u=repo.db.one("SELECT u.*,s.token_hash FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>UTC_TIMESTAMP(3) AND u.enabled=TRUE",hash(token));require(u!=null,401,"SESSION_EXPIRED","Phiên đã hết hạn. Hãy đăng nhập lại.");return principal(u,hash(token));}
 private UserPrincipal principal(Map<String,Object> u,String h){return new UserPrincipal(n(u,"id"),s(u,"display_name"),s(u,"role"),u.get("restaurant_id")==null?null:n(u,"restaurant_id"),h);}
 public void logout(UserPrincipal u){repo.db.update("UPDATE auth_sessions SET revoked_at=UTC_TIMESTAMP(3) WHERE token_hash=?",u.tokenHash());}
}
