package fit.iuh.foodgobackend.account;
import fit.iuh.foodgobackend.common.Api;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
@RestController @RequestMapping("/api/v1/addresses") public class AddressController {
 private final AddressService s;public AddressController(AddressService s){this.s=s;}
 @GetMapping Object list(@AuthenticationPrincipal UserPrincipal u){return Api.ok(s.list(u));}
 @PostMapping Object add(@AuthenticationPrincipal UserPrincipal u,@Valid @RequestBody AddressService.Input in){return Api.response(201,s.save(u,null,in));}
 @PutMapping("/{id}") Object edit(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id,@Valid @RequestBody AddressService.Input in){return Api.ok(s.save(u,id,in));}
 @DeleteMapping("/{id}") Object remove(@AuthenticationPrincipal UserPrincipal u,@PathVariable long id){s.delete(u,id);return Api.ok(java.util.Map.of("deleted",true));}
}
