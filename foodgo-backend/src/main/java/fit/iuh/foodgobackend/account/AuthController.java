package fit.iuh.foodgobackend.account;
import fit.iuh.foodgobackend.common.Api;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
@RestController @RequestMapping("/api/v1/auth") public class AuthController {
 private final AuthService service;public AuthController(AuthService service){this.service=service;}
 public record Login(@NotBlank @Size(max=80) String username,@NotBlank @Size(max=128) String password){}
 @PostMapping("/login") Object login(@Valid @RequestBody Login body){return Api.ok(service.login(body.username(),body.password()));}
 @GetMapping("/me") Object me(@AuthenticationPrincipal UserPrincipal u){return Api.ok(u.dto());}
 @PostMapping("/logout") Object logout(@AuthenticationPrincipal UserPrincipal u){service.logout(u);return Api.ok(java.util.Map.of("revoked",true));}
}
